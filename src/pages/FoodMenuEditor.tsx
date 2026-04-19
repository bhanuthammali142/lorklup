// src/pages/FoodMenuEditor.tsx
// Admin-facing food menu editor. Writes to food_menus table.
import { useEffect, useState } from 'react'
import { UtensilsCrossed, Save, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, getFoodMenu, saveFoodMenu } from '../lib/api'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const

const BLANK_MENU = Object.fromEntries(
  DAYS.map(day => [day, Object.fromEntries(MEALS.map(m => [m, '']))])
)

export function FoodMenuEditor() {
  const { user } = useAuth()
  const [hostelId, setHostelId] = useState<string | null>(null)
  const [menu, setMenu] = useState<Record<string, Record<string, string>>>(BLANK_MENU)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedDay, setExpandedDay] = useState<string>(DAYS[0])

  useEffect(() => {
    if (!user) return
    getOrCreateHostel(user.id).then(async h => {
      if (!h) return
      setHostelId(h.id)
      const existing = await getFoodMenu(h.id)
      if (existing) setMenu(existing as any)
      setLoading(false)
    })
  }, [user])

  const handleSave = async () => {
    if (!hostelId) return
    setSaving(true)
    try {
      await saveFoodMenu(hostelId, menu)
      toast.success('Food menu saved and visible to students!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save menu')
    } finally {
      setSaving(false)
    }
  }

  const setMeal = (day: string, meal: string, value: string) => {
    setMenu(m => ({ ...m, [day]: { ...m[day], [meal]: value } }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin h-6 w-6 text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900">Weekly food menu</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save menu'}
        </button>
      </div>

      <p className="text-sm text-slate-500">
        This menu is visible to all students in their portal. Update it as often as needed.
      </p>

      <div className="space-y-4">
        {DAYS.map(day => (
          <div key={day} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-200">
            <button 
              onClick={() => setExpandedDay(expandedDay === day ? '' : day)}
              className="w-full text-left bg-slate-50 px-5 py-4 flex justify-between items-center hover:bg-slate-100 transition-colors"
            >
              <span className="font-bold text-slate-900">{day}</span>
              <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", expandedDay === day && "rotate-180")} />
            </button>
            {expandedDay === day && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                {MEALS.map(meal => (
                  <div key={meal}>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      {meal}
                    </label>
                    <textarea
                      value={menu[day]?.[meal] || ''}
                      onChange={e => setMeal(day, meal, e.target.value)}
                      rows={2}
                      placeholder={`e.g. Idli, Sambar, Chutney`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none transition"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save menu'}
        </button>
      </div>
    </div>
  )
}
