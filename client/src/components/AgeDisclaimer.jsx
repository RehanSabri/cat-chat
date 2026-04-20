import { useState, useEffect } from 'react';

export default function AgeDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem('age_disclaimer_acknowledged');
    if (!acknowledged) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem('age_disclaimer_acknowledged', 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-8 max-w-md mx-4 text-center space-y-6 animate-slide-up">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-3xl">🔞</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Age Verification</h2>
        <p className="text-gray-400 leading-relaxed">
          This site is intended for users <strong className="text-white">18 years and older</strong>.
          By continuing, you confirm that you are at least 18 years of age and agree to our
          Terms of Service.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            className="btn-primary w-full text-lg"
            id="age-accept-btn"
          >
            I am 18 or older — Enter
          </button>
          <a
            href="https://www.google.com"
            className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            I am under 18 — Leave
          </a>
        </div>
      </div>
    </div>
  );
}
