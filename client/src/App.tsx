import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Multiplayer from './pages/Multiplayer';
import Room from './pages/Room';
import Stats from './pages/Stats';
import LeaderboardPage from './pages/LeaderboardPage';
import Navbar from './components/Navbar';
import FeedbackWidget from './components/FeedbackWidget';

function AppRoutes() {
  const location = useLocation();
  return (
    <Routes key={location.key}>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/multiplayer" element={<Multiplayer />} />
      <Route path="/room/:code" element={<Room />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <FeedbackWidget />
      </div>
    </BrowserRouter>
  );
}

export default App;
