// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Loader2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getRoomsWithBeds, addRoom, updateRoom } from '../lib/api'

interface BedData { id: string; bed_number: string; status: string; students?: { full_name: string }[] }
interface RoomData { id: string; room_number: string; floor: string | null; type: string; capacity: number; monthly_fee: number; beds: BedData[] }

export function Rooms() {
  const { user } = useAuth()
  const [hostelId, setHostelId] = useState<string | null>(null)
  // Remove local rooms state, use React Query
  // Removed duplicate loading state; use React Query loading only
  const [filter, setFilter] = useState('All')
  const [searchRooms, setSearchRooms] = useState('')

  // Modals state
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [editRoomData, setEditRoomData] = useState<RoomData | null>(null)
  
  // Forms state
  const [newRoom, setNewRoom] = useState({ room_number: '', floor: '', capacity: 3, type: 'Non-AC' as 'AC' | 'Non-AC', monthly_fee: 5000 })
  const [editForm, setEditForm] = useState({ room_number: '', floor: '', type: 'Non-AC' as 'AC' | 'Non-AC', monthly_fee: 0, capacity: 0 })
  
  const [saving, setSaving] = useState(false)


  // React Query: fetch rooms
  const queryClient = useQueryClient()
  const {
    data: roomsData = [],
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['rooms', hostelId],
    queryFn: () => hostelId ? getRoomsWithBeds(hostelId) : Promise.resolve([]),
    enabled: !!hostelId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(h => { if (h) setHostelId(h.id) })
  }, [user])

  const handleAddRoom = async () => {
    if (!hostelId || !newRoom.room_number) return toast.error('Room number is required')
    if (newRoom.monthly_fee <= 0) return toast.error('Monthly fee must be greater than 0')
    setSaving(true)
    try {
      await addRoom({ hostel_id: hostelId, ...newRoom })
      toast.success(`Room ${newRoom.room_number} created with ${newRoom.capacity} beds!`)
      setShowAddRoom(false)
      setNewRoom({ room_number: '', floor: '', capacity: 3, type: 'Non-AC', monthly_fee: 5000 })
      queryClient.invalidateQueries({ queryKey: ['rooms', hostelId] })
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleEditRoomSubmit = async () => {
    if (!editRoomData) return
    setSaving(true)
    try {
      await updateRoom(editRoomData.id, editForm)
      toast.success(`Room ${editForm.room_number} updated successfully!`)
      setEditRoomData(null)
      queryClient.invalidateQueries({ queryKey: ['rooms', hostelId] })
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const openEditModal = (room: RoomData) => {
    setEditRoomData(room)
    setEditForm({
      room_number: room.room_number,
      floor: room.floor ?? '',
      type: room.type as 'AC' | 'Non-AC',
      monthly_fee: room.monthly_fee,
      capacity: room.capacity
    })
  }

  const floors = [...new Set(roomsData.map(r => r.floor).filter(Boolean))]
  const filterOptions = ['All', ...floors as string[]]
  const filtered = roomsData
    .filter(r => filter === 'All' || r.floor === filter)
    .filter(r =>
      !searchRooms ||
      r.room_number.toLowerCase().includes(searchRooms.toLowerCase()) ||
      (r.floor ?? '').toLowerCase().includes(searchRooms.toLowerCase())
    )

  // Use React Query loading state
  const loading = isLoading || isFetching

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rooms & Beds</h1>
          <p className="text-slate-500 mt-1">Manage layout, availability, and bed configuration.</p>
        </div>
        <button onClick={() => setShowAddRoom(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />Add Room
        </button>
      </div>

      {/* Add/Edit Room Modal */}
      {(showAddRoom || editRoomData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{editRoomData ? 'Edit Room' : 'Add New Room'}</h2>
            <p className="text-sm text-slate-500 mb-5">
              {editRoomData 
                ? 'Update room pricing, capacity, and layout.' 
                : 'Beds are auto-generated based on capacity. Monthly fee is auto-assigned to each student.'}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Room Number *</label>
                  <input 
                    value={editRoomData ? editForm.room_number : newRoom.room_number} 
                    onChange={e => editRoomData ? setEditForm(p => ({...p, room_number: e.target.value})) : setNewRoom(p => ({ ...p, room_number: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="e.g. 101" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Floor</label>
                  <input 
                    value={editRoomData ? editForm.floor : newRoom.floor} 
                    onChange={e => editRoomData ? setEditForm(p => ({...p, floor: e.target.value})) : setNewRoom(p => ({ ...p, floor: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="e.g. 1st Floor" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Capacity (Beds)</label>
                  <input 
                    type="number" min={editRoomData ? editRoomData.capacity : 1} max={10} 
                    value={editRoomData ? editForm.capacity : newRoom.capacity} 
                    onChange={e => editRoomData ? setEditForm(p => ({...p, capacity: +e.target.value})) : setNewRoom(p => ({ ...p, capacity: +e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    disabled={!!editRoomData && editForm.capacity < editRoomData.capacity} // can only increase capacity for now
                  />
                  {editRoomData && <p className="text-[10px] text-slate-400 mt-0.5">Capacity can only be increased.</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select 
                    value={editRoomData ? editForm.type : newRoom.type} 
                    onChange={e => editRoomData ? setEditForm(p => ({...p, type: e.target.value as 'AC' | 'Non-AC'})) : setNewRoom(p => ({ ...p, type: e.target.value as 'AC' | 'Non-AC' }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option>Non-AC</option><option>AC</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Monthly Fee (₹) *</label>
                {!editRoomData && <p className="text-xs text-slate-400 mb-1">Auto-added to student's profile when a bed is assigned</p>}
                <input 
                  type="number" min={0} 
                  value={editRoomData ? editForm.monthly_fee : newRoom.monthly_fee} 
                  onChange={e => editRoomData ? setEditForm(p => ({...p, monthly_fee: +e.target.value})) : setNewRoom(p => ({ ...p, monthly_fee: +e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="e.g. 5000" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowAddRoom(false); setEditRoomData(null); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
              <button onClick={editRoomData ? handleEditRoomSubmit : handleAddRoom} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : editRoomData ? 'Save Changes' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          {filterOptions.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                filter === f ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-50 border border-transparent")} >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-52 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search room or floor..."
            value={searchRooms}
            onChange={e => setSearchRooms(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3 text-slate-400"><Loader2 className="animate-spin h-5 w-5" /><span>Loading rooms...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card-premium flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
          <p className="font-medium">No rooms yet.</p>
          <p className="text-sm">Click "Add Room" to create your first room with auto-generated beds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((room) => {
            const occupied = room.beds.filter(b => b.status === 'occupied').length
            return (
              <div key={room.id} className="card-premium flex flex-col group">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">Room {room.room_number}</h3>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold border border-slate-200">{room.type}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{room.floor ?? 'No floor set'}</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-0.5">₹{Number(room.monthly_fee).toLocaleString('en-IN')}/month</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => openEditModal(room)} 
                      className="text-slate-400 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                      title="Edit Room Details"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">{occupied}/{room.capacity}</span>
                  </div>
                </div>
                <div className="p-5 flex-1 bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-3">
                    {room.beds.map(bed => {
                      // Note: Supabase nested array might be empty or missing depending on join config
                      // Ensure student name resolves smoothly
                      const occupants = bed.students || [];
                      const occupantName = occupants.length > 0 ? occupants[0].full_name : null;
                      
                      return (
                        <div key={bed.id}
                          className={cn("p-3 rounded-lg border flex flex-col gap-1 transition-transform hover:scale-[1.02] cursor-pointer",
                            bed.status === 'available' && "bg-white border-emerald-200 hover:border-emerald-300",
                            bed.status === 'occupied' && "bg-blue-50 border-blue-200",
                            bed.status === 'maintenance' && "bg-amber-50 border-amber-200"
                          )}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">{bed.bed_number}</span>
                            <div className={cn("h-2 w-2 rounded-full",
                              bed.status === 'available' ? "bg-emerald-500" : bed.status === 'occupied' ? "bg-blue-500" : "bg-amber-500")} />
                          </div>
                          <span className="text-xs truncate font-medium">
                            {bed.status === 'occupied' 
                              ? (occupantName ? <span className="text-blue-700">{occupantName}</span> : 'Occupied') 
                              : <span className="text-slate-400 capitalize">{bed.status}</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
