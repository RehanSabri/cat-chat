import { useState } from 'react';
import socket from '../utils/socket';
import { useChat } from '../context/ChatContext';

const REPORT_REASONS = [
  'Spam',
  'Inappropriate content',
  'Harassment',
  'Underage user',
  'Other',
];

export default function ReportModal() {
  const { isReportModalOpen, closeReportModal } = useChat();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isReportModalOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return;

    socket.emit('report_user', { reason, details });
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setReason('');
      setDetails('');
      closeReportModal();
    }, 2000);
  }

  function handleClose() {
    setReason('');
    setDetails('');
    setSubmitted(false);
    closeReportModal();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 max-w-md w-full mx-4 animate-slide-up">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold">Report submitted</p>
            <p className="text-gray-400 text-sm">Thank you for helping keep TextChat safe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Report Stranger</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                    reason === r
                      ? 'border-accent bg-accent/10'
                      : 'border-dark-border hover:border-dark-border/80 bg-dark-lighter'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      reason === r ? 'border-accent' : 'border-gray-500'
                    }`}
                  >
                    {reason === r && (
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                    )}
                  </div>
                  <span className="text-sm text-gray-300">{r}</span>
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)..."
              rows={3}
              className="w-full bg-dark-lighter border border-dark-border rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none transition-colors mb-5"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason}
                className="btn-danger flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
