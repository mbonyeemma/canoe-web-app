import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import api from '../services/api';

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chat</h1>

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
