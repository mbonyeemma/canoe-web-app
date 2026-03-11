import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Video, Phone, User } from 'lucide-react';
import api from '../services/api';

interface Appointment {
  appointment_id: string;
  id?: string;
  client_name?: string;
  client_pic?: string;
  appointment_date?: string;
  appointment_time?: string;
  visit_type?: string;
  status?: string;
  purpose?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-green-400',
  completed: 'bg-blue-400',
  cancelled: 'bg-red-400',
  canceled:  'bg-red-400',
  open:      'bg-teal-400',
};

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  canceled:  'bg-red-100 text-red-700',
  open:      'bg-teal-100 text-teal-700',
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function apptId(a: Appointment) { return a.appointment_id || a.id || ''; }
function apptDate(a: Appointment) { return (a.appointment_date || '').split('T')[0]; }

export default function ProviderCalendar() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(today.toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments')
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.appointments || []);
        setAppointments(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Group appointments by date
  const byDate: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    const d = apptDate(a);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(a);
  }

  const selectedAppts = byDate[selected] || [];
  const todayStr = today.toISOString().split('T')[0];

  const cellDate = (day: number) => {
    const d = day < 10 ? `0${day}` : `${day}`;
    const m = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage your appointment calendar</p>
        </div>
        <Link to="/availability" className="text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
          Set Availability
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Calendar grid */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="font-bold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = cellDate(day);
              const dayAppts = byDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selected;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(dateStr)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition text-sm font-medium
                    ${isSelected ? 'bg-primary text-white shadow-md' : isToday ? 'bg-primary-light text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className="leading-none">{day}</span>
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dayAppts.slice(0, 3).map((a, j) => (
                        <span
                          key={j}
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : STATUS_COLORS[(a.status || '').toLowerCase()] || 'bg-gray-400'}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
            {[['confirmed','bg-green-400','Confirmed'],['pending','bg-amber-400','Pending'],['completed','bg-blue-400','Completed']].map(([, color, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Agenda panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                {selected === todayStr ? 'Today' : new Date(selected + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <span className="text-xs text-gray-400 font-medium">{selectedAppts.length} appointment{selectedAppts.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedAppts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No appointments</p>
                <p className="text-gray-300 text-xs mt-1">Select a different day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAppts
                  .sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
                  .map((a) => {
                    const id = apptId(a);
                    const status = (a.status || '').toLowerCase();
                    const pic = api.getProfilePicUrl(a.client_pic);
                    return (
                      <Link key={id} to={`/appointments/${id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition">
                        {pic ? (
                          <img src={pic} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{a.client_name || 'Patient'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {a.appointment_time || '--'}
                            </span>
                            {a.visit_type === 'online' ? <Video className="w-3 h-3 text-gray-400" /> : <Phone className="w-3 h-3 text-gray-400" />}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                          {status}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
