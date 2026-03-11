import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Phone, Search, Check, X, ChevronRight, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { joinAppointmentCall, resolveMeetingIdFromJoinUrl } from '../services/meetings';

type Tab = 'pending' | 'today' | 'upcoming' | 'done';

interface Appointment {
  appointment_id: string;
  id?: string;
  client_name?: string;
  client_pic?: string;
  provider_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  visit_type?: string;
  status?: string;
  purpose?: string;
  health_concerns?: string;
  specialty?: string;
}

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'pending',  label: 'Pending'   },
  { key: 'today',    label: 'Today'     },
  { key: 'upcoming', label: 'Upcoming'  },
  { key: 'done',     label: 'Done'      },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    canceled:  'bg-red-100 text-red-700',
    no_show:   'bg-gray-100 text-gray-600',
    open:      'bg-teal-100 text-teal-700',
  };
  return map[status?.toLowerCase() || ''] || 'bg-gray-100 text-gray-600';
}

function apptId(a: Appointment) { return a.appointment_id || a.id || ''; }

function filterByTab(list: Appointment[], tab: Tab): Appointment[] {
  const today = new Date().toISOString().split('T')[0];
  return list.filter((a) => {
    const status = (a.status || '').toLowerCase();
    const date = (a.appointment_date || '').split('T')[0];
    switch (tab) {
      case 'pending':  return status === 'pending';
      case 'today':    return date === today && ['confirmed', 'pending', 'open'].includes(status);
      case 'upcoming': return date > today && ['confirmed', 'open'].includes(status);
      case 'done':     return ['completed', 'cancelled', 'canceled', 'no_show', 'closed'].includes(status);
      default: return false;
    }
  });
}

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    api.get('/appointments')
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((result) => {
        const list = Array.isArray(result.data) ? result.data : (result.data?.appointments || []);
        setAppointments(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActionLoading(id + '-approve');
    try {
      await api.parseResponse(await api.put(`/appointments/${id}/approve`, {}));
      setAppointments((prev) => prev.map((a) => apptId(a) === id ? { ...a, status: 'confirmed' } : a));
      toast.success('Appointment accepted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept');
    } finally { setActionLoading(null); }
  };

  const handleDecline = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Decline this appointment?')) return;
    setActionLoading(id + '-decline');
    try {
      await api.parseResponse(await api.patch(`/appointments/${id}/cancel`, {}));
      setAppointments((prev) => prev.map((a) => apptId(a) === id ? { ...a, status: 'cancelled' } : a));
      toast.success('Appointment declined');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to decline');
    } finally { setActionLoading(null); }
  };

  const handleJoinCall = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActionLoading(id + '-call');
    try {
      const { meetingId, joinUrl } = await joinAppointmentCall({ appointmentId: id });
      const resolved = meetingId || (joinUrl ? resolveMeetingIdFromJoinUrl(joinUrl) : null);
      if (resolved) {
        navigate(`/call/${encodeURIComponent(resolved)}`);
      } else {
        toast.error('No meeting ID received');
      }
    } catch (err: any) { toast.error(err?.message || 'Failed to start call'); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActionLoading(id + '-complete');
    try {
      await api.parseResponse(await api.put(`/appointments/${id}/complete`, { status: 'completed' }));
      setAppointments((prev) => prev.map((a) => apptId(a) === id ? { ...a, status: 'completed' } : a));
      toast.success('Marked as complete');
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const tabList = filterByTab(appointments, tab);
  const filtered = search
    ? tabList.filter((a) => (a.client_name || '').toLowerCase().includes(search.toLowerCase()))
    : tabList;

  const tabCounts: Record<Tab, number> = {
    pending:  appointments.filter((a) => (a.status || '').toLowerCase() === 'pending').length,
    today:    filterByTab(appointments, 'today').length,
    upcoming: filterByTab(appointments, 'upcoming').length,
    done:     filterByTab(appointments, 'done').length,
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your patient appointments</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${tab === key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
            {tabCounts[key] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${tab === key ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
                {tabCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No {tab} appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const id = apptId(a);
            const status = (a.status || 'pending').toLowerCase();
            const isPending = status === 'pending';
            const isConfirmed = ['confirmed', 'open'].includes(status);
            const pic = api.getProfilePicUrl(a.client_pic);
            return (
              <div key={id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <Link to={`/appointments/${id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50/60 transition">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {pic ? (
                      <img src={pic} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-base">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{a.client_name || 'Patient'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusBadge(status)}`}>{status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{a.purpose || a.health_concerns || 'General consultation'}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {a.appointment_date?.split('T')[0] || '--'}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {a.appointment_time || '--'}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        {a.visit_type === 'online' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                        {a.visit_type || 'online'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>

                {/* Action Bar */}
                {(isPending || isConfirmed) && (
                  <div className="flex items-center gap-2 px-4 pb-3 pt-0 border-t border-gray-50">
                    {isPending && (
                      <>
                        <button onClick={(e) => handleApprove(id, e)} disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                          {actionLoading === id + '-approve' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Accept</>}
                        </button>
                        <button onClick={(e) => handleDecline(id, e)} disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                          {actionLoading === id + '-decline' ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <><X className="w-3.5 h-3.5" /> Decline</>}
                        </button>
                      </>
                    )}
                    {isConfirmed && (
                      <>
                        {a.visit_type === 'online' && (
                          <button onClick={(e) => handleJoinCall(id, e)} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                            {actionLoading === id + '-call' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Video className="w-3.5 h-3.5" /> Join Call</>}
                          </button>
                        )}
                        <button onClick={(e) => handleComplete(id, e)} disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
                          {actionLoading === id + '-complete' ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Complete</>}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
