import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Video, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function BookAppointment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [form, setForm] = useState({ date: '', time: '', visit_type: 'online', symptoms: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/providers/${id}`)
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((result) => setDoctor(result.data))
      .catch(() => {});
  }, [id]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) { toast.error('Please select date and time'); return; }
    setLoading(true);
    try {
      const res = await api.post('/appointments', {
        provider_id: id,
        appointment_date: form.date,
        appointment_time: form.time,
        visit_type: form.visit_type,
        health_concerns: form.symptoms,
      });
      const result = await api.parseResponse<{ data?: any }>(res);
      const apptId = result.data?.appointment_id || result.data?.id;
      toast.success('Appointment booked!');

      // If this is an online visit and we know the provider's user_id, send a call invite into chat
      if (apptId && form.visit_type === 'online' && doctor?.user_id) {
        try {
          // Ensure there is a conversation between this patient (current user) and the provider
          const convRes = await api.post('/chat/conversation', { user2_id: doctor.user_id });
          const convResult = await api.parseResponse<{ data?: any }>(convRes);
          const conversationId =
            convResult.data?.conversation_id || convResult.data?.conversationId;

          if (conversationId) {
            const roomId = `appointment-${apptId}`;
            const qs = '';
            const joinPath = `/call/${encodeURIComponent(roomId)}${qs}`;
            const callUrl = `${window.location.origin}${joinPath}?appointmentId=${encodeURIComponent(
              String(apptId),
            )}`;
            const whenLabel = `${form.date} ${form.time}`;
            const content = `Video appointment scheduled on ${whenLabel}.\nJoin: ${callUrl}`;
            await api.parseResponse(
              await api.post(`/chat/${conversationId}/messages`, {
                content,
                message_type: 'call',
              }),
            );
          }
        } catch {
          // Non-critical: booking succeeded even if chat invite fails
        }
      }

      navigate(apptId ? `/appointments/${apptId}` : '/appointments');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to book');
    } finally {
      setLoading(false);
    }
  };

  const name = doctor?.full_name || `${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim() || 'Doctor';

  return (
    <div className="w-full">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>

      {doctor && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-lg">{name[0]}</div>
          <div>
            <p className="font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-primary">{doctor.specialty || 'General'}</p>
          </div>
          {doctor.consultation_fee && (
            <span className="ml-auto text-sm font-semibold text-gray-700">UGX {Number(doctor.consultation_fee).toLocaleString()}</span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1" /> Date</label>
            <input type="date" value={form.date} onChange={set('date')} min={new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"><Clock className="w-4 h-4 inline mr-1" /> Time</label>
            <input type="time" value={form.time} onChange={set('time')} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visit Type</label>
          <div className="flex gap-3">
            {[
              { val: 'online', icon: Video, label: 'Online' },
              { val: 'in-person', icon: MapPin, label: 'In-Person' },
            ].map((opt) => (
              <button key={opt.val} type="button" onClick={() => setForm({ ...form, visit_type: opt.val })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition font-medium text-sm ${form.visit_type === opt.val ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <opt.icon className="w-5 h-5" /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms / Notes</label>
          <textarea value={form.symptoms} onChange={set('symptoms')} rows={3} placeholder="Describe your symptoms..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-60">
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
}
