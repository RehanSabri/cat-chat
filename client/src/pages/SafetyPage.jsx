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

const RULES = [
  {
    tag: 'Rule #1',
    title: 'Be respectful.',
    body: 'Treat every stranger the way you would want to be treated. Harassment, hate speech, threats, or personal attacks of any kind are not tolerated and will result in an immediate ban.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    tag: 'Rule #2',
    title: 'Keep it legal.',
    body: 'Do not share, request, or link to any illegal content. This includes but is not limited to: illegal substances, weapons, or any content that violates local or international law.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    tag: 'Rule #3',
    title: 'No explicit content.',
    body: 'Strangest is not an adult platform. Nudity, sexually explicit material, or NSFW content of any kind is strictly forbidden. Violators are permanently banned.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
  {
    tag: 'Rule #4',
    title: 'Protect your privacy.',
    body: 'Never share your real name, home address, phone number, financial details, or any personal information with strangers online — regardless of how trustworthy they seem.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    tag: 'Rule #5',
    title: 'No spam or advertising.',
    body: 'Do not use Strangest to promote products, services, or websites. Unsolicited links, referral codes, and repetitive messages are treated as spam and will get you banned.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  {
    tag: 'Rule #6',
    title: 'You must be 18+.',
    body: 'Users must be at least 18 years old to use Strangest. If we discover or reasonably suspect that a user is under 18, we will immediately and permanently terminate their access.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

const TIPS = [
  { num: '01', title: 'Skip freely.', desc: "If a conversation makes you uncomfortable, click Skip instantly. You don't owe anyone an explanation." },
  { num: '02', title: 'Report bad actors.', desc: 'Use the report button in-chat. Our system acts on reports quickly — bans are issued in real time.' },
  { num: '03', title: "Don't share identifying info.", desc: 'Your name, city, school, or workplace can be used to locate you. Keep those details private.' },
  { num: '04', title: 'Screen-record awareness.', desc: 'Assume any video chat could be recorded. Only show and say things you would be comfortable with publicly.' },
  { num: '05', title: 'Trust your instincts.', desc: 'If something feels off, it probably is. Leave the chat immediately — your gut is a great moderator.' },
];

export default function SafetyPage() {
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
          <li><Link to="/safety" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>Safety</Link></li>
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
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        <div className="s-hero-kicker">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Your safety matters
        </div>
        <h1 className="s-h1" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
          Chat freely.<br /><em>Stay safe.</em>
        </h1>
        <p className="s-hero-sub">
          Strangest is built on anonymity and trust. Here is everything you need to know to have great conversations — and protect yourself while doing it.
        </p>
      </section>

      {/* ── RULES GRID ── */}
      <div style={{ maxWidth: 960, margin: '0 auto 5rem', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="s-feat-tag">Community rules</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginTop: '0.75rem' }}>
            Six rules. No exceptions.
          </h2>
        </div>
        <div className="s-features" style={{ margin: 0 }}>
          {RULES.map((r, i) => (
            <div className="s-feat-card" key={i}>
              <div style={{
                width: 52, height: 52,
                background: i % 2 === 0 ? 'var(--pink)' : 'var(--black)',
                color: i % 2 === 0 ? 'var(--black)' : 'var(--white)',
                border: '1.5px solid var(--black)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
                flexShrink: 0,
              }}>
                {r.icon}
              </div>
              <div className="s-feat-tag">{r.tag}</div>
              <h3 className="s-feat-title">{r.title}</h3>
              <p className="s-feat-body">{r.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TIPS SECTION ── */}
      <div style={{ maxWidth: 760, margin: '0 auto 6rem', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="s-feat-tag">Smart habits</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginTop: '0.75rem' }}>
            Five tips for staying safe.
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TIPS.map((tip, i) => (
            <div key={i} className="s-feat-card" style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr',
              gap: '0 1.5rem',
              alignItems: 'start',
              padding: '1.5rem 2rem',
            }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: 'var(--pink-d)',
                lineHeight: 1,
                marginTop: 2,
              }}>{tip.num}</span>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', marginBottom: 4 }}>{tip.title}</h3>
                <p className="s-feat-body" style={{ fontSize: '0.88rem' }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── REPORT HIGHLIGHT ── */}
      <div style={{ maxWidth: 960, margin: '0 auto 6rem', padding: '0 2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}>
          {/* Report card */}
          <div className="s-feat-card" style={{
            background: 'var(--black)',
            color: 'var(--white)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{
              width: 52, height: 52,
              background: 'var(--pink)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--black)',
            }}>
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <div className="s-feat-tag">In-chat tool</div>
            <h3 className="s-feat-title" style={{ color: '#fff' }}>See something? Report it.</h3>
            <p style={{ color: '#aaa', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Every chat has a report button. Tap it and our system flags the user immediately. Repeat offenders are banned automatically — no appeal.
            </p>
            <ul className="s-check-list" style={{ marginTop: 0 }}>
              {['Reports are anonymous', 'Bans issued in real time', 'No account needed to report'].map((item, i) => (
                <li key={i} style={{ color: '#aaa' }}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Emergency card */}
          <div className="s-feat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52,
              background: 'var(--black)',
              border: '1.5px solid var(--black)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="s-feat-tag">Real-world help</div>
            <h3 className="s-feat-title">If you feel in danger, call for help.</h3>
            <p className="s-feat-body">
              If you believe you or someone else is in immediate physical danger, contact your local emergency services. No online platform is a substitute for real-world help.
            </p>
            <div style={{
              background: 'var(--bg)',
              border: '1.5px solid var(--black)',
              borderRadius: 10,
              padding: '1rem',
              marginTop: 'auto',
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>Global emergency numbers</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                🇺🇸 US / Canada — <strong>911</strong><br />
                🇬🇧 UK — <strong>999</strong><br />
                🇪🇺 Europe — <strong>112</strong><br />
                🇮🇳 India — <strong>112</strong><br />
                🌍 International — <strong>112</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA BOX ── */}
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
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220,
            borderRadius: '50%',
            background: 'var(--pink)',
            opacity: 0.12,
          }} />
          <div className="s-feat-tag" style={{ marginBottom: '1.5rem' }}>Ready?</div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#fff',
            lineHeight: 1.05,
            marginBottom: '1rem',
          }}>
            Now you know the rules.<br />Go meet someone.
          </h2>
          <p style={{ color: '#aaa', fontSize: '1rem', marginBottom: '2rem', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            {onlineCount} people are online right now and following these same guidelines.
          </p>
          <button
            className="s-btn s-btn-white"
            style={{ fontSize: '1rem', padding: '14px 32px' }}
            onClick={() => handleStart('text')}
          >
            Start chatting safely →
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
