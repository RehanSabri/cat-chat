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
      <div className="flex-1 flex items-center justify-center bg-dark-lighter rounded-2xl p-6 animate-fade-in">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-red-400 font-medium">{mediaError}</p>
          <p className="text-gray-500 text-sm">You can still use text chat to communicate.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-dark-lighter rounded-2xl overflow-hidden min-h-[300px] lg:min-h-0 animate-fade-in">
      {/* Remote Video (full panel) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Waiting overlay if no remote stream */}
      {(!remoteStream || remoteStream.getTracks().length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-lighter">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-dark-card flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Waiting for stranger&apos;s video...</p>
          </div>
        </div>
      )}

      {/* Local Video PiP (bottom-right) */}
      {localStream && (
        <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-44 sm:h-32 rounded-xl overflow-hidden border-2 border-dark-border shadow-2xl z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover video-mirror"
          />
        </div>
      )}

      {/* Camera & Mic Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-10">
        <button
          onClick={toggleCamera}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            cameraEnabled
              ? 'bg-dark-card/80 hover:bg-dark-card text-white'
              : 'bg-red-500/80 hover:bg-red-500 text-white'
          } backdrop-blur-sm`}
          title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraEnabled ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleMic}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            micEnabled
              ? 'bg-dark-card/80 hover:bg-dark-card text-white'
              : 'bg-red-500/80 hover:bg-red-500 text-white'
          } backdrop-blur-sm`}
          title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micEnabled ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
