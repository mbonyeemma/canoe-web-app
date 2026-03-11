import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Video, Phone, FileText, User, ChevronRight, Pill, ClipboardList } from 'lucide-react';
import api from '../services/api';

interface Appointment {
  appointment_id: string;
  id?: string;
  client_id?: string;
  client_name?: string;
  client_pic?: string;
  client_phone?: string;
  client_email?: string;
  appointment_date?: string;
  appointment_time?: string;
  visit_type?: string;
  status?: string;
  purpose?: string;
  health_concerns?: string;
  clinical_notes?: string;
  prescription?: string;
  follow_up_notes?: string;
}

type Tab = 'overview' | 'appointments' | 'notes';

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  canceled:  'bg-red-100 text-red-700',
  no_show:   'bg-gray-100 text-gray-600',
};

function apptId(a: Appointment) { return a.appointment_id || a.id || ''; }

export default function ClientFile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = decodeURIComponent(id || '');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    api.get('/appointments')
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((res) => {
        const all: Appointment[] = Array.isArray(res.data) ? res.data : (res.data?.appointments || []);
        // Filter by client_id or client_name matching the URL param
        const clientAppts = all.filter((a) =>
          a.client_id === clientId || a.client_name === clientId
        );
        setAppointments(clientAppts.sort((a, b) => (b.appointment_date || '').localeCompare(a.appointment_date || '')));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return (
    <div className="flex justify-center py-14">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const client = appointments[0];
  const clientName = client?.client_name || clientId;
  const pic = api.getProfilePicUrl(client?.client_pic);
  const completed = appointments.filter((a) => (a.status || '').toLowerCase() === 'completed').length;
  const withNotes = appointments.filter((a) => a.clinical_notes || a.prescription || a.follow_up_notes);

  if (!client && appointments.length === 0) return (
    <div className="w-full text-center py-14">
      <User className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">Patient not found</p>
      <button onClick={() => navigate(-1)} className="mt-3 text-primary text-sm font-medium hover:underline">Go back</button>
    </div>
  );

  return (
    <div className="w-full">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-5 transition">
        <ArrowLeft className="w-4 h-4" /> My Clients
      </button>

      {/* Patient header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center gap-4">
          {pic ? (
            <img src={pic} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center text-2xl font-bold">
              {clientName[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{clientName}</h1>
            {client?.client_phone && <p className="text-sm text-gray-500 mt-0.5">{client.client_phone}</p>}
            {client?.client_email && <p className="text-sm text-gray-500">{client.client_email}</p>}
          </div>

          {/* Quick stats */}
          <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Total Visits', value: appointments.length },
              { label: 'Completed', value: completed },
              { label: 'With Notes', value: withNotes.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface rounded-xl p-3">
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5">
        {([
          { key: 'overview' as Tab,      label: 'Overview',             icon: User        },
          { key: 'appointments' as Tab,  label: 'Appointment History',  icon: Calendar    },
          { key: 'notes' as Tab,         label: 'Notes & Prescriptions',icon: FileText    },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition -mb-px ${tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Patient Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total appointments</span>
                <span className="font-semibold text-gray-900">{appointments.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-semibold text-green-600">{completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">No-shows</span>
                <span className="font-semibold text-gray-700">{appointments.filter((a) => (a.status || '').toLowerCase() === 'no_show').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">First visit</span>
                <span className="font-semibold text-gray-700">{appointments[appointments.length - 1]?.appointment_date?.split('T')[0] || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last visit</span>
                <span className="font-semibold text-gray-700">{appointments[0]?.appointment_date?.split('T')[0] || '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Reasons</h3>
            <div className="space-y-2">
              {[...new Set(appointments.map((a) => a.purpose || a.health_concerns).filter(Boolean))].slice(0, 5).map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-primary-light text-primary text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {reason}
                </div>
              ))}
              {appointments.every((a) => !a.purpose && !a.health_concerns) && (
                <p className="text-sm text-gray-400 italic">No reasons recorded</p>
              )}
            </div>
          </div>

          {/* Recent appointment quick preview */}
          {appointments[0] && (
            <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Most Recent Visit</h3>
              <Link to={`/appointments/${apptId(appointments[0])}`} className="flex items-center gap-3 hover:opacity-80 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{appointments[0].appointment_date?.split('T')[0]}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[(appointments[0].status || '').toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
                      {appointments[0].status}
                    </span>
                  </div>
                  {appointments[0].purpose && <p className="text-xs text-gray-500 mt-0.5">{appointments[0].purpose}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Appointment history tab */}
      {tab === 'appointments' && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No appointments found</p>
            </div>
          ) : appointments.map((a) => {
            const status = (a.status || '').toLowerCase();
            return (
              <Link key={apptId(a)} to={`/appointments/${apptId(a)}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 hover:shadow-md hover:border-primary/20 transition">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                  {a.visit_type === 'online' ? <Video className="w-5 h-5 text-primary" /> : <Phone className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{a.appointment_date?.split('T')[0] || '--'}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{a.purpose || a.health_concerns || 'General consultation'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Clock className="w-3 h-3" /> {a.appointment_time || '--'}</span>
                    {(a.clinical_notes || a.prescription) && (
                      <span className="text-[11px] text-primary font-medium flex items-center gap-0.5"><FileText className="w-3 h-3" /> Has notes</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Notes & Prescriptions tab */}
      {tab === 'notes' && (
        <div className="space-y-4">
          {withNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No notes or prescriptions yet</p>
              <p className="text-gray-300 text-xs mt-1">Notes appear here after you write them in an appointment</p>
            </div>
          ) : withNotes.map((a) => (
            <div key={apptId(a)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{a.appointment_date?.split('T')[0] || '--'}</span>
                  <span className="text-xs text-gray-400">{a.appointment_time}</span>
                </div>
                <Link to={`/appointments/${apptId(a)}`} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                  View full <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-5 space-y-4">
                {a.clinical_notes && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClipboardList className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clinical Notes</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{a.clinical_notes}</p>
                  </div>
                )}
                {a.prescription && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Pill className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prescription</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed bg-green-50 border border-green-100 rounded-lg p-3 whitespace-pre-wrap">{a.prescription}</p>
                  </div>
                )}
                {a.follow_up_notes && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Follow-up</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 border border-blue-100 rounded-lg p-3">{a.follow_up_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
