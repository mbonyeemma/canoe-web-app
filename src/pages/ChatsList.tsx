import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Search, Video, Phone, Copy, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

interface Chat {
  conversation_id: string;
  other_user_name?: string;
  other_user_pic?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  is_ai?: boolean;
}

export default function ChatsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const initialRoom = useMemo(() => {
    const room = searchParams.get('room');
    return room ? sanitizeRoom(room) : '';
  }, [searchParams]);

  const [room, setRoom] = useState(initialRoom);
  const [audioOnly, setAudioOnly] = useState(searchParams.get('audioOnly') === 'true');
  const [meetingLoading, setMeetingLoading] = useState(false);

  const inviteUrl = useMemo(() => {
    const r = sanitizeRoom(room);
    if (!r) return '';
    const qs = audioOnly ? '?audioOnly=true' : '';
    return `${window.location.origin}/call/${encodeURIComponent(r)}${qs}`;
  }, [room, audioOnly]);

  useEffect(() => {
    api.get('/chat')
      .then((r) => api.parseResponse<{ data?: Chat[] }>(r))
      .then((result) => setChats(Array.isArray(result.data) ? result.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = chats.filter((c) => (c.other_user_name || '').toLowerCase().includes(search.toLowerCase()));

  const formatTime = (t?: string) => {
    if (!t) return '';
    const d = new Date(t);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const startMeeting = async (requestedRoom: string) => {
    const nextRoom = sanitizeRoom(requestedRoom);
    if (!nextRoom) {
      toast.error('Enter a meeting name/ID');
      return;
    }
    setMeetingLoading(true);
    try {
      const res = await api.parseResponse<{ room?: string }>(
        await api.post('/meetings/token', {
          room: nextRoom,
          displayName: user?.full_name || user?.email || 'Provider',
        })
      );
      const finalRoom = sanitizeRoom(res.room || nextRoom);
      navigate(`/call/${encodeURIComponent(finalRoom)}${audioOnly ? '?audioOnly=true' : ''}`);
    } catch (err: unknown) {
      navigate(`/call/${encodeURIComponent(nextRoom)}${audioOnly ? '?audioOnly=true' : ''}`);
      const msg = err instanceof Error ? err.message : 'Could not create meeting token, joining anyway';
      toast.error(msg);
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied');
    } catch {
      toast.error('Copy failed. Select and copy the link manually.');
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chat</h1>

      {/* Meetings (Jitsi) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <p className="text-sm font-semibold text-gray-800">Meeting</p>
          <button
            type="button"
            onClick={() => setRoom(generateRoomId())}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            Create new ID
          </button>
        </div>

        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. canoe-consult-123"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
        />

        <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAudioOnly(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                !audioOnly ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Video className="w-4 h-4" />
              Video
            </button>
            <button
              type="button"
              onClick={() => setAudioOnly(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                audioOnly ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              Audio only
            </button>
          </div>

          <button
            type="button"
            onClick={() => startMeeting(room)}
            disabled={meetingLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
          >
            {meetingLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Start / Join
          </button>
        </div>

        {inviteUrl && (
          <div className="pt-3 mt-3 border-t border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invite link</p>
            <div className="flex items-center gap-2">
              <input
                value={inviteUrl}
                readOnly
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm mb-4">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">{search ? 'No conversations match your search.' : 'No conversations yet.'}</p>
          <Link to="/doctors" className="text-sm text-primary font-medium hover:underline mt-2 inline-block">Find a doctor to chat with</Link>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((c) => {
            const pic = api.getProfilePicUrl(c.other_user_pic);
            const name = c.other_user_name || (c.is_ai ? 'Canoe AI' : 'Chat');
            return (
              <Link key={c.conversation_id} to={`/chats/${c.conversation_id}`} state={{ name }} className="flex items-center gap-3 bg-white rounded-xl p-4 hover:bg-gray-50 transition">
                {pic ? (
                  <img src={pic} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold shrink-0">{name[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 truncate">{name}</p>
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(c.last_message_time)}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{c.last_message || 'Start a conversation'}</p>
                </div>
                {(c.unread_count || 0) > 0 && (
                  <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">{c.unread_count}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
