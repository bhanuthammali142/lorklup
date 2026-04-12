// supabase/functions/admin-ops/index.ts
// Supabase Edge Function — handles ALL service-role operations server-side.
// The service role key NEVER leaves this function.
//
// Deploy: supabase functions deploy admin-ops --no-verify-jwt
// (We verify JWT manually inside the function for flexibility)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Build service-role client (key from Supabase secrets — never exposed to frontend) ──
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // ── Verify caller's JWT ──
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401)
  }

  // ── Resolve caller role from profiles ──
  const callerEmail = caller.email ?? ''
  const callerRole = caller.user_metadata?.role ?? null

  // Super admin check (platform owner emails)
  const SUPER_ADMIN_EMAILS = ['bhanuthammali2601@gmail.com', 'admin@hostelos.com']
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(callerEmail)

  // Admin check — must own a hostel
  const { data: callerHostel } = await supabaseAdmin
    .from('hostels')
    .select('id')
    .eq('owner_id', caller.id)
    .maybeSingle()
  const isAdmin = !!callerHostel || callerRole === 'admin'

  // ── Parse request body ──
  let body: { action: string; payload: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { action, payload } = body

  // ── Route actions ──
  try {
    switch (action) {

      // ── Create student auth user (admin action) ──
      case 'create-student-user': {
        if (!isAdmin && !isSuperAdmin) {
          return jsonResponse({ error: 'Only admins can create students' }, 403)
        }

        const { email, password, full_name } = payload as {
          email: string; password: string; full_name: string
        }

        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name, role: 'student' },
        })

        if (authErr) {
          if (authErr.message.includes('already exists')) {
            return jsonResponse({
              error: `A user with email ${email} already exists. Please use a different one.`,
            }, 409)
          }
          throw authErr
        }

        // Write student role to profiles table
        const userId = authData.user.id
        await supabaseAdmin
          .from('profiles')
          .upsert({ id: userId, email, role: 'student' })

        return jsonResponse({ userId })
      }

      // ── Create admin auth user (super admin only) ──
      case 'create-admin-user': {
        if (!isSuperAdmin) {
          return jsonResponse({ error: 'Only super admins can create admin users' }, 403)
        }

        const { email, password, full_name } = payload as {
          email: string; password: string; full_name: string
        }

        // Try create, fall back to find existing
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: 'admin', full_name },
        })

        let userId: string
        let isExisting = false

        if (authErr) {
          // Try to find existing user
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          })
          const existing = listData?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          )

          if (existing) {
            userId = existing.id
            isExisting = true
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              password,
              user_metadata: { role: 'admin', full_name },
            })
          } else {
            throw new Error(authErr.message || 'Failed to create admin user')
          }
        } else {
          userId = authData.user.id
        }

        // Upsert profile
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          email,
          role: 'admin',
        })

        return jsonResponse({ userId, isExisting })
      }

      // ── List all hostels (super admin only) ──
      case 'list-all-hostels': {
        if (!isSuperAdmin) {
          return jsonResponse({ error: 'Super admin access required' }, 403)
        }

        const { data, error } = await supabaseAdmin
          .from('hostels')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return jsonResponse({ hostels: data })
      }

      // ── Create hostel with rooms/beds (super admin only) ──
      case 'create-hostel': {
        if (!isSuperAdmin) {
          return jsonResponse({ error: 'Super admin access required' }, 403)
        }

        const { ownerId, hostelName, address, contactEmail, contactPhone, totalFloors, floors, menu } =
          payload as any

        // Check for duplicate hostel name for this owner
        const { data: existingHostel } = await supabaseAdmin
          .from('hostels')
          .select('id')
          .eq('owner_id', ownerId)
          .eq('name', hostelName)
          .maybeSingle()

        if (existingHostel) {
          return jsonResponse({
            error: `A hostel named "${hostelName}" already exists for this owner.`,
          }, 409)
        }

        // Create hostel
        const { data: hostelData, error: hostelErr } = await supabaseAdmin
          .from('hostels')
          .insert({
            owner_id: ownerId,
            name: hostelName,
            address,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            total_floors: totalFloors,
          })
          .select()
          .single()

        if (hostelErr) throw hostelErr
        const hostelId = hostelData.id

        // Save food menu (optional)
        if (menu) {
          await supabaseAdmin.from('food_menus').upsert({ hostel_id: hostelId, menu })
        }

        // Create rooms and beds
        let roomsCreated = 0
        let bedsCreated = 0

        for (const floor of floors || []) {
          for (const room of floor.rooms || []) {
            const { data: roomData, error: roomErr } = await supabaseAdmin
              .from('rooms')
              .insert({
                hostel_id: hostelId,
                room_number: room.roomNumber,
                floor: floor.floorName,
                type: room.type,
                capacity: room.beds,
              })
              .select()
              .single()

            if (roomErr) continue
            roomsCreated++

            const bedInserts = Array.from({ length: room.beds }, (_, bi) => ({
              hostel_id: hostelId,
              room_id: roomData.id,
              bed_number: `B${bi + 1}`,
              status: 'available',
            }))

            const { error: bedErr } = await supabaseAdmin.from('beds').insert(bedInserts)
            if (!bedErr) bedsCreated += room.beds
          }
        }

        return jsonResponse({
          hostelId,
          hostelCode: hostelData.hostel_code || 'HOS-xxx',
          roomsCreated,
          bedsCreated,
        })
      }

      // ── Superadmin dashboard stats (super admin only) ──
      case 'superadmin-stats': {
        if (!isSuperAdmin) {
          return jsonResponse({ error: 'Super admin access required' }, 403)
        }

        const [
          { count: hostelCount },
          { count: studentCount },
          { count: activeStudentCount },
        ] = await Promise.all([
          supabaseAdmin.from('hostels').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('students').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).not('room_id', 'is', null),
        ])

        return jsonResponse({
          totalHostels: hostelCount ?? 0,
          totalStudents: studentCount ?? 0,
          activeStudents: activeStudentCount ?? 0,
        })
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error(`[admin-ops] ${action} failed:`, message)
    return jsonResponse({ error: message }, 500)
  }
})
