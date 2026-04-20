import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import socket from '../utils/socket';
import useWebRTC from '../hooks/useWebRTC';
import Spinner from './Spinner';
import VideoPanel from './VideoPanel';
import ChatPanel from './ChatPanel';
import ActionBar from './ActionBar';
import ReportModal from './ReportModal';

function getSessionName() {
  let name = sessionStorage.getItem('stranger_name');
  if (!name) {
    name = `Stranger #${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem('stranger_name', name);
  }
  return name;
}

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    chatStatus,
    roomId,
    mode,
    setStatus,
    setRoom,
    setMode,
    setInterests,
    addMessage,
    clearMessages,
    resetChat,
  } = useChat();

  const isInitiatorRef = useRef(false);
  const sessionName = useRef(getSessionName());

  // Parse URL params on mount
  const urlMode = searchParams.get('mode') || 'text';
  const urlInterests = searchParams.get('interests') || '';

  // Initialize and connect
  useEffect(() => {
    const parsedMode = urlMode === 'video' ? 'video' : 'text';
    const parsedInterests = urlInterests
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setMode(parsedMode);
    setInterests(parsedInterests);
    setStatus('connecting'); // Show spinner immediately

    // Connect socket if not already
    if (!socket.connected) {
      socket.connect();
    }

    // Wait for connection and then join queue
    function joinQueue() {
      clearMessages();
      socket.emit('join_queue', {
        mode: parsedMode,
        interests: parsedInterests,
      });
    }

    if (socket.connected) {
      joinQueue();
    } else {
      socket.once('connect', joinQueue);
    }

    return () => {
      socket.off('connect', joinQueue);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket event listeners
  useEffect(() => {
    function handleMatched({ roomId: rid, initiator }) {
      isInitiatorRef.current = initiator;
      setRoom(rid);
      setStatus('chatting');
      addMessage({
        sender: 'system',
        text: 'You are now chatting with a stranger. Say hi!',
      });
    }

    function handleStrangerMessage({ text }) {
      addMessage({ sender: 'stranger', text });
    }

    function handleStrangerDisconnected() {
      setStatus('disconnected');
      addMessage({
        sender: 'system',
        text: 'Stranger has disconnected.',
      });
    }

    function handleStrangerLeft() {
      setStatus('disconnected');
      addMessage({
        sender: 'system',
        text: 'Stranger has left the chat.',
      });
      // Auto-navigate home after 2 s so the partner isn\'t left hanging
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }

    socket.on('matched', handleMatched);
    socket.on('stranger_message', handleStrangerMessage);
    socket.on('stranger_disconnected', handleStrangerDisconnected);
    socket.on('stranger_left', handleStrangerLeft);

    return () => {
      socket.off('matched', handleMatched);
      socket.off('stranger_message', handleStrangerMessage);
      socket.off('stranger_disconnected', handleStrangerDisconnected);
      socket.off('stranger_left', handleStrangerLeft);
    };
  }, [setRoom, setStatus, addMessage]);

  // WebRTC hook
  const {
    localStream,
    remoteStream,
    cameraEnabled,
    micEnabled,
    mediaError,
    toggleCamera,
    toggleMic,
    cleanup: cleanupWebRTC,
  } = useWebRTC(socket, roomId, isInitiatorRef.current, mode);

  // Handle "Next" — disconnect current and find new stranger
  const handleNext = useCallback(() => {
    cleanupWebRTC();
    clearMessages();
    setStatus('connecting');
    setRoom(null);
    isInitiatorRef.current = false;
    socket.emit('next');
  }, [cleanupWebRTC, clearMessages, setStatus, setRoom]);

  // Handle "Stop" — disconnect and go home
  const handleStop = useCallback(() => {
    cleanupWebRTC();
    socket.emit('disconnect_chat');
    resetChat();
    navigate('/');
  }, [cleanupWebRTC, resetChat, navigate]);

  // Handle cancel (while connecting)
  const handleCancel = useCallback(() => {
    socket.emit('leave_queue');
    cleanupWebRTC();
    resetChat();
    navigate('/');
  }, [cleanupWebRTC, resetChat, navigate]);

  // Handle "Find new" (from disconnected state)
  const handleFindNew = useCallback(() => {
    cleanupWebRTC();
    clearMessages();
    setStatus('connecting');
    setRoom(null);
    isInitiatorRef.current = false;

    const parsedInterests = urlInterests
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    socket.emit('join_queue', {
      mode: mode,
      interests: parsedInterests,
    });
  }, [cleanupWebRTC, clearMessages, setStatus, setRoom, mode, urlInterests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWebRTC();
      socket.emit('disconnect_chat');
    };
  }, [cleanupWebRTC]);

  return (
    <div className="h-screen flex flex-col bg-dark">
      {/* STATE A: Connecting (or idle fallback) */}
      {(chatStatus === 'connecting' || chatStatus === 'idle') && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in">
          <Spinner />
          <button
            onClick={handleCancel}
            className="btn-ghost text-sm"
            id="cancel-btn"
          >
            Cancel
          </button>
        </div>
      )}

      {/* STATE B: Chatting */}
      {chatStatus === 'chatting' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
            {/* Video Panel (only in video mode) */}
            {mode === 'video' && (
              <div className="lg:flex-1 lg:max-w-[60%] p-2">
                <VideoPanel
                  localStream={localStream}
                  remoteStream={remoteStream}
                  cameraEnabled={cameraEnabled}
                  micEnabled={micEnabled}
                  mediaError={mediaError}
                  toggleCamera={toggleCamera}
                  toggleMic={toggleMic}
                />
              </div>
            )}

            {/* Chat Panel */}
            <div className={`${mode === 'video' ? 'lg:w-[40%]' : 'w-full'} flex-1 lg:flex-none p-2`}>
              <div className="h-full">
                <ChatPanel />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <ActionBar onNext={handleNext} onStop={handleStop} />
        </div>
      )}

      {/* STATE C: Disconnected */}
      {chatStatus === 'disconnected' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Keep showing chat panel with messages */}
          <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
            {mode === 'video' && (
              <div className="lg:flex-1 lg:max-w-[60%] p-2">
                <VideoPanel
                  localStream={localStream}
                  remoteStream={remoteStream}
                  cameraEnabled={cameraEnabled}
                  micEnabled={micEnabled}
                  mediaError={mediaError}
                  toggleCamera={toggleCamera}
                  toggleMic={toggleMic}
                />
              </div>
            )}
            <div className={`${mode === 'video' ? 'lg:w-[40%]' : 'w-full'} flex-1 lg:flex-none p-2`}>
              <div className="h-full relative">
                <ChatPanel />
                {/* Disconnected overlay */}
                <div className="absolute top-14 left-0 right-0 flex justify-center z-10 animate-slide-up">
                  <div className="glass-card px-5 py-3 flex items-center gap-4 mx-4">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-300">Stranger has disconnected</span>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={handleFindNew}
                        className="text-xs bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        New stranger
                      </button>
                      <button
                        onClick={handleStop}
                        className="text-xs bg-dark-lighter hover:bg-dark-card text-gray-400 px-3 py-1.5 rounded-lg transition-colors border border-dark-border"
                      >
                        Go home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <ActionBar onNext={handleNext} onStop={handleStop} />
        </div>
      )}

      {/* Report Modal */}
      <ReportModal />
    </div>
  );
}
