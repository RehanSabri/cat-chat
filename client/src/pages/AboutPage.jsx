import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../strangest.css';

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

const VALUES = [
  {
    tag: 'Core belief',
    title: 'Anonymity is a feature.',
    body: 'We built Strangest on the premise that people talk more honestly — and more kindly — when there are no profiles, no followers, and no reputation on the line.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    tag: 'Our promise',
    title: 'Zero data. Ever.',
    body: 'We do not log messages, store conversation history, or sell data. When the tab closes, the chat is gone — permanently. That is not a policy, it is the architecture.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    tag: 'Design goal',
    title: 'Connection in under 3 seconds.',
    body: 'Every engineering decision is measured against one metric: how fast can we get two strangers talking? Interest-matching, instant WebRTC, no sign-up friction — all of it exists for that number.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    tag: 'Community',
    title: '180+ countries, one platform.',
    body: "Geography should not decide who you get to meet. Strangest matches you globally — whether you're in Lagos, Seoul, São Paulo, or anywhere else, there's someone on the other side.",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
      </svg>
    ),
  },
];

const TIMELINE = [
  { year: '2024', label: 'Idea', desc: 'Started as a weekend project to rebuild the spontaneous connection of early internet chatrooms.' },
  { year: 'Early 2025', label: 'Beta', desc: 'First public beta launched with text chat. 10 000 conversations in the first week.' },
  { year: 'Mid 2025', label: 'Video', desc: 'WebRTC video chat rolled out. Users in 60+ countries connected face-to-face for the first time.' },
  { year: 'Now', label: 'Global', desc: '2 M+ daily users, 180+ countries, and a team obsessed with making that match time even faster.' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const onlineCount = useLiveCounter(4217);

  function handleStart(mode) {
    navigate(`/chat?mode=${mode}`);
  }

  return (
    <div className="strangest-root">
      <link
        href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;900&display=swap"
        rel="stylesheet"
      />

      {/* ── NAV ── */}
      <nav className="s-nav">
        <Link to="/" className="s-logo" style={{ textDecoration: 'none' }}>strangest.</Link>
        <ul className="s-nav-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); handleStart('text'); }}>Text Chat</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); handleStart('video'); }}>Video Chat</a></li>
          <li><Link to="/safety">Safety</Link></li>
          <li><Link to="/about" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>About</Link></li>
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
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        <div className="s-hero-kicker">
          <div className="s-live-dot" />
          Our story
        </div>
        <h1 className="s-h1" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
          Built for<br /><em>real</em> conversations.
        </h1>
        <p className="s-hero-sub">
          Strangest started with one question: what if the internet felt like talking to a stranger on a train — honest, present, and completely without agenda?
        </p>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ maxWidth: 700, margin: '0 auto 5rem', padding: '0 2rem' }}>
        <div className="s-stats-row" style={{ maxWidth: '100%' }}>
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
            <span className="s-stat-l">Data stored</span>
          </div>
        </div>
      </div>

      {/* ── VALUES GRID ── */}
      <div style={{ maxWidth: 960, margin: '0 auto 5rem', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="s-feat-tag">What we stand for</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginTop: '0.75rem' }}>
            A few things we care deeply about.
          </h2>
        </div>
        <div className="s-features" style={{ margin: 0 }}>
          {VALUES.map((v, i) => (
            <div className="s-feat-card" key={i}>
              <div style={{
                width: 52, height: 52,
                background: 'var(--pink)',
                border: '1.5px solid var(--black)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                {v.icon}
              </div>
              <div className="s-feat-tag">{v.tag}</div>
              <h3 className="s-feat-title">{v.title}</h3>
              <p className="s-feat-body">{v.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TIMELINE ── */}
      <div style={{ maxWidth: 760, margin: '0 auto 6rem', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="s-feat-tag">How we got here</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginTop: '0.75rem' }}>
            A short history.
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {TIMELINE.map((item, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '110px 1px 1fr',
              gap: '0 1.5rem',
              alignItems: 'stretch',
            }}>
              {/* year */}
              <div style={{
                textAlign: 'right',
                paddingBottom: i < TIMELINE.length - 1 ? '2.5rem' : 0,
                paddingTop: '0.15rem',
              }}>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '-0.02em' }}>{item.year}</span>
                <div style={{
                  display: 'inline-block',
                  background: 'var(--pink)',
                  border: '1.5px solid var(--black)',
                  borderRadius: 4,
                  padding: '1px 7px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  marginLeft: 6,
                  verticalAlign: 'middle',
                }}>{item.label}</div>
              </div>

              {/* spine */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 12, height: 12,
                  borderRadius: '50%',
                  background: 'var(--black)',
                  border: '2px solid var(--black)',
                  marginTop: '0.15rem',
                  flexShrink: 0,
                }} />
                {i < TIMELINE.length - 1 && (
                  <div style={{ flex: 1, width: 2, background: 'var(--black)', opacity: 0.15, marginTop: 4 }} />
                )}
              </div>

              {/* content */}
              <div style={{ paddingBottom: i < TIMELINE.length - 1 ? '2.5rem' : 0 }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MANIFESTO / QUOTE ── */}
      <div style={{ maxWidth: 960, margin: '0 auto 6rem', padding: '0 2rem' }}>
        <div style={{
          background: 'var(--black)',
          borderRadius: 'var(--radius)',
          padding: 'clamp(2rem, 5vw, 4rem)',
          border: '1.5px solid var(--black)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative pink blob */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220,
            borderRadius: '50%',
            background: 'var(--pink)',
            opacity: 0.12,
          }} />
          <div style={{
            position: 'absolute', bottom: -40, left: -40,
            width: 160, height: 160,
            borderRadius: '50%',
            background: 'var(--pink)',
            opacity: 0.08,
          }} />

          <div className="s-feat-tag" style={{ marginBottom: '1.5rem' }}>Our manifesto</div>
          <blockquote style={{
            fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#fff',
            lineHeight: 1.15,
            maxWidth: 680,
            margin: '0 auto 2rem',
          }}>
            "The best conversations happen between people who have nothing to prove to each other."
          </blockquote>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            That's why there are no profiles, no likes, no metrics. Just two people and a blank page.
          </p>
          <button
            className="s-btn s-btn-white"
            style={{ fontSize: '1rem', padding: '14px 32px' }}
            onClick={() => handleStart('text')}
          >
            Start a conversation →
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
          <li><Link to="/about">About</Link></li>
          <li><Link to="/privacy">Privacy Policy</Link></li>
          <li><Link to="/terms">Terms</Link></li>
        </ul>
        <div className="s-footer-copy">© 2025 Strangest, Inc.</div>
      </footer>
    </div>
  );
}
