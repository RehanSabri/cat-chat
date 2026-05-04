import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Add TURN server if configured
const turnUrl = import.meta.env.VITE_TURN_URL;
const turnUser = import.meta.env.VITE_TURN_USER;
const turnPass = import.meta.env.VITE_TURN_PASS;

if (turnUrl && turnUser && turnPass) {
  ICE_SERVERS.push({
    urls: turnUrl,
    username: turnUser,
    credential: turnPass,
  });
}

export default function useWebRTC(socket, roomId, isInitiatorValue, mode) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const isCleanedUpRef = useRef(false);
  const isInitiatorRef = useRef(isInitiatorValue);
  const iceCandidateQueueRef = useRef([]); // buffer candidates before remote description is set
  const remoteDescSetRef = useRef(false);  // tracks whether remote description has been applied

  const cleanup = useCallback(() => {
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCameraEnabled(true);
    setMicEnabled(true);
    setMediaError(null);
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Keep isInitiatorRef in sync with whatever value is passed in
  useEffect(() => {
    isInitiatorRef.current = isInitiatorValue;
  }, [isInitiatorValue]);

  useEffect(() => {
    if (!socket || !roomId || mode !== 'video') return;

    isCleanedUpRef.current = false;
    iceCandidateQueueRef.current = [];
    remoteDescSetRef.current = false;
    let isMounted = true;

    async function initWebRTC() {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isMounted || isCleanedUpRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Create peer connection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);

        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remote.addTrack(track);
          });
          setRemoteStream(new MediaStream(remote.getTracks()));
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc_ice_candidate', {
              candidate: event.candidate.toJSON(),
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('[WebRTC] ICE state:', pc.iceConnectionState);
        };

        // If initiator, create and send offer
        if (isInitiatorRef.current) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_offer', { offer: pc.localDescription });
        }
      } catch (err) {
        console.error('[WebRTC] Error:', err);
        if (isMounted) {
          setMediaError(
            err.name === 'NotAllowedError'
              ? 'Camera/microphone permission denied. Please allow access or switch to text mode.'
              : err.name === 'NotFoundError'
              ? 'No camera or microphone found on this device.'
              : 'Failed to access camera/microphone. Please try again.'
          );
        }
      }
    }

    // Socket event handlers for WebRTC signaling
    function handleOffer({ offer }) {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          remoteDescSetRef.current = true;
          // Drain any queued ICE candidates that arrived before this
          const queue = iceCandidateQueueRef.current.splice(0);
          return Promise.all(
            queue.map((c) =>
              pc.addIceCandidate(new RTCIceCandidate(c)).catch((e) =>
                console.error('[WebRTC] Queued ICE candidate error:', e)
              )
            )
          );
        })
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => {
          socket.emit('webrtc_answer', { answer: pc.localDescription });
        })
        .catch((err) => console.error('[WebRTC] Offer handling error:', err));
    }

    function handleAnswer({ answer }) {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      pc.setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => {
          remoteDescSetRef.current = true;
          // Drain any queued ICE candidates that arrived before this
          const queue = iceCandidateQueueRef.current.splice(0);
          return Promise.all(
            queue.map((c) =>
              pc.addIceCandidate(new RTCIceCandidate(c)).catch((e) =>
                console.error('[WebRTC] Queued ICE candidate error:', e)
              )
            )
          );
        })
        .catch((err) => console.error('[WebRTC] Answer handling error:', err));
    }

    function handleIceCandidate({ candidate }) {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      if (!remoteDescSetRef.current) {
        // Remote description not set yet — queue the candidate
        iceCandidateQueueRef.current.push(candidate);
        return;
      }

      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
        console.error('[WebRTC] ICE candidate error:', err)
      );
    }

    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    initWebRTC();

    return () => {
      isMounted = false;
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      cleanup();
    };
  }, [socket, roomId, mode, cleanup]);

  return {
    localStream,
    remoteStream,
    cameraEnabled,
    micEnabled,
    mediaError,
    toggleCamera,
    toggleMic,
    cleanup,
  };
}
