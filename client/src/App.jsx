import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AgeDisclaimer from './components/AgeDisclaimer';
import AboutPage from './pages/AboutPage';
import SafetyPage from './pages/SafetyPage';

export default function App() {
  return (
    <Router>
      <ChatProvider>
        <AgeDisclaimer />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/safety" element={<SafetyPage />} />
        </Routes>
      </ChatProvider>
    </Router>
  );
}
