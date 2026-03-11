import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Video, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  sender_id?: string;
  content?: string;
  message?: string;
  text?: string;
  created_at?: string;
  message_type?: string;
  metadata?: {
    timestamp?: string;
    scheduled_for?: string;
    appointment_id?: string;
  };
}

type CallType = 'video' | 'audio';

interface CallInvite {
  type: CallType;
  url: string;
  meetingId?: string;
  scheduledForLabel?: string;
  appointmentId?: string;
}

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|\/call\/[^\s]+)/i;

function sanitizeRoom(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 128);
}

function generateRoomId(): string {
  try {
    return globalThis.crypto.randomUUID().replace(/-/g, '');
  } catch {
    return `room-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(URL_REGEX);
  if (!match) return null;
  const raw = match[0];
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return raw;
}

function parseMeetingFromUrl(url: string): { meetingId?: string; appointmentId?: string; audioOnly?: boolean } {
  try {
    const full = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    const u = new URL(full);
    const path = u.pathname || '';
    const parts = path.split('/').filter(Boolean);
    let meetingId: string | undefined;
    if (path.startsWith('/call/') && parts.length >= 2) {
      meetingId = decodeURIComponent(parts[1]);
    } else if (/meet\.jit\.si/i.test(u.hostname) && parts.length >= 1) {
      meetingId = decodeURIComponent(parts[0]);
    }
    const params = u.searchParams;
    const appointmentId = params.get('appointmentId') || undefined;
    const audioOnly = params.get('audioOnly') === 'true';
    return { meetingId, appointmentId, audioOnly };
  } catch {
    return {};
  }
}

function parseCallInviteFromMessage(msg: Message): CallInvite | null {
  const base = msg.content || msg.message || msg.text || '';
  if (!base) return null;

  const url = extractFirstUrl(base);
  if (!url) return null;
  if (!url.includes('/call/') && !/meet\.jit\.si/i.test(url)) {
    return null;
  }

  const lower = base.toLowerCase();
  const isAudio = lower.includes('audio call') || lower.includes('voice call');
  const type: CallType = isAudio ? 'audio' : 'video';

  const { meetingId, appointmentId } = parseMeetingFromUrl(url);

  let scheduledForLabel: string | undefined;
  const scheduledRaw = msg.metadata?.scheduled_for;
  if (scheduledRaw) {
    const d = new Date(scheduledRaw);
    if (!Number.isNaN(d.getTime())) {
      scheduledForLabel = d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  return {
    type,
    url,
    meetingId,
    appointmentId: appointmentId || msg.metadata?.appointment_id,
    scheduledForLabel,
  };
}

function linkifySegments(text: string): { type: 'text' | 'url'; value: string }[] {
  if (!text || typeof text !== 'string') return [];
  const segments: { type: 'text' | 'url'; value: string }[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_REGEX.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    }
    let url = m[0];
    if (/^www\./i.test(url)) url = `https://${url}`;
    segments.push({ type: 'url', value: url });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: 'text', value: text }];
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const contactName =
    (location.state as { name?: string } | null)?.name || 'Chat';
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [startingCall, setStartingCall] = useState<CallType | null>(null);
  const [scheduleMode, setScheduleMode] = useState<CallType | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchMessages = (chatId: string) => {
    api.get(`/chat/${chatId}/messages`)
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((result) => {
        const raw = result.data;
        const list = Array.isArray(raw) ? raw : (raw?.messages || []);
        setMessages(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!id) return;
    fetchMessages(id);
    pollRef.current = setInterval(() => fetchMessages(id), 3000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    try {
      await api.parseResponse(await api.post(`/chat/${id}/messages`, { content, message_type: 'text' }));
      if (id) fetchMessages(id);
    } catch { }
    setSending(false);
  };

  const openSchedule = (mode: CallType) => {
    setScheduleMode(mode);
    if (!scheduledDate) {
      setScheduledDate(new Date().toISOString().split('T')[0]);
    }
    if (!scheduledTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 15);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setScheduledTime(`${hh}:${mm}`);
    }
  };

  const scheduledIso = useMemo(() => {
    if (!scheduledDate || !scheduledTime) return '';
    return `${scheduledDate}T${scheduledTime}:00`;
  }, [scheduledDate, scheduledTime]);

  const handleStartCall = async () => {
    if (!id || !scheduleMode || startingCall) return;
    if (!scheduledDate || !scheduledTime) {
      toast.error('Select date and time for the meeting');
      return;
    }
    setStartingCall(scheduleMode);
    const audioOnly = scheduleMode === 'audio';
    const requestedRoom = sanitizeRoom(generateRoomId());

    const labelDate = new Date(`${scheduledDate}T${scheduledTime || '00:00'}:00`);
    const whenLabel = !Number.isNaN(labelDate.getTime())
      ? labelDate.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : `${scheduledDate} ${scheduledTime}`;

    const sendInvite = async (roomId: string) => {
      const qs = audioOnly ? '?audioOnly=true' : '';
      const joinPath = `/call/${encodeURIComponent(roomId)}${qs}`;
      const callUrl = `${window.location.origin}${joinPath}`;
      const content = `${audioOnly ? 'Audio' : 'Video'} call scheduled on ${whenLabel}.\nJoin: ${callUrl}`;
      await api.parseResponse(
        await api.post(`/chat/${id}/messages`, {
          content,
          message_type: 'call',
          scheduled_for: scheduledIso,
        })
      );
      fetchMessages(id);
      toast.success('Call invite sent');
    };

    try {
      const res = await api.parseResponse<{ room?: string }>(
        await api.post('/meetings/token', {
          room: requestedRoom,
          displayName: user?.full_name || user?.email || 'Provider',
        })
      );
      const finalRoom = sanitizeRoom(res.room || requestedRoom);
      await sendInvite(finalRoom);
    } catch {
      await sendInvite(requestedRoom);
    } finally {
      setStartingCall(null);
      setScheduleMode(null);
    }
  };

  const formatTime = (msg: Message) => {
    const ts = msg.metadata?.timestamp || msg.created_at;
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/chats')} className="text-gray-400 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold">{contactName[0]}</div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{contactName}</p>
          <p className="text-xs text-gray-400">online</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => openSchedule('audio')}
            disabled={!!startingCall}
            className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary transition disabled:opacity-50 flex items-center justify-center"
            title="Start audio call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openSchedule('video')}
            disabled={!!startingCall}
            className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary transition disabled:opacity-50 flex items-center justify-center"
            title="Start video call"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {scheduleMode && (
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white">
              {scheduleMode === 'audio' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </span>
            <span>
              Schedule {scheduleMode === 'audio' ? 'audio' : 'video'} call
            </span>
          </div>
          <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="date"
              value={scheduledDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs sm:text-sm w-full sm:w-auto"
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs sm:text-sm w-full sm:w-auto"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setScheduleMode(null);
                setStartingCall(null);
              }}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartCall}
              disabled={!!startingCall}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {startingCall ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.user_id;
          const content = msg.content || msg.message || msg.text || '';
          const call = parseCallInviteFromMessage(msg);
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {call ? (
                <button
                  type="button"
                  onClick={() => {
                    if (call.meetingId) {
                      const audioOnly = call.type === 'audio';
                      const qs = audioOnly ? '?audioOnly=true' : '';
                      navigate(`/call/${encodeURIComponent(call.meetingId)}${qs}`);
                    } else {
                      window.open(call.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className={`max-w-[80%] text-left rounded-2xl px-4 py-3 ${
                    isMe
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {call.type === 'audio' ? (
                      <Phone className="w-4 h-4" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                    <span>{call.type === 'audio' ? 'Audio call invite' : 'Video call invite'}</span>
                  </div>
                  {call.scheduledForLabel && (
                    <p className="text-xs mt-1 opacity-80">
                      Scheduled for {call.scheduledForLabel}
                    </p>
                  )}
                  {call.appointmentId && (
                    <p
                      className="text-xs mt-1 underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appointments/${call.appointmentId}`);
                      }}
                    >
                      View appointment #{call.appointmentId}
                    </p>
                  )}
                  <p
                    className={`text-[11px] mt-2 break-all ${
                      isMe ? 'text-white/80' : 'text-primary'
                    }`}
                  >
                    {call.url}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? 'text-white/60' : 'text-gray-400'
                    } text-right`}
                  >
                    {formatTime(msg)}
                  </p>
                </button>
              ) : (
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {linkifySegments(content).map((seg, idx) =>
                      seg.type === 'url' ? (
                        <a
                          key={idx}
                          href={seg.value}
                          target="_blank"
                          rel="noreferrer"
                          className={isMe ? 'underline text-white' : 'underline text-primary'}
                        >
                          {seg.value}
                        </a>
                      ) : (
                        <span key={idx}>{seg.value}</span>
                      )
                    )}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? 'text-white/60' : 'text-gray-400'
                    } text-right`}
                  >
                    {formatTime(msg)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button className="text-gray-400 hover:text-primary"><Paperclip className="w-5 h-5" /></button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-surface rounded-full px-4 py-2 text-sm outline-none"
        />
        <button onClick={handleSend} disabled={!text.trim() || sending} className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
