import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../strangest.css';

// Animate an online counter that wobbles slightly to look live
function useLiveCounter(base = 4217) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.max(3800, c + delta);
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return count.toLocaleString();
}

const MARQUEE_ITEMS = [
  'Anonymous', 'Instant matching', 'Text & Video', 'No sign up',
  'Interest tags', '180+ countries',
  'Anonymous', 'Instant matching', 'Text & Video', 'No sign up',
  'Interest tags', '180+ countries',
  'Anonymous', 'Instant matching', 'Text & Video', 'No sign up',
  'Interest tags', '180+ countries',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState('');
  const onlineCount = useLiveCounter(4217);

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
    <div className="strangest-root">
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;900&display=swap"
        rel="stylesheet"
      />

      {/* ── NAV ── */}
      <nav className="s-nav">
        <div className="s-logo">strangest.</div>
        <ul className="s-nav-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); handleStart('text'); }}>Text Chat</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); handleStart('video'); }}>Video Chat</a></li>
          <li><Link to="/safety">Safety</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
        <div className="s-nav-right">
          <div className="s-nav-pill">
            <div className="s-live-dot" />
            {onlineCount} online
          </div>
          <button className="s-btn-nav" onClick={() => handleStart('text')}>
            Start chatting
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="s-hero">
        <div className="s-hero-kicker">
          <div className="s-live-dot" />
          No account needed — just click and talk
        </div>

        <h1 className="s-h1">
          Talk to<br />strangers.<br /><em>Instantly.</em>
        </h1>

        <p className="s-hero-sub">
          Meet real people around the world via text or video chat. Random. Anonymous. Free. Right now.
        </p>

        <div className="s-interest-area">
          <div className="s-interest-label">Match by interest (optional)</div>
          <input
            className="s-interest-input"
            type="text"
            placeholder="e.g. music, gaming, travel, coding…"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart('text')}
            id="interests-input"
          />
        </div>

        <div className="s-cta-row">
          <button className="s-btn s-btn-fill" onClick={() => handleStart('text')} id="text-chat-btn">
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Text Chat
          </button>
          <button className="s-btn s-btn-outline" onClick={() => handleStart('video')} id="video-chat-btn">
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video Chat
          </button>
        </div>

        <div className="s-stats-row">
          <div className="s-stat">
            <span className="s-stat-n">2M+</span>
            <span className="s-stat-l">Daily users</span>
          </div>
          <div className="s-stat">
            <span className="s-stat-n">180+</span>
            <span className="s-stat-l">Countries</span>
          </div>
          <div className="s-stat">
            <span className="s-stat-n">&lt;3s</span>
            <span className="s-stat-l">Match time</span>
          </div>
          <div className="s-stat">
            <span className="s-stat-n">0</span>
            <span className="s-stat-l">Sign-ups</span>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="s-marquee-wrap">
        <div className="s-marquee-track">
          {MARQUEE_ITEMS.map((item, i) => (
            <span className="s-marquee-item" key={i}>
              {item} <span className="s-marquee-dot" />
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES GRID ── */}
      <div className="s-features">

        {/* Wide card with chat preview */}
        <div className="s-feat-card wide">
          <div>
            <div className="s-feat-tag">Live right now</div>
            <h2 className="s-feat-title">Jump in. Meet someone real.</h2>
            <p className="s-feat-body">
              No profiles, no history. Every chat is a blank slate. Skip whenever you want — thousands of new people are waiting.
            </p>
            <button
              className="s-btn s-btn-fill"
              style={{ marginTop: '1.5rem', fontSize: '0.9rem', padding: '11px 22px' }}
              onClick={() => handleStart('text')}
            >
              Start talking →
            </button>
          </div>
          <div className="s-mini-chat">
            <div className="s-mini-chat-header">
              <div className="s-mini-avatar">?</div>
              <div>
                <div>Stranger #4,217</div>
                <div className="s-mini-status">● Connected · Brazil</div>
              </div>
            </div>
            <div className="s-mini-msg s-mini-them">Hey! Where are you from? 👋</div>
            <div className="s-mini-msg s-mini-me">India! You into music?</div>
            <div className="s-mini-msg s-mini-them">Yes! Big into hip-hop lately</div>
            <div className="s-typing-row">
              <span /><span /><span />
            </div>
          </div>
        </div>

        {/* Anonymous card */}
        <div className="s-feat-card">
          <div className="s-feat-tag">Privacy first</div>
          <h2 className="s-feat-title">Completely anonymous</h2>
          <p className="s-feat-body">
            No name, no email, no account. Your conversations disappear when you close the tab. Nothing is stored.
          </p>
          <ul className="s-check-list">
            <li>Zero data collected</li>
            <li>No chat history saved</li>
            <li>Close tab = chat gone</li>
          </ul>
        </div>

        {/* Match card */}
        <div className="s-feat-card">
          <div className="s-feat-tag">Smart matching</div>
          <span className="s-pink-num">3 sec</span>
          <h2 className="s-feat-title">Find your people, fast</h2>
          <p className="s-feat-body">
            Tag your interests and get matched with people who actually get you — in under 3 seconds, any time of day.
          </p>
        </div>

      </div>

      {/* ── CTA BOX ── */}
      <div className="s-cta-section">
        <div className="s-cta-box">
          <h2>Someone out there<br />wants to talk to you.</h2>
          <p>{onlineCount} people are online right now. One click and you're connected.</p>
          <button
            className="s-btn s-btn-white"
            style={{ fontSize: '1rem', padding: '14px 32px' }}
            onClick={() => handleStart('text')}
          >
            Start chatting — it's free
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="s-footer">
        <div className="s-footer-logo">strangest.</div>
        <ul className="s-footer-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); handleStart('text'); }}>Text Chat</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); handleStart('video'); }}>Video Chat</a></li>
          <li><Link to="/safety">Safety</Link></li>
          <li><Link to="/privacy">Privacy Policy</Link></li>
          <li><Link to="/terms">Terms</Link></li>
        </ul>
        <div className="s-footer-copy">© 2025 Strangest, Inc.</div>
      </footer>
    </div>
  );
}
