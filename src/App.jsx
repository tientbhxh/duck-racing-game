import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import RaceTrack from './pages/RaceTrack';
import { Settings, Home } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => (
  <nav className="glass-panel sticky top-0 z-50 transition-all duration-300">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-black flex items-center gap-3 group">
        <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🦆</span>
        <span className="text-gradient tracking-tight">Đường đua vịt Búa Liềm</span>
      </Link>
      <div className="flex gap-6">
        <Link to="/" className="text-slate-300 hover:text-blue-400 font-medium transition-all flex items-center gap-2 group"><Home size={18} className="group-hover:scale-110 transition-transform duration-300"/> <span className="hidden sm:inline">Trường Đua</span></Link>
        <Link to="/admin" className="text-slate-300 hover:text-purple-400 font-medium transition-all flex items-center gap-2 group"><Settings size={18} className="group-hover:scale-110 transition-transform duration-300"/> <span className="hidden sm:inline">Admin</span></Link>
      </div>
    </div>
  </nav>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
        {/* Dynamic ambient background blobs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob z-0"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 z-0"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000 z-0"></div>

        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 z-10">
          <Routes>
            <Route path="/" element={<RaceTrack />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
        <ToastContainer position="bottom-right" theme="dark" toastClassName="glass-card" />
      </div>
    </Router>
  );
}

export default App;
