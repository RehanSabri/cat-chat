import { useCallback, useRef } from 'react';
import { useChat } from '../context/ChatContext';

export default function ActionBar({ onNext, onStop }) {
  const { toggleReportModal, chatStatus } = useChat();
  const lastNextClick = useRef(0);

  const handleNext = useCallback(() => {
    const now = Date.now();
    if (now - lastNextClick.current < 500) return; // debounce 500ms
    lastNextClick.current = now;
    onNext();
  }, [onNext]);

  if (chatStatus !== 'chatting' && chatStatus !== 'disconnected') return null;

  return (
    <div className="flex items-center justify-center gap-3 p-4 border-t border-dark-border bg-dark-lighter/50 backdrop-blur-sm animate-fade-in">
      <button
        onClick={handleNext}
        className="btn-danger flex items-center gap-2 text-sm"
        id="next-btn"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        Next
      </button>

      <button
        onClick={onStop}
        className="btn-ghost flex items-center gap-2 text-sm"
        id="stop-btn"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        Stop
      </button>

      {chatStatus === 'chatting' && (
        <button
          onClick={toggleReportModal}
          className="btn-ghost flex items-center gap-2 text-sm text-yellow-500 border-yellow-500/30 hover:border-yellow-500/60"
          id="report-btn"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Report
        </button>
      )}
    </div>
  );
}
