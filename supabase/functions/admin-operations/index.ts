// supabase/functions/admin-operations/index.ts
// Deploy: supabase functions deploy admin-operations
// This Edge Function runs server-side with the service role key.
// The browser NEVER sees the service key again.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Admin client — only lives server-side
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller's JWT and get their profile
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check caller is admin or super_admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, payload } = await req.json()

    // ── Action router ─────────────────────────────────────────────────────────
    switch (action) {

      // CREATE STUDENT AUTH ACCOUNT
      case 'create_student_user': {
        const { email, phone, full_name, hostel_id } = payload

        // Build a unique email — scoped to hostel to avoid cross-tenant collisions
        const authEmail = email?.trim() ||
          `${phone.replace(/\D/g, '')}.${hostel_id.substring(0, 8)}@hostel.local`

        const password = generatePassword()

        // Check uniqueness across ALL hostels before creating
        const { data: existingList } = await supabaseAdmin.auth.admin.listUsers()
        const exists = existingList?.users?.find(u =>
          u.email?.toLowerCase() === authEmail.toLowerCase()
        )
        if (exists) {
          return new Response(JSON.stringify({
            error: `Email ${authEmail} already registered. Use a different email or phone.`
          }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { data: authData, error: authErr2 } = await supabaseAdmin.auth.admin.createUser({
          email: authEmail,
          email_confirm: true,
          password,
          user_metadata: { full_name, role: 'student' }
        })
        if (authErr2) throw new Error(authErr2.message)

        // Write profile row immediately
        await supabaseAdmin.from('profiles').upsert({
          id: authData.user.id,
          email: authEmail,
          role: 'student'
        })

        // Credentials are returned once — student must change on first login
        return new Response(JSON.stringify({
          user_id: authData.user.id,
          credentials: { email: authEmail, password, must_change: true }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // CREATE HOSTEL + OWNER (super admin only)
      case 'create_hostel': {
        if (profile.role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        const { ownerEmail, ownerName, ownerPhone, hostelName, address,
                contactEmail, contactPhone, floors, menu } = payload

        const tempPassword = generatePassword()

        // Create or find owner
        let ownerId: string
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
        const existing = listData?.users?.find(u =>
          u.email?.toLowerCase() === ownerEmail.toLowerCase()
        )

        if (existing) {
          ownerId = existing.id
          await supabaseAdmin.auth.admin.updateUserById(ownerId, {
            password: tempPassword,
            user_metadata: { role: 'admin', full_name: ownerName }
          })
        } else {
          const { data: newUser, error: newErr } = await supabaseAdmin.auth.admin.createUser({
            email: ownerEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { role: 'admin', full_name: ownerName }
          })
          if (newErr) throw new Error(newErr.message)
          ownerId = newUser.user.id
        }

        await supabaseAdmin.from('profiles').upsert({
          id: ownerId, email: ownerEmail, role: 'admin'
        })

        // Check duplicate hostel name for this owner
        const { data: dupHostel } = await supabaseAdmin
          .from('hostels').select('id').eq('owner_id', ownerId).eq('name', hostelName).maybeSingle()
        if (dupHostel) throw new Error(`Hostel "${hostelName}" already exists for this owner`)

        const { data: hostel, error: hostelErr } = await supabaseAdmin.from('hostels').insert({
          owner_id: ownerId, name: hostelName, address,
          contact_email: contactEmail || ownerEmail,
          contact_phone: contactPhone || ownerPhone,
          total_floors: floors?.length || 0
        }).select().single()
        if (hostelErr) throw new Error(hostelErr.message)

        // Save food menu
        if (menu) {
          await supabaseAdmin.from('food_menus')
            .upsert({ hostel_id: hostel.id, menu })
        }

        // Create rooms and beds
        let roomsCreated = 0, bedsCreated = 0
        for (const floor of (floors || [])) {
          for (const room of floor.rooms) {
            const { data: roomData, error: roomErr } = await supabaseAdmin.from('rooms').insert({
              hostel_id: hostel.id,
              room_number: room.roomNumber,
              floor: floor.floorName,
              type: room.type,
              capacity: room.beds,
              monthly_fee: room.monthlyFee ?? room.monthly_fee ?? 0,
            }).select().single()
            if (roomErr) continue
            roomsCreated++

            const bedInserts = Array.from({ length: room.beds }, (_, bi) => ({
              hostel_id: hostel.id,
              room_id: roomData.id,
              bed_number: `B${bi + 1}`,
              status: 'available'
            }))
            const { error: bedErr } = await supabaseAdmin.from('beds').insert(bedInserts)
            if (!bedErr) bedsCreated += room.beds
          }
        }

        return new Response(JSON.stringify({
          hostel_id: hostel.id,
          credentials: { email: ownerEmail, password: tempPassword },
          summary: `${roomsCreated} rooms, ${bedsCreated} beds`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // LIST AUTH USERS (super admin only)
      case 'list_users': {
        if (profile.role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        const { data } = await supabaseAdmin.auth.admin.listUsers()
        return new Response(JSON.stringify({ users: data.users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // RESET USER PASSWORD (super admin only)
      case 'reset_password': {
        if (profile.role !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Super admin only' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        const newPass = generatePassword()
        const { error: resetErr } = await supabaseAdmin.auth.admin
          .updateUserById(payload.user_id, { password: newPass })
        if (resetErr) throw new Error(resetErr.message)
        return new Response(JSON.stringify({ new_password: newPass }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}
