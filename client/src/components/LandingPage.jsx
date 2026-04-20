import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState('');

  function handleStart(mode) {
    const tags = interests
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const params = new URLSearchParams({ mode });
    if (tags.length > 0) {
      params.set('interests', tags.join(','));
    }

    navigate(`/chat?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center space-y-10 animate-fade-in">
          {/* Logo / Branding */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-accent">Online now — thousands of strangers</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              Talk to strangers.{' '}
              <span className="text-gradient">Instantly.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 mt-4 max-w-lg mx-auto leading-relaxed">
              Meet random people around the world via text or video chat. No signup needed.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleStart('text')}
              className="btn-primary w-full sm:w-auto text-lg px-10 py-4 flex items-center justify-center gap-3"
              id="text-chat-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Text Chat
            </button>

            <button
              onClick={() => handleStart('video')}
              className="w-full sm:w-auto text-lg px-10 py-4 flex items-center justify-center gap-3 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/25"
              id="video-chat-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video Chat
            </button>
          </div>

          {/* Interests Input */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm text-gray-500 mb-2 text-left">
              Add interests (optional) — get matched with similar people
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. music, gaming, travel"
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              id="interests-input"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-xs text-gray-500">Users online</p>
            </div>
            <div className="w-px h-10 bg-dark-border"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">1M+</p>
              <p className="text-xs text-gray-500">Conversations daily</p>
            </div>
            <div className="w-px h-10 bg-dark-border"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">190+</p>
              <p className="text-xs text-gray-500">Countries</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© 2026 TextChat. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-xs text-gray-500 hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <a
              href="mailto:bugs@textchat.com"
              className="text-xs text-gray-500 hover:text-accent transition-colors"
            >
              Report a Bug
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
