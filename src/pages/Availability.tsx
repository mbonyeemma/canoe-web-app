import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface DayState {
  available: boolean;
  slots: TimeSlot[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate half-hour time options
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    const hh = h.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:${m}`);
  }
}

function defaultDay(): DayState {
  return { available: false, slots: [{ start_time: '08:00', end_time: '17:00' }] };
}

export default function Availability() {
  const [days, setDays] = useState<DayState[]>(DAYS.map(defaultDay));
  const [minNotice, setMinNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/providers/availability')
      .then((r) => api.parseResponse<{ data?: { availability?: any[]; minimum_notice_hours?: number } }>(r))
      .then((res) => {
        const avail = res.data?.availability || [];
        if (avail.length > 0) {
          setDays((prev) => {
            const next = prev.map((d) => ({ ...d, slots: [] as TimeSlot[] }));
            for (const slot of avail) {
              const idx = slot.day_of_week;
              if (idx >= 0 && idx < 7) {
                next[idx].available = true;
                if (slot.start_time && slot.end_time) {
                  next[idx].slots.push({ start_time: slot.start_time, end_time: slot.end_time });
                }
              }
            }
            // Ensure each available day has at least one slot
            for (let i = 0; i < 7; i++) {
              if (next[i].available && next[i].slots.length === 0) {
                next[i].slots = [{ start_time: '08:00', end_time: '17:00' }] as TimeSlot[];
              }
            }
            return next;
          });
        }
        if (res.data?.minimum_notice_hours) setMinNotice(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (idx: number) => {
    setDays((prev) => {
      const next = [...prev];
      const d = { ...next[idx] };
      d.available = !d.available;
      if (d.available && d.slots.length === 0) {
        d.slots = [{ start_time: '08:00', end_time: '17:00' }];
      }
      next[idx] = d;
      return next;
    });
  };

  const addSlot = (dayIdx: number) => {
    setDays((prev) => {
      const next = [...prev];
      const d = { ...next[dayIdx], slots: [...next[dayIdx].slots] };
      if (d.slots.length >= 3) { toast.error('Max 3 time slots per day'); return prev; }
      d.slots.push({ start_time: '09:00', end_time: '17:00' });
      next[dayIdx] = d;
      return next;
    });
  };

  const removeSlot = (dayIdx: number, slotIdx: number) => {
    setDays((prev) => {
      const next = [...prev];
      const d = { ...next[dayIdx], slots: next[dayIdx].slots.filter((_, i) => i !== slotIdx) };
      next[dayIdx] = d;
      return next;
    });
  };

  const updateSlot = (dayIdx: number, slotIdx: number, field: 'start_time' | 'end_time', value: string) => {
    setDays((prev) => {
      const next = [...prev];
      const d = { ...next[dayIdx], slots: [...next[dayIdx].slots] };
      d.slots[slotIdx] = { ...d.slots[slotIdx], [field]: value };
      next[dayIdx] = d;
      return next;
    });
  };

  const handleSave = async () => {
    const availability: any[] = [];
    for (let i = 0; i < 7; i++) {
      const d = days[i];
      if (d.available) {
        for (const slot of d.slots) {
          availability.push({ day_of_week: i, start_time: slot.start_time, end_time: slot.end_time, is_available: true });
        }
      } else {
        availability.push({ day_of_week: i, is_available: false });
      }
    }
    setSaving(true);
    try {
      await api.parseResponse(await api.post('/providers/availability', {
        availability,
        minimum_notice_hours: minNotice ? 2 : 0,
      }));
      toast.success('Availability saved successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-14">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set Availability</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure which days and hours patients can book with you</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </div>

      {/* Minimum notice toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">2-hour minimum notice</p>
          <p className="text-xs text-gray-500">Require at least 2 hours advance notice for bookings</p>
        </div>
        <button
          onClick={() => setMinNotice(!minNotice)}
          className={`w-11 h-6 rounded-full transition-colors relative ${minNotice ? 'bg-primary' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${minNotice ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Day rows */}
      <div className="space-y-3">
        {DAYS.map((dayName, dayIdx) => {
          const day = days[dayIdx];
          return (
            <div key={dayName} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${day.available ? 'border-primary/30' : 'border-gray-100'}`}>
              {/* Day toggle header */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(dayIdx)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${day.available ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${day.available ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className={`text-sm font-semibold ${day.available ? 'text-gray-900' : 'text-gray-400'}`}>{dayName}</span>
                </div>
                {!day.available && <span className="text-xs text-gray-400 italic">Unavailable</span>}
                {day.available && (
                  <button onClick={() => addSlot(dayIdx)} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add slot
                  </button>
                )}
              </div>

              {/* Slots */}
              {day.available && (
                <div className="px-5 pb-4 space-y-2.5 border-t border-gray-50">
                  {day.slots.map((slot, slotIdx) => (
                    <div key={slotIdx} className="flex items-center gap-3 mt-2.5">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <select
                        value={slot.start_time}
                        onChange={(e) => updateSlot(dayIdx, slotIdx, 'start_time', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white cursor-pointer"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-gray-400 text-sm font-medium shrink-0">to</span>
                      <select
                        value={slot.end_time}
                        onChange={(e) => updateSlot(dayIdx, slotIdx, 'end_time', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white cursor-pointer"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {day.slots.length > 1 && (
                        <button onClick={() => removeSlot(dayIdx, slotIdx)} className="text-gray-300 hover:text-red-500 transition shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Availability</>}
        </button>
      </div>
    </div>
  );
}
