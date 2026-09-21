import React, { useState, useEffect, useRef } from 'react';
import { db, dbRef, set, onValue, update } from '../firebase';
import { getInitialRaceState } from '../utils/duckGenerator';

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [playerNames, setPlayerNames] = useState(() => localStorage.getItem('duckRacingPlayers') || '');
  const [duration, setDuration] = useState(30);
  const [raceStatus, setRaceStatus] = useState('idle');
  const [ducks, setDucks] = useState([]);
  const [prizeContent, setPrizeContent] = useState('');
  const raceLoopRef = useRef(null);

  useEffect(() => {
    if (!isAdmin) return;
    const raceRef = dbRef('raceState');
    const unsubscribe = onValue(raceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRaceStatus(data.status || 'idle');
        setDucks(data.ducks || []);
        if (data.duration) setDuration(data.duration);
        if (data.prize) setPrizeContent(data.prize);
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem('duckRacingPlayers', playerNames);
  }, [playerNames]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAdmin(true);
    } else {
      alert('Sai mật khẩu!');
    }
  };

  const handleUpdateConfig = () => {
    // Generate ducks but don't assign names yet (reset names)
    const initialDucks = getInitialRaceState();
    const cleanDucks = initialDucks.map(d => ({ ...d, playerName: '' }));
    
    set(dbRef('raceState'), {
      status: 'idle',
      duration: parseInt(duration),
      ducks: cleanDucks,
      winner: null,
      prize: prizeContent
    });
    alert('Đã cập nhật danh sách Vịt! Bạn hãy bốc thăm để gán người chơi.');
  };

  const handleMatchmaking = () => {
    let names = playerNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) {
      alert('Vui lòng nhập ít nhất 1 người chơi.');
      return;
    }
    
    // Shuffle the player names
    names.sort(() => Math.random() - 0.5);
    
    let initialDucks = getInitialRaceState();
    initialDucks.sort(() => Math.random() - 0.5);
    
    const configuredDucks = initialDucks.slice(0, Math.min(names.length, 30)).map((duck, idx) => ({
      ...duck,
      playerName: names[idx]
    }));

    update(dbRef('raceState'), { 
      status: 'matching',
      ducks: configuredDucks 
    });
    
    // Removed setTimeout: Admin must manually click "Vào vị trí"
  };

  const handleReady = () => {
    update(dbRef('raceState'), { status: 'ready' });
  };

  const handleStartRace = () => {
    if (ducks.length === 0) {
      alert("Lỗi: Danh sách vịt trống! Vui lòng ấn 'Cập nhật cấu hình' trước (và đảm bảo Firebase đã cấp quyền).");
      return;
    }

    update(dbRef('raceState'), { status: 'running' });
    
    if (raceLoopRef.current) clearInterval(raceLoopRef.current);
    
    raceLoopRef.current = setInterval(() => {
      setDucks((currentDucks) => {
        let winnerFound = false;
        
        // Check if any duck has reached or crossed the finish line
        const winner = currentDucks.find(d => d.progress >= 1000);
        if (winner) {
           winnerFound = true;
           // If a winner is found, ONLY move the winner forward quickly. Stop everyone else.
           const newDucks = currentDucks.map(duck => {
             if (duck.id === winner.id) {
                // Swim forward to 1150 (takes 6 seconds at +10/tick) for a long solo lap of honor!
                return { ...duck, progress: Math.min(1150, duck.progress + 10) };
             }
             return duck;
           });
           
           update(dbRef('raceState'), { ducks: newDucks });

           // Once the winner finishes their solo lap (reaches 1150), end the race
           if (winner.progress >= 1150) {
             clearInterval(raceLoopRef.current);
             update(dbRef('raceState'), { status: 'finished', winner: winner });
           }
           
           return newDucks;
        }

        // Find max progress to identify the leader
        const maxProgress = Math.max(...currentDucks.map(d => d.progress));
        const leaderId = currentDucks.find(d => d.progress === maxProgress)?.id;

        // Normal racing logic if no one has finished yet
        const baseStep = 1000 / (duration * 2.5);
        const newDucks = currentDucks.map(duck => {
          // Increase variance for natural separation (0.3x to 1.3x)
          let isBurst = Math.random() > 0.95; // 5% chance of burst
          let multiplier = isBurst ? (Math.random() * 2.5 + 3.0) : (Math.random() * 1.0 + 0.3);

          // Drama mechanic: Intense scramble near the finish line (Rubber-banding)
          // Only apply between 800 and 970 so they don't freeze right on the finish line
          if (maxProgress > 800 && maxProgress < 970) {
            if (duck.id === leaderId) {
              // The leader gets nervous and slows down
              isBurst = false;
              multiplier = Math.random() * 0.4 + 0.5; // 0.5x - 0.9x
            } else if (duck.progress > maxProgress - 200) {
              // The trailing ducks get a huge adrenaline rush!
              isBurst = Math.random() > 0.50; // 50% chance to burst
              if (isBurst) {
                multiplier = Math.random() * 2.0 + 3.5; // Massive 3.5x - 5.5x burst!
              }
            }
          }

          const step = baseStep * multiplier;

          return {
            ...duck,
            progress: duck.progress + step
          };
        });

        update(dbRef('raceState'), { ducks: newDucks });
        return newDucks;
      });
    }, 400); // 2.5 ticks per second for smoothing
  };

  const handleReset = () => {
    if (raceLoopRef.current) clearInterval(raceLoopRef.current);
    const resetDucks = ducks.map(d => ({ ...d, progress: 0 }));
    update(dbRef('raceState'), {
      status: 'idle',
      ducks: resetDucks,
      winner: null
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] relative z-10">
        <div className="glass-card p-10 rounded-3xl w-full max-w-md relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400"></div>
          <h2 className="text-3xl font-black mb-8 text-center text-gradient">Đăng nhập Admin</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white transition-all shadow-inner backdrop-blur-sm"
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative z-10 animate-fade-in">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-emerald-400">Cấu hình cuộc đua</h2>
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-slate-300">Danh sách Người chơi (Tối đa 30, mỗi dòng 1 tên):</label>
            <p className="text-sm text-slate-400 mb-3">Hệ thống sẽ tự động ghép tên người chơi vào 30 chú vịt vui nhộn ngẫu nhiên.</p>
            <textarea 
              value={playerNames}
              onChange={(e) => setPlayerNames(e.target.value)}
              className="w-full h-48 px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner backdrop-blur-sm custom-scrollbar"
              placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-slate-300">Thời gian đua dự kiến (giây):</label>
              <input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all shadow-inner backdrop-blur-sm" 
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-slate-300">Nội dung giải thưởng (Ví dụ: Thẻ cào 50k):</label>
              <input 
                type="text" 
                value={prizeContent}
                onChange={(e) => setPrizeContent(e.target.value)}
                className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all shadow-inner backdrop-blur-sm" 
                placeholder="Giải nhất: 1 phần quà bí mật..."
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
            <button onClick={handleUpdateConfig} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0">
              💾 Cập nhật cấu hình
            </button>
            <button onClick={handleMatchmaking} disabled={raceStatus === 'running'} className="flex-1 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0">
              🎲 Bốc thăm ngẫu nhiên
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-400">Điều khiển</h2>
          <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 mt-2 md:mt-0 font-mono text-sm shadow-inner">
            Trạng thái: <span className="text-white font-bold">{raceStatus.toUpperCase()}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {raceStatus === 'matching' && (
            <button onClick={handleReady} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0">
              ✨ Vào vị trí (Sẵn sàng)
            </button>
          )}
          <button onClick={handleStartRace} disabled={raceStatus !== 'ready'} className="flex-1 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0 text-xl tracking-wide">
            🚀 BẮT ĐẦU ĐUA
          </button>
          <button onClick={handleReset} className="sm:flex-none bg-slate-700 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-red-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0">
            Làm lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
