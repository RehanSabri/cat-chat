import { useEffect, useRef, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import socket from '../utils/socket';
import useWebRTC from '../hooks/useWebRTC';
import VideoPanel from './VideoPanel';
import '../strangest.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function getSessionName() {
  let name = sessionStorage.getItem('stranger_name');
  if (!name) {
    name = `Stranger #${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem('stranger_name', name);
  }
  return name;
}

function useLiveCounter(base = 4217) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => Math.max(3800, c + Math.floor(Math.random() * 7) - 3));
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return count.toLocaleString();
}

function fmt(d) {
  return String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0');
}

const REPORT_REASONS = ['Spam', 'Inappropriate content', 'Harassment', 'Underage user', 'Other'];

// ── InlineReportModal ─────────────────────────────────────────────────────────

function InlineReportModal({ open, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return;
    socket.emit('report_user', { reason, details });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason('');
      setDetails('');
      onClose();
    }, 2000);
  }

  function handleClose() {
    setReason('');
    setDetails('');
    setSubmitted(false);
    onClose();
  }

  return (
    <div className="sc-report-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="sc-report-card">
        {submitted ? (
          <div className="sc-report-success">
            <div className="sc-report-success-icon">
              <svg width="24" height="24" fill="none" stroke="#4ADE80" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h4>Report submitted</h4>
            <p>Thank you for helping keep Strangest safe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="sc-report-header">
              <span className="sc-report-title">Report Stranger</span>
              <button type="button" className="sc-report-close" onClick={handleClose}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="sc-report-reasons">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`sc-report-reason${reason === r ? ' selected' : ''}`}
                  onClick={() => setReason(r)}
                >
                  <div className="sc-report-radio">
                    {reason === r && <div className="sc-report-radio-dot" />}
                  </div>
                  <span className="sc-report-reason-text">{r}</span>
                </label>
              ))}
            </div>

            <textarea
              className="sc-report-textarea"
              rows={3}
              placeholder="Additional details (optional)…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            <div className="sc-report-actions">
              <button type="button" className="sc-report-cancel" onClick={handleClose}>Cancel</button>
              <button type="submit" className="sc-report-submit" disabled={!reason}>Submit Report</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── ChatPage ──────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    chatStatus,
    roomId,
    mode,
    messages,
    interests,
    setStatus,
    setRoom,
    setMode,
    setInterests,
    addMessage,
    clearMessages,
    resetChat,
  } = useChat();

  // URL params
  const urlMode      = searchParams.get('mode') || 'text';
  const urlInterests = searchParams.get('interests') || '';

  // refs / local state
  const isInitiatorRef  = useRef(false);
  const sessionNameRef  = useRef(getSessionName());
  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);

  const [inputText,    setInputText]    = useState('');
  const [seconds,      setSeconds]      = useState(0);
  const [msgCount,     setMsgCount]     = useState(0);
  const [isTyping,     setIsTyping]     = useState(false);
  const [reportOpen,   setReportOpen]   = useState(false);
  const [isInitiator,  setIsInitiator]  = useState(false); // mirrors isInitiatorRef for reactive prop
  const typingTimerRef = useRef(null);

  const onlineCount = useLiveCounter(4217);

  // derive matched-on from shared interests
  const parsedInterests = urlInterests.split(',').map((t) => t.trim()).filter(Boolean);
  const matchedOn = parsedInterests[0] || '—';

  // ── Init & socket join ─────────────────────────────────────────────────────
  useEffect(() => {
    const parsedMode = urlMode === 'video' ? 'video' : 'text';
    setMode(parsedMode);
    setInterests(parsedInterests);
    setStatus('connecting');

    if (!socket.connected) socket.connect();

    function joinQueue() {
      clearMessages();
      setMsgCount(0);
      setSeconds(0);
      socket.emit('join_queue', { mode: parsedMode, interests: parsedInterests });
    }

    if (socket.connected) joinQueue();
    else socket.once('connect', joinQueue);

    return () => socket.off('connect', joinQueue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatStatus !== 'chatting') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [chatStatus]);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    function handleMatched({ roomId: rid, initiator }) {
      isInitiatorRef.current = initiator;
      setIsInitiator(initiator); // trigger re-render so useWebRTC receives updated isInitiator
      setRoom(rid);
      setStatus('chatting');
      setSeconds(0);
      setMsgCount(0);
      addMessage({ sender: 'system', text: 'You are now chatting with a stranger. Say hi!' });
    }

    function handleStrangerMessage({ text }) {
      addMessage({ sender: 'stranger', text });
      setMsgCount((c) => c + 1);

      // show typing for 1.2 s after each message (mimic "still there")
      setIsTyping(true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 1200);
    }

    function handleStrangerDisconnected() {
      setIsTyping(false);
      setStatus('disconnected');
      addMessage({ sender: 'system', text: 'Stranger has disconnected.' });
    }

    function handleStrangerLeft() {
      setIsTyping(false);
      setStatus('disconnected');
      addMessage({ sender: 'system', text: 'Stranger has left the chat.' });
    }

    socket.on('matched',               handleMatched);
    socket.on('stranger_message',      handleStrangerMessage);
    socket.on('stranger_disconnected', handleStrangerDisconnected);
    socket.on('stranger_left',         handleStrangerLeft);

    return () => {
      socket.off('matched',               handleMatched);
      socket.off('stranger_message',      handleStrangerMessage);
      socket.off('stranger_disconnected', handleStrangerDisconnected);
      socket.off('stranger_left',         handleStrangerLeft);
    };
  }, [setRoom, setStatus, addMessage]);

  // ── WebRTC (video mode) ────────────────────────────────────────────────────
  const { localStream, remoteStream, cameraEnabled, micEnabled, mediaError, toggleCamera, toggleMic, cleanup: cleanupWebRTC } = useWebRTC(socket, roomId, isInitiator, mode);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Focus input ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatStatus === 'chatting') inputRef.current?.focus();
  }, [chatStatus]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || chatStatus !== 'chatting') return;
    socket.emit('send_message', { text });
    addMessage({ sender: 'me', text });
    setMsgCount((c) => c + 1);
    setInputText('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
  }, [inputText, chatStatus, addMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleInputChange = useCallback((e) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const handleNext = useCallback(() => {
    cleanupWebRTC();
    clearMessages();
    setIsTyping(false);
    setStatus('connecting');
    setRoom(null);
    setSeconds(0);
    setMsgCount(0);
    isInitiatorRef.current = false;
    setIsInitiator(false);
    socket.emit('next');
  }, [cleanupWebRTC, clearMessages, setStatus, setRoom]);

  const handleStop = useCallback(() => {
    cleanupWebRTC();
    setIsTyping(false);
    socket.emit('disconnect_chat');
    resetChat();
    navigate('/');
  }, [cleanupWebRTC, resetChat, navigate]);

  const handleCancel = useCallback(() => {
    socket.emit('leave_queue');
    cleanupWebRTC();
    resetChat();
    navigate('/');
  }, [cleanupWebRTC, resetChat, navigate]);

  const handleFindNew = useCallback(() => {
    cleanupWebRTC();
    clearMessages();
    setIsTyping(false);
    setStatus('connecting');
    setRoom(null);
    setSeconds(0);
    setMsgCount(0);
    isInitiatorRef.current = false;
    setIsInitiator(false);
    socket.emit('join_queue', { mode, interests: parsedInterests });
  }, [cleanupWebRTC, clearMessages, setStatus, setRoom, mode, parsedInterests]);

  // cleanup on unmount
  useEffect(() => () => { cleanupWebRTC(); socket.emit('disconnect_chat'); }, [cleanupWebRTC]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const isChatting     = chatStatus === 'chatting';
  const isDisconnected = chatStatus === 'disconnected';
  const isConnecting   = chatStatus === 'connecting' || chatStatus === 'idle';

  return (
    <div className="sc-root">
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;900&display=swap"
        rel="stylesheet"
      />

      {/* ── TOPBAR ── */}
      <div className="sc-topbar">
        <span className="sc-logo" onClick={() => navigate('/')}>strangest.</span>

        <div className="sc-topbar-center">
          <div className="sc-live-dot" />
          <span className="sc-topbar-status">
            {isConnecting   ? 'Finding a stranger…' :
             isChatting     ? 'Chatting with a stranger' :
             'Disconnected'}
          </span>
        </div>

        <span className="sc-online-count">{onlineCount} online</span>
      </div>

      {/* ── CONNECTING STATE ── */}
      {isConnecting && (
        <div className="sc-connecting">
          <div className="sc-spinner" />
          <span className="sc-connecting-text">Looking for a stranger…</span>
          <button className="sc-cancel-btn" id="cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      )}

      {/* ── VIDEO MODE ── */}
      {mode === 'video' && (isChatting || isDisconnected) && (
        <div className="sc-video-layout">
          <VideoPanel
            localStream={localStream}
            remoteStream={remoteStream}
            cameraEnabled={cameraEnabled}
            micEnabled={micEnabled}
            mediaError={mediaError}
            toggleCamera={toggleCamera}
            toggleMic={toggleMic}
          />

          {/* Chat panel — right side */}
          <div className="sc-chat-area">
            <div className="sc-messages-wrap" id="messages">
              {messages.map((msg) => {
                if (msg.sender === 'system') {
                  return <div key={msg.id} className="sc-sys-msg">{msg.text}</div>;
                }
                const isMe = msg.sender === 'me';
                return (
                  <div key={msg.id} className={`sc-msg-group ${isMe ? 'sc-me' : 'sc-them'}`}>
                    <div className="sc-msg-label">{isMe ? 'You' : 'Stranger'}</div>
                    <div className="sc-bubble">{msg.text}</div>
                    <div className="sc-bubble-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              {isChatting && isTyping && (
                <div className="sc-msg-group sc-them">
                  <div className="sc-msg-label">Stranger is typing</div>
                  <div className="sc-typing-bubble"><span /><span /><span /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="sc-input-bar">
              <button className="sc-emoji-btn" type="button">😊</button>
              <div className="sc-input-wrap">
                <textarea
                  ref={inputRef}
                  id="chat-input-video"
                  className="sc-chat-input"
                  rows={1}
                  placeholder={isChatting ? 'Type a message… (Enter to send)' : 'Waiting for connection…'}
                  disabled={!isChatting}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button
                id="send-btn-video"
                className="sc-send-btn"
                type="button"
                disabled={!isChatting || !inputText.trim()}
                onClick={handleSend}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <div className="sc-action-bar">
              <button id="next-btn-video" className="sc-btn sc-btn-next" onClick={handleNext}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                </svg>
                Next
              </button>
              <button id="stop-btn-video" className="sc-btn sc-btn-stop" onClick={handleStop}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                </svg>
                Stop
              </button>
              {isChatting && (
                <button id="report-btn-video" className="sc-btn sc-btn-report" onClick={() => setReportOpen(true)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Report
                </button>
              )}
            </div>

            {isDisconnected && (
              <div className="sc-disc-overlay">
                <div className="sc-disc-card">
                  <h3>Disconnected.</h3>
                  <p>The chat has ended. Jump back in whenever you're ready.</p>
                  <div className="sc-disc-actions">
                    <button id="new-chat-btn-video" className="sc-btn sc-btn-next" onClick={handleFindNew}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                      </svg>
                      New chat
                    </button>
                    <button className="sc-btn sc-btn-stop" onClick={handleStop}>Go home</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TEXT MODE: CHATTING / DISCONNECTED ── */}
      {mode !== 'video' && (isChatting || isDisconnected) && (
        <div className="sc-layout">


          {/* SIDEBAR */}
          <aside className="sc-sidebar">
            <div>
              <div className="sc-section-title">You're talking to</div>
              <div className="sc-stranger-card">
                <div className="sc-stranger-row">
                  <div className="sc-avatar">?</div>
                  <div>
                    <div className="sc-stranger-name">{sessionNameRef.current}</div>
                    <div className="sc-stranger-loc">🌍 Unknown</div>
                  </div>
                </div>
                {parsedInterests.length > 0 && (
                  <div className="sc-tag-row">
                    {parsedInterests.map((tag) => (
                      <span key={tag} className="sc-itag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sc-divider" />

            <div>
              <div className="sc-section-title">Session</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="sc-stat-row">
                  <span className="sc-label">Duration</span>
                  <span className="sc-value" id="timer">{fmt(seconds)}</span>
                </div>
                <div className="sc-stat-row">
                  <span className="sc-label">Messages</span>
                  <span className="sc-value" id="msg-count">{msgCount}</span>
                </div>
                <div className="sc-stat-row">
                  <span className="sc-label">Matched on</span>
                  <span className="sc-value">{matchedOn}</span>
                </div>
              </div>
            </div>

            {parsedInterests.length > 0 && (
              <>
                <div className="sc-divider" />
                <div>
                  <div className="sc-section-title">Your interests</div>
                  <div className="sc-tag-row">
                    {parsedInterests.map((tag) => (
                      <span key={tag} className="sc-itag">{tag}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </aside>

          {/* CHAT AREA */}
          <div className="sc-chat-area">

            {/* Messages */}
            <div className="sc-messages-wrap" id="messages">
              {messages.map((msg) => {
                if (msg.sender === 'system') {
                  return <div key={msg.id} className="sc-sys-msg">{msg.text}</div>;
                }
                const isMe = msg.sender === 'me';
                return (
                  <div key={msg.id} className={`sc-msg-group ${isMe ? 'sc-me' : 'sc-them'}`}>
                    <div className="sc-msg-label">{isMe ? 'You' : 'Stranger'}</div>
                    <div className="sc-bubble">{msg.text}</div>
                    <div className="sc-bubble-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator — shown while chatting and stranger is "active" */}
              {isChatting && isTyping && (
                <div className="sc-msg-group sc-them">
                  <div className="sc-msg-label">Stranger is typing</div>
                  <div className="sc-typing-bubble">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="sc-input-bar">
              <button className="sc-emoji-btn" type="button">😊</button>
              <div className="sc-input-wrap">
                <textarea
                  ref={inputRef}
                  id="chat-input"
                  className="sc-chat-input"
                  rows={1}
                  placeholder={isChatting ? 'Type a message… (Enter to send)' : 'Waiting for connection…'}
                  disabled={!isChatting}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button
                id="send-btn"
                className="sc-send-btn"
                type="button"
                disabled={!isChatting || !inputText.trim()}
                onClick={handleSend}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* Action bar */}
            <div className="sc-action-bar">
              <button id="next-btn" className="sc-btn sc-btn-next" onClick={handleNext}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                </svg>
                Next
              </button>
              <button id="stop-btn" className="sc-btn sc-btn-stop" onClick={handleStop}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                </svg>
                Stop
              </button>
              {isChatting && (
                <button id="report-btn" className="sc-btn sc-btn-report" onClick={() => setReportOpen(true)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Report
                </button>
              )}
            </div>

            {/* Disconnected overlay */}
            {isDisconnected && (
              <div className="sc-disc-overlay">
                <div className="sc-disc-card">
                  <h3>Disconnected.</h3>
                  <p>The chat has ended. Jump back in whenever you're ready.</p>
                  <div className="sc-disc-actions">
                    <button id="new-chat-btn" className="sc-btn sc-btn-next" onClick={handleFindNew}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                      </svg>
                      New chat
                    </button>
                    <button className="sc-btn sc-btn-stop" onClick={handleStop}>Go home</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report modal */}
      <InlineReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
