import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Users, MessageSquare, Wallet, ChevronRight, Check, X, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Stats {
  appointments_today: number;
  pending_requests: number;
  total_clients?: number;
  wallet_balance?: number;
  currency?: string;
}

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
  health_concerns?: string;
  specialty?: string;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    canceled:  'bg-red-100 text-red-700',
    no_show:   'bg-gray-100 text-gray-600',
  };
  return map[status?.toLowerCase() || ''] || 'bg-gray-100 text-gray-600';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ appointments_today: 0, pending_requests: 0 });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/provider').then((r) => api.parseResponse<{ data?: Stats }>(r)).catch(() => null),
      api.get('/appointments').then((r) => api.parseResponse<{ data?: any }>(r)).catch(() => null),
      api.get('/wallet/balance').then((r) => api.parseResponse<{ data?: { available?: number; currency?: string } }>(r)).catch(() => null),
    ]).then(([dashRes, apptRes, walletRes]) => {
      if (dashRes?.data) setStats(dashRes.data);
      if (apptRes) {
        const list: Appointment[] = Array.isArray(apptRes.data) ? apptRes.data : (apptRes.data?.appointments || []);
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = list.filter((a) => {
          const d = a.appointment_date || '';
          return d.startsWith(today) || d === today;
        });
        setAppointments(todayAppts.length > 0 ? todayAppts : list.filter((a) => ['pending', 'confirmed'].includes(a.status?.toLowerCase() || '')).slice(0, 5));
      }
      if (walletRes?.data) {
        const b = walletRes.data.available;
        const c = walletRes.data.currency || 'UGX';
        setWalletBalance(b !== undefined ? `${c} ${Number(b).toLocaleString()}` : null);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActionLoading(id + '-approve');
    try {
      await api.parseResponse(await api.put(`/appointments/${id}/approve`, {}));
      setAppointments((prev) => prev.map((a) => (a.appointment_id === id || a.id === id) ? { ...a, status: 'confirmed' } : a));
      toast.success('Appointment accepted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActionLoading(id + '-decline');
    try {
      await api.parseResponse(await api.patch(`/appointments/${id}/cancel`, {}));
      setAppointments((prev) => prev.filter((a) => a.appointment_id !== id && a.id !== id));
      toast.success('Appointment declined');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to decline');
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinCall = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActionLoading(id + '-call');
    try {
      const res = await api.parseResponse<{ data?: { url?: string; join_url?: string; meeting_id?: string } }>(
        await api.post(`/appointments/${id}/join-call`, {})
      );
      const url = res.data?.url || res.data?.join_url;
      if (url) {
        window.open(url, '_blank');
      } else if (res.data?.meeting_id) {
        window.open(`https://meet.jit.si/${res.data.meeting_id}`, '_blank');
      } else {
        toast.error('No call URL received');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start call');
    } finally {
      setActionLoading(null);
    }
  };

  const apptId = (a: Appointment) => a.appointment_id || a.id || '';

  const STAT_CARDS = [
    {
      label: 'Today\'s Appointments',
      value: loading ? '—' : String(stats.appointments_today),
      icon: Calendar,
      color: 'bg-primary-light',
      iconColor: 'text-primary',
      to: '/appointments',
    },
    {
      label: 'Pending Requests',
      value: loading ? '—' : String(stats.pending_requests),
      icon: AlertCircle,
      color: 'bg-amber-50',
      iconColor: 'text-amber-500',
      to: '/appointments',
    },
    {
      label: 'Messages',
      value: '—',
      icon: MessageSquare,
      color: 'bg-teal-50',
      iconColor: 'text-teal-500',
      to: '/chats',
    },
    {
      label: 'Wallet Balance',
      value: walletBalance ?? '—',
      icon: Wallet,
      color: 'bg-purple-50',
      iconColor: 'text-purple-500',
      to: '/wallet',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{greeting()}</p>
          <h1 className="text-2xl font-bold text-gray-900">Dr. {user?.first_name || 'there'}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/availability" className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
            Set Availability
          </Link>
          <Link to="/clients" className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition flex items-center gap-1.5">
            <Users className="w-4 h-4" /> My Clients
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <Link key={card.label} to={card.to} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/schedule',     icon: Clock,    label: 'My Schedule', color: 'bg-blue-50 text-blue-600'   },
          { to: '/clients',      icon: Users,    label: 'My Clients',  color: 'bg-primary-light text-primary' },
          { to: '/availability', icon: Calendar, label: 'Availability',color: 'bg-orange-50 text-orange-500'},
        ].map((a) => (
          <Link key={a.to} to={a.to} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className={`w-9 h-9 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">{a.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Today's Appointments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Today's Appointments</h2>
          <Link to="/appointments" className="text-sm text-primary font-medium hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No appointments today</p>
            <Link to="/availability" className="inline-block mt-3 text-sm text-primary font-medium hover:underline">
              Set your availability →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => {
              const id = apptId(a);
              const status = (a.status || 'pending').toLowerCase();
              const isPending = status === 'pending';
              const isConfirmed = status === 'confirmed';
              const pic = api.getProfilePicUrl(a.client_pic);
              return (
                <div key={id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Link to={`/appointments/${id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition rounded-xl">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {pic ? (
                        <img src={pic} alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-base">
                          {(a.client_name || 'P')[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{a.client_name || 'Patient'}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge(status)}`}>{status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{a.purpose || a.health_concerns || 'General consultation'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {a.appointment_time || '--'}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                          {a.visit_type === 'online' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                          {a.visit_type || 'online'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </Link>

                  {/* Action bar */}
                  {(isPending || isConfirmed) && (
                    <div className="flex gap-2 px-4 pb-3">
                      {isPending && (
                        <>
                          <button
                            onClick={(e) => handleApprove(id, e)}
                            disabled={actionLoading === id + '-approve'}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
                          >
                            {actionLoading === id + '-approve' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Accept</>}
                          </button>
                          <button
                            onClick={(e) => handleDecline(id, e)}
                            disabled={actionLoading === id + '-decline'}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                          >
                            {actionLoading === id + '-decline' ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <><X className="w-3.5 h-3.5" /> Decline</>}
                          </button>
                        </>
                      )}
                      {isConfirmed && a.visit_type === 'online' && (
                        <button
                          onClick={(e) => handleJoinCall(id, e)}
                          disabled={actionLoading === id + '-call'}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
                        >
                          {actionLoading === id + '-call' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Video className="w-3.5 h-3.5" /> Join Call</>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
