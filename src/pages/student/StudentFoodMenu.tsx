// @ts-nocheck
/**
 * STUDENT FOOD MENU — Weekly food schedule
 * TEAM RULE: Read-only menu pulled from hostel's food_menu table.
 * Falls back to a hardcoded sample menu if no DB data exists.
 */
import React, { useEffect, useState } from 'react'
import { UtensilsCrossed, ChevronLeft, ChevronRight, Leaf, Flame, Sun, Sunset, Moon } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SAMPLE_MENU: Record<string, { breakfast: string; lunch: string; snack: string; dinner: string }> = {
  Monday:    { breakfast: 'Idli Sambar + Coconut Chutney + Tea/Coffee', lunch: 'Rice, Dal Fry, Aloo Sabzi, Roti, Salad', snack: 'Bread Butter + Chai', dinner: 'Chapati, Paneer Butter Masala, Dal, Rice, Curd' },
  Tuesday:   { breakfast: 'Poha + Boiled Egg / Banana + Tea/Coffee', lunch: 'Rice, Rajma, Jeera Aloo, Roti, Papad', snack: 'Samosa / Biscuits + Chai', dinner: 'Roti, Mix Veg Curry, Yellow Dal, Rice, Pickle' },
  Wednesday: { breakfast: 'Paratha + Curd + Achaar + Tea/Coffee', lunch: 'Rice, Chole, Baingan Bharta, Roti, Buttermilk', snack: 'Fruit Bowl', dinner: 'Chapati, Dal Makhani, Aloo Matar, Rice, Salad' },
  Thursday:  { breakfast: 'Upma + Banana + Tea/Coffee', lunch: 'Rice, Kadhi, Bhindi Fry, Roti, Papad', snack: 'Pakora + Chai', dinner: 'Chapati, Palak Paneer, Dal Tadka, Rice, Curd' },
  Friday:    { breakfast: 'Puri Sabzi + Tea/Coffee', lunch: 'Rice, Arhar Dal, Aloo Gobhi, Roti, Salad', snack: 'Bread Jam + Chai', dinner: 'Roti, Matar Mushroom, Dal, Rice, Raita' },
  Saturday:  { breakfast: 'Masala Dosa + Sambar + Tea/Coffee', lunch: 'Veg Biryani, Raita, Papad, Salad', snack: 'Jalebi / Sweet + Chai', dinner: 'Chapati, Shahi Paneer, Dal Fry, Rice, Gulab Jamun' },
  Sunday:    { breakfast: 'Chole Bhature + Tea/Coffee', lunch: 'Dal Baati Churma / Special Thali (Festive)', snack: 'Maggi / Noodles', dinner: 'Chapati, Butter Chicken / Veg Kofta, Rice, Kheer' },
}

const MEAL_CONFIG = [
  { key: 'breakfast', label: 'Breakfast', icon: Sun,     color: 'text-amber-600', bg: 'bg-amber-50',   border: 'border-amber-200',   time: '7:00 – 9:00 AM' },
  { key: 'lunch',     label: 'Lunch',     icon: Flame,   color: 'text-orange-600',bg: 'bg-orange-50',  border: 'border-orange-200',  time: '12:00 – 2:00 PM' },
  { key: 'snack',     label: 'Snacks',    icon: Leaf,    color: 'text-emerald-600',bg:'bg-emerald-50', border: 'border-emerald-200', time: '5:00 – 6:00 PM' },
  { key: 'dinner',    label: 'Dinner',    icon: Moon,    color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200', time: '7:30 – 9:30 PM' },
]

function getTodayIndex() {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1 // Sunday=6, Mon=0
}

export function StudentFoodMenu() {
  const { studentData } = useAuth()
  const [dbMenu, setDbMenu] = useState<Record<string, any> | null>(null)
  const [selectedDay, setSelectedDay] = useState(getTodayIndex())
  const todayIdx = getTodayIndex()

  useEffect(() => {
    if (!studentData?.hostel_id) return
    // Try to load from food_menu table if it exists
    supabase
      .from('food_menu')
      .select('*')
      .eq('hostel_id', studentData.hostel_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.menu) setDbMenu(data.menu)
      })
      .catch(() => {})
  }, [studentData])

  const menu = (dbMenu ?? SAMPLE_MENU) as Record<string, { breakfast: string; lunch: string; snack: string; dinner: string }>
  const dayName = DAYS[selectedDay]
  const dayMenu = menu[dayName] || SAMPLE_MENU[dayName]

  const goPrev = () => setSelectedDay(d => (d - 1 + 7) % 7)
  const goNext = () => setSelectedDay(d => (d + 1) % 7)

  if (!studentData) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
          <UtensilsCrossed className="h-7 w-7 text-emerald-600" /> Food Menu
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Weekly hostel meal schedule. Times may vary.</p>
      </div>

      {/* Day Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 shrink-0 transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`flex-1 min-w-[2.8rem] flex flex-col items-center py-2.5 px-1 rounded-xl text-center transition-all shrink-0 ${
                  selectedDay === idx
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : idx === todayIdx
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide">{day.slice(0, 3)}</span>
                {idx === todayIdx && selectedDay !== idx && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
          <button onClick={goNext} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 shrink-0 transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Selected Day Header */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">{dayName}</h2>
          {selectedDay === todayIdx && (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
              📅 Today's Menu
            </span>
          )}
        </div>
      </div>

      {/* Meal Cards */}
      <div className="space-y-4">
        {MEAL_CONFIG.map(({ key, label, icon: Icon, color, bg, border, time }) => {
          const items = dayMenu?.[key as keyof typeof dayMenu] || '—'
          const isCurrentMeal = (() => {
            if (selectedDay !== todayIdx) return false
            const h = new Date().getHours()
            if (key === 'breakfast') return h >= 7 && h < 9
            if (key === 'lunch') return h >= 12 && h < 14
            if (key === 'snack') return h >= 17 && h < 18
            if (key === 'dinner') return h >= 19 && h < 21
            return false
          })()

          return (
            <div
              key={key}
              className={`rounded-2xl border-2 p-5 transition ${isCurrentMeal ? `${bg} ${border} shadow-md` : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center border ${border}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-base ${isCurrentMeal ? 'text-slate-900' : 'text-slate-800'}`}>{label}</h3>
                    {isCurrentMeal && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
                        SERVING NOW
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-medium ${isCurrentMeal ? color : 'text-slate-400'}`}>{time}</p>
                </div>
              </div>
              <div className={`text-sm leading-relaxed rounded-xl px-4 py-3 border ${isCurrentMeal ? 'bg-white/70 border-white/80 text-slate-800 font-medium' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                {items}
              </div>
            </div>
          )
        })}
      </div>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
        <span className="text-amber-600 text-sm">ℹ️</span>
        <p className="text-sm text-amber-800">
          Menu is subject to change. Contact the hostel office for special dietary requirements or any queries.
        </p>
      </div>
    </div>
  )
}
