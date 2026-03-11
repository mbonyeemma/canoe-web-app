import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '../contexts/AuthContext';
import { Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { JITSI_DOMAIN } from '../config/jitsi';

export default function VideoCall() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) return;
    api
      .get(`/jitsi/token?room=${encodeURIComponent(meetingId)}`)
      .then((r) => api.parseResponse<{ status: number; token?: string }>(r))
      .then((data) => {
        setJwt(data.token ?? null);
      })
      .catch(() => {
        setJwt(null);
        toast.error('Could not authorize the meeting. Please refresh and try again.');
      });
  }, [meetingId]);

  const audioOnly = searchParams.get('audioOnly') === 'true';

  if (!meetingId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Invalid meeting link.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Minimal header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <Phone className="w-4 h-4" />
          Leave call
        </button>
        <span className="text-gray-500 text-xs ml-auto">Room: {meetingId}</span>
      </div>

      {/* Jitsi iframe fills remaining space */}
      <div className="flex-1">
        <JitsiMeeting
          domain={JITSI_DOMAIN}
          roomName={meetingId}
          jwt={jwt || undefined}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: audioOnly,
            disableModeratorIndicator: true,
            startScreenSharing: false,
            enableEmailInStats: false,
            prejoinPageEnabled: false,
            // Keep layout simple and focused
            toolbarButtons: [
              'microphone',
              'camera',
              'desktop',     // screen share
              'hangup',
              'fullscreen',
              'settings',
            ],
            // Simplify side UI
            disableDeepLinking: true,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            // Minimal toolbar similar to WhatsApp-style call controls
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'hangup',
              'fullscreen',
              'settings',
            ],
            // Hide extra chrome
            HIDE_INVITE_MORE_HEADER: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
          }}
          userInfo={{
            displayName: user?.full_name || user?.email || 'Provider',
            email: user?.email || '',
          }}
          onReadyToClose={() => navigate(-1)}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
        />
      </div>
    </div>
  );
}
