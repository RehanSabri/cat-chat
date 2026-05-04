import { useEffect, useRef } from 'react';

export default function VideoPanel({
  localStream,
  remoteStream,
  cameraEnabled,
  micEnabled,
  mediaError,
  toggleCamera,
  toggleMic,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (mediaError) {
    return (
      <div className="sc-video-col">
        <div className="sc-video-error">
          <svg width="36" height="36" fill="none" stroke="#FF6B6B" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p>{mediaError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-video-col">
      {/* ── Remote (stranger) video — top half ── */}
      <div className="sc-video-cell sc-video-remote">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="sc-video-el"
        />
        {(!remoteStream || remoteStream.getTracks().length === 0) && (
          <div className="sc-video-waiting">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Stranger&apos;s video</span>
          </div>
        )}
        <span className="sc-video-label">Stranger</span>
      </div>

      {/* ── Local (you) video — bottom half ── */}
      <div className="sc-video-cell sc-video-local">
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="sc-video-el sc-video-mirror"
          />
        ) : (
          <div className="sc-video-waiting">
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Camera loading…</span>
          </div>
        )}
        <span className="sc-video-label">You</span>

        {/* Camera / Mic controls */}
        <div className="sc-video-controls">
          <button
            className={`sc-vid-ctrl-btn${cameraEnabled ? '' : ' sc-vid-ctrl-off'}`}
            onClick={toggleCamera}
            title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraEnabled ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
          </button>

          <button
            className={`sc-vid-ctrl-btn${micEnabled ? '' : ' sc-vid-ctrl-off'}`}
            onClick={toggleMic}
            title={micEnabled ? 'Mute mic' : 'Unmute mic'}
          >
            {micEnabled ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
