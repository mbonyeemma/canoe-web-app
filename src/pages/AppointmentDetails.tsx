import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Video, Phone, MessageSquare,
  FileText, Check, X, AlertCircle, Save, User, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

type NotesTab = 'clinical' | 'prescription' | 'followup';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  canceled:  'bg-red-100 text-red-700',
  no_show:   'bg-gray-100 text-gray-600',
  open:      'bg-teal-100 text-teal-700',
};

export default function AppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appt, setAppt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Notes state
  const [notesTab, setNotesTab] = useState<NotesTab>('clinical');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/appointments/${id}`)
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((result) => {
        const d = result.data;
        setAppt(d);
        setClinicalNotes(d?.clinical_notes || '');
        setPrescription(d?.prescription || '');
        setFollowUpNotes(d?.follow_up_notes || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await api.parseResponse(await api.put(`/appointments/${id}/approve`, {}));
      setAppt((p: any) => ({ ...p, status: 'confirmed' }));
      toast.success('Appointment accepted');
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleDecline = async () => {
    if (!confirm('Decline this appointment?')) return;
    setActionLoading('decline');
    try {
      await api.parseResponse(await api.patch(`/appointments/${id}/cancel`, {}));
      setAppt((p: any) => ({ ...p, status: 'cancelled' }));
      toast.success('Appointment declined');
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async () => {
    setActionLoading('complete');
    try {
      await api.parseResponse(await api.put(`/appointments/${id}/complete`, { status: 'completed' }));
      setAppt((p: any) => ({ ...p, status: 'completed' }));
      toast.success('Marked as complete');
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleNoShow = async () => {
    setActionLoading('noshow');
    try {
      await api.parseResponse(await api.put(`/appointments/${id}/complete`, { status: 'no_show' }));
      setAppt((p: any) => ({ ...p, status: 'no_show' }));
      toast.success('Marked as no-show');
    } catch (err: any) { toast.error(err?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleJoinCall = async () => {
    setActionLoading('call');
    try {
      const res = await api.parseResponse<{ data?: { url?: string; join_url?: string; meeting_id?: string } }>(
        await api.post(`/appointments/${id}/join-call`, {})
      );
      const meetingId = res.data?.meeting_id;
      if (meetingId) {
        navigate(`/call/${meetingId}`);
      } else {
        const url = res.data?.url || res.data?.join_url;
        if (url) { window.open(url, '_blank'); }
        else { toast.error('No call URL received'); }
      }
    } catch (err: any) { toast.error(err?.message || 'Failed to start call'); }
    finally { setActionLoading(null); }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await api.parseResponse(await api.put(`/appointments/${id}/notes`, {
        clinical_notes: clinicalNotes,
        prescription,
        follow_up_notes: followUpNotes,
      }));
      setNotesSaved(true);
      toast.success('Notes saved');
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err: any) { toast.error(err?.message || 'Failed to save notes'); }
    finally { setNotesSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-14">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!appt) return (
    <div className="text-center py-14">
      <p className="text-gray-500">Appointment not found</p>
      <button onClick={() => navigate(-1)} className="mt-3 text-primary text-sm font-medium hover:underline">Go back</button>
    </div>
  );

  const status = (appt.status || 'pending').toLowerCase();
  const statusColor = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  const isPending = status === 'pending';
  const isConfirmed = ['confirmed', 'open'].includes(status);
  const isActive = isPending || isConfirmed;
  const pic = api.getProfilePicUrl(appt.client_pic || appt.client_profile_pic);

  const NOTE_TABS: { key: NotesTab; label: string; placeholder: string; value: string; set: (v: string) => void }[] = [
    { key: 'clinical',     label: 'Clinical Notes',   placeholder: 'Enter clinical observations, diagnosis, findings...',        value: clinicalNotes,  set: setClinicalNotes },
    { key: 'prescription', label: 'Prescription',     placeholder: 'List medications, dosage, frequency, duration...',           value: prescription,   set: setPrescription  },
    { key: 'followup',     label: 'Follow-up Notes',  placeholder: 'Next steps, referrals, follow-up instructions, advice...',  value: followUpNotes,  set: setFollowUpNotes },
  ];

  const activeNote = NOTE_TABS.find((n) => n.key === notesTab)!;

  return (
    <div className="w-full">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-5 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Appointments
      </button>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* LEFT: Patient info + details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Patient card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              {pic ? (
                <img src={pic} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary-light text-primary flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
              )}
              <div>
                <h2 className="font-bold text-gray-900">{appt.client_name || 'Patient'}</h2>
                {appt.client_phone && <p className="text-sm text-gray-500">{appt.client_phone}</p>}
                <Link to={`/clients/${appt.client_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 mt-0.5">
                  View patient file <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusColor}`}>{status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</span>
                <span className="text-xs font-medium text-gray-700">{appt.appointment_date?.split('T')[0] || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Time</span>
                <span className="text-xs font-medium text-gray-700">{appt.appointment_time || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Type</span>
                <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  {appt.visit_type === 'online' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                  {appt.visit_type || 'online'}
                </span>
              </div>
            </div>
          </div>

          {/* Health concerns */}
          {(appt.health_concerns || appt.purpose) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Reason / Concerns
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{appt.health_concerns || appt.purpose}</p>
            </div>
          )}

          {/* Actions */}
          {isActive && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions</h3>
              <div className="space-y-2">
                {isPending && (
                  <button onClick={handleApprove} disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                    {actionLoading === 'approve' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Accept Appointment</>}
                  </button>
                )}
                {isConfirmed && appt.visit_type === 'online' && (
                  <button onClick={handleJoinCall} disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                    {actionLoading === 'call' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Video className="w-4 h-4" /> Join Video Call</>}
                  </button>
                )}
                {isConfirmed && (
                  <button onClick={handleComplete} disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary-light transition disabled:opacity-50">
                    {actionLoading === 'complete' ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Mark Complete</>}
                  </button>
                )}
                <Link to={`/chats`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">
                  <MessageSquare className="w-4 h-4" /> Message Patient
                </Link>
                {isConfirmed && (
                  <button onClick={handleNoShow} disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
                    {actionLoading === 'noshow' ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <><AlertCircle className="w-4 h-4" /> Mark No-Show</>}
                  </button>
                )}
                {isActive && (
                  <button onClick={handleDecline} disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition disabled:opacity-50">
                    <X className="w-4 h-4" /> Decline / Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Patient file / notes */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-0 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 mb-3">Patient File</h2>
              <div className="flex gap-0">
                {NOTE_TABS.map((n) => (
                  <button key={n.key} onClick={() => setNotesTab(n.key)}
                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${notesTab === n.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              <textarea
                key={notesTab}
                value={activeNote.value}
                onChange={(e) => activeNote.set(e.target.value)}
                placeholder={activeNote.placeholder}
                rows={10}
                className="w-full text-sm text-gray-700 border-2 border-gray-200 rounded-xl p-4 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">Notes are saved to the patient's file</p>
                <button onClick={handleSaveNotes} disabled={notesSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                  {notesSaving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : notesSaved
                    ? <><Check className="w-4 h-4" /> Saved!</>
                    : <><Save className="w-4 h-4" /> Save Notes</>
                  }
                </button>
              </div>
            </div>

            {/* Previous notes summary (read-only if all notes exist) */}
            {(appt.clinical_notes || appt.prescription || appt.follow_up_notes) && (
              <div className="px-5 pb-5 border-t border-gray-50 mt-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4">Previously Saved</p>
                <div className="space-y-3">
                  {appt.clinical_notes && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Clinical Notes</p>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{appt.clinical_notes}</p>
                    </div>
                  )}
                  {appt.prescription && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Prescription</p>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{appt.prescription}</p>
                    </div>
                  )}
                  {appt.follow_up_notes && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Follow-up</p>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{appt.follow_up_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
