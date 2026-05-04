import { useEffect, useRef, useState, useCallback } from 'react';

// ─── ICE servers ──────────────────────────────────────────────────────────────
// Google STUN + Metered STUN for NAT traversal.
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.relay.metered.ca:80' }, // Metered STUN
];

// TURN relay servers — required for users behind symmetric NAT (mobile networks, corporate firewalls).
// VITE_TURN_URLS is a comma-separated list of all TURN URLs from your Metered dashboard.
// VITE_TURN_USER and VITE_TURN_PASS are shared across all TURN URLs.
const turnUrls = import.meta.env.VITE_TURN_URLS; // comma-separated
const turnUser = import.meta.env.VITE_TURN_USER;
const turnPass = import.meta.env.VITE_TURN_PASS;

if (turnUrls && turnUser && turnPass) {
  // Split by comma and push one ICE server entry per URL — all share the same credential.
  turnUrls.split(',').forEach((url) => {
    ICE_SERVERS.push({ urls: url.trim(), username: turnUser, credential: turnPass });
  });
}

// ─── PeerConnection config ────────────────────────────────────────────────────
const PC_CONFIG = {
  iceServers: ICE_SERVERS,
  // Bundle all m-lines into a single transport — reduces port usage and latency.
  bundlePolicy: 'max-bundle',
  // Multiplex RTP and RTCP on the same port — required for max-bundle.
  rtcpMuxPolicy: 'require',
};

// ─── Media constraints ────────────────────────────────────────────────────────
// HD video @ 30fps + high-quality mono audio with all echo/noise processing enabled.
const MEDIA_CONSTRAINTS = {
  video: {
    width:     { ideal: 1280 },
    height:    { ideal: 720  },
    frameRate: { ideal: 30   },
  },
  audio: {
    echoCancellation: true,   // remove speaker echo from the mic feed
    noiseSuppression: true,   // filter background noise
    autoGainControl:  true,   // normalise volume levels
    sampleRate:       48000,  // Opus native sample rate
    channelCount:     1,      // mono — sufficient for voice, saves bandwidth
  },
};

// ─── Bitrate limits ───────────────────────────────────────────────────────────
const VIDEO_BITRATE_HIGH = 2_000_000;  // 2 Mbps — normal quality cap
const VIDEO_BITRATE_LOW  =   500_000;  // 500 Kbps — degraded quality under packet loss

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Force Opus as the audio codec and tune its parameters via SDP munging.
 * setCodecPreferences is used where available; SDP munging is the fallback.
 */
function preferOpus(pc) {
  // Modern API: setCodecPreferences on the audio transceiver
  pc.getTransceivers().forEach((transceiver) => {
    if (transceiver.sender?.track?.kind !== 'audio') return;
    const caps = RTCRtpSender.getCapabilities?.('audio');
    if (!caps) return;
    // Prefer Opus, keep everything else as fallback
    const opus    = caps.codecs.filter((c) => c.mimeType.toLowerCase() === 'audio/opus');
    const others  = caps.codecs.filter((c) => c.mimeType.toLowerCase() !== 'audio/opus');
    if (opus.length && transceiver.setCodecPreferences) {
      transceiver.setCodecPreferences([...opus, ...others]);
    }
  });
}

/**
 * Apply Opus parameters (high bitrate + in-band FEC) to the local SDP.
 * In-band FEC lets the decoder reconstruct lost packets from subsequent ones.
 */
function mungeOpusSDP(sdp) {
  // Find all Opus payload types and append fmtp parameters
  return sdp.replace(
    /(a=rtpmap:\d+ opus\/48000\/2\r\n)/g,
    '$1a=fmtp:111 maxaveragebitrate=128000;useinbandfec=1\r\n'
  );
}

/**
 * Cap the video sender's max bitrate via setParameters.
 * This is done post-negotiation so it doesn't require renegotiation.
 */
async function setVideoBitrate(pc, maxBitrateBps) {
  const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
  if (!sender) return;

  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    params.encodings.forEach((enc) => {
      enc.maxBitrate = maxBitrateBps;
    });
    await sender.setParameters(params);
  } catch (err) {
    console.warn('[WebRTC] setParameters failed:', err.message);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useWebRTC(socket, roomId, isInitiatorValue, mode) {
  const [localStream,    setLocalStream]    = useState(null);
  const [remoteStream,   setRemoteStream]   = useState(null);
  const [cameraEnabled,  setCameraEnabled]  = useState(true);
  const [micEnabled,     setMicEnabled]     = useState(true);
  const [mediaError,     setMediaError]     = useState(null);

  const peerConnectionRef   = useRef(null);
  const localStreamRef      = useRef(null);
  const remoteStreamRef     = useRef(null);
  const isCleanedUpRef      = useRef(false);
  const isInitiatorRef      = useRef(isInitiatorValue);
  const iceCandidateQueueRef = useRef([]);   // buffer candidates before remote desc is set
  const remoteDescSetRef    = useRef(false); // true once setRemoteDescription has succeeded
  const abr_intervalRef     = useRef(null);  // adaptive bitrate polling interval

  // ── cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;

    // Stop the adaptive bitrate polling loop
    if (abr_intervalRef.current) {
      clearInterval(abr_intervalRef.current);
      abr_intervalRef.current = null;
    }

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

  // ── camera / mic toggles ──────────────────────────────────────────────────
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

  // Keep isInitiatorRef in sync (it's read inside async closures)
  useEffect(() => {
    isInitiatorRef.current = isInitiatorValue;
  }, [isInitiatorValue]);

  // ── main WebRTC effect ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId || mode !== 'video') return;

    isCleanedUpRef.current = false;
    iceCandidateQueueRef.current = [];
    remoteDescSetRef.current = false;
    let isMounted = true;

    async function initWebRTC() {
      try {
        // ── 1. Acquire media ────────────────────────────────────────────────
        // Use HD video + tuned audio constraints for best quality.
        const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);

        if (!isMounted || isCleanedUpRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // ── 2. Create PeerConnection ────────────────────────────────────────
        // bundlePolicy + rtcpMuxPolicy are set in PC_CONFIG for reliability.
        const pc = new RTCPeerConnection(PC_CONFIG);
        peerConnectionRef.current = pc;

        // ── 3. Add local tracks ─────────────────────────────────────────────
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // ── 4. Prefer Opus codec on audio transceiver ───────────────────────
        // Must be called after addTrack so transceivers exist.
        preferOpus(pc);

        // ── 5. Handle remote stream ─────────────────────────────────────────
        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);

        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => remote.addTrack(track));
          setRemoteStream(new MediaStream(remote.getTracks()));
        };

        // ── 6. ICE candidate forwarding ─────────────────────────────────────
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc_ice_candidate', { candidate: event.candidate.toJSON() });
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('[WebRTC] ICE state:', pc.iceConnectionState);

          // Once connected, apply the initial video bitrate cap.
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setVideoBitrate(pc, VIDEO_BITRATE_HIGH);
            startABR(pc);  // begin adaptive bitrate monitoring
          }
        };

        // ── 7. Initiator creates and sends the offer ─────────────────────────
        if (isInitiatorRef.current) {
          let offer = await pc.createOffer();

          // Munge the SDP to inject Opus parameters (FEC + bitrate).
          // This is a fallback for browsers that don't support setCodecPreferences.
          offer = new RTCSessionDescription({
            type: offer.type,
            sdp:  mungeOpusSDP(offer.sdp),
          });

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

    // ── Adaptive Bitrate (ABR) ──────────────────────────────────────────────
    // Poll getStats every 5 s. If outbound video packet loss > 5%, throttle
    // the bitrate cap to 500 Kbps; recover to 2 Mbps when loss drops.
    function startABR(pc) {
      let lastPacketsSent = 0;
      let lastPacketsLost = 0;
      let currentBitrate  = VIDEO_BITRATE_HIGH;

      abr_intervalRef.current = setInterval(async () => {
        if (!peerConnectionRef.current) return;

        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            // Only look at the outbound video RTP stream
            if (report.type !== 'outbound-rtp' || report.kind !== 'video') return;

            const sentDelta = (report.packetsSent || 0) - lastPacketsSent;
            const lostDelta = (report.packetsLost || 0) - lastPacketsLost;
            lastPacketsSent = report.packetsSent || 0;
            lastPacketsLost = report.packetsLost || 0;

            if (sentDelta <= 0) return; // no new packets — skip

            const lossRate = lostDelta / (sentDelta + lostDelta);
            console.log(`[WebRTC] ABR — loss: ${(lossRate * 100).toFixed(1)}%, bitrate: ${currentBitrate / 1000} kbps`);

            if (lossRate > 0.05 && currentBitrate !== VIDEO_BITRATE_LOW) {
              // Packet loss > 5% — reduce quality to relieve congestion
              currentBitrate = VIDEO_BITRATE_LOW;
              setVideoBitrate(pc, currentBitrate);
              console.log('[WebRTC] ABR — throttling video to 500 Kbps');
            } else if (lossRate <= 0.05 && currentBitrate !== VIDEO_BITRATE_HIGH) {
              // Loss back to normal — restore full quality
              currentBitrate = VIDEO_BITRATE_HIGH;
              setVideoBitrate(pc, currentBitrate);
              console.log('[WebRTC] ABR — restoring video to 2 Mbps');
            }
          });
        } catch (err) {
          console.warn('[WebRTC] getStats error:', err.message);
        }
      }, 5000); // poll every 5 seconds
    }

    // ── Signaling handlers ──────────────────────────────────────────────────
    // These are identical in structure to before — only the offer path now
    // also munges the answer SDP for Opus parameters.

    function handleOffer({ offer }) {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          remoteDescSetRef.current = true;
          // Drain any ICE candidates that arrived before the remote description
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
        .then((answer) => {
          // Munge the answer SDP too so the non-initiator also benefits from Opus tuning
          const munged = new RTCSessionDescription({
            type: answer.type,
            sdp:  mungeOpusSDP(answer.sdp),
          });
          return pc.setLocalDescription(munged);
        })
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
          // Drain queued ICE candidates
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
        // Queue the candidate — remote description isn't set yet
        iceCandidateQueueRef.current.push(candidate);
        return;
      }

      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
        console.error('[WebRTC] ICE candidate error:', err)
      );
    }

    socket.on('webrtc_offer',         handleOffer);
    socket.on('webrtc_answer',        handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    initWebRTC();

    return () => {
      isMounted = false;
      socket.off('webrtc_offer',         handleOffer);
      socket.off('webrtc_answer',        handleAnswer);
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
