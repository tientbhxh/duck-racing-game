import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import RaceTrack from './pages/RaceTrack';
import { Settings, Home } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => (
  <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold flex items-center gap-2">
        <span>🏁 Đường đua vịt Búa Liềm</span>
      </Link>
      <div className="flex gap-4">
        <Link to="/" className="hover:text-yellow-300 transition-colors flex items-center gap-1"><Home size={18}/> <span className="hidden sm:inline">Đường Đua</span></Link>
        <Link to="/admin" className="hover:text-yellow-300 transition-colors flex items-center gap-1"><Settings size={18}/> <span className="hidden sm:inline">Admin</span></Link>
      </div>
    </div>
  </nav>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto p-2 md:p-4">
          <Routes>
            <Route path="/" element={<RaceTrack />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;
