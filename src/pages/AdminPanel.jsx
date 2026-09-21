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
    let rawLines = playerNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (rawLines.length === 0) {
      alert('Vui lòng nhập ít nhất 1 người chơi.');
      return;
    }
    
    let initialDucks = getInitialRaceState();
    let configuredDucks = [];
    let remainingPlayers = [];
    let remainingDucks = [...initialDucks];
    
    // Parse forced mappings (e.g. "Nguyễn Văn A: Vịt Sịp Hồng" or "Nguyễn Văn A - Vịt Báo Thủ")
    rawLines.forEach(line => {
      const match = line.match(/^(.+?)\s*[:\-：]\s*(.+)$/);
      if (match) {
        const playerName = match[1].trim();
        const preferredDuckName = match[2].trim();
        const duckIndex = remainingDucks.findIndex(d => d.name.toLowerCase() === preferredDuckName.toLowerCase());
        
        if (duckIndex !== -1) {
          // Found an exact match for the duck name in our predefined list
          const duck = remainingDucks.splice(duckIndex, 1)[0];
          configuredDucks.push({ ...duck, playerName });
        } else {
          // Custom name provided! Pick a random duck and overwrite its name.
          const randomIndex = Math.floor(Math.random() * remainingDucks.length);
          const duck = remainingDucks.splice(randomIndex, 1)[0];
          configuredDucks.push({ ...duck, name: preferredDuckName, playerName });
        }
      } else {
        remainingPlayers.push(line);
      }
    });
    
    // Shuffle remaining players and remaining ducks robustly
    remainingPlayers = remainingPlayers.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);
    remainingDucks = remainingDucks.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);
    
    // Assign remaining players
    remainingPlayers.forEach((playerName, idx) => {
      if (idx < remainingDucks.length) {
        configuredDucks.push({ ...remainingDucks[idx], playerName });
      }
    });

    // Final robust shuffle to ensure manually mapped players don't always appear first
    configuredDucks = configuredDucks
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

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
        const finishedDucks = currentDucks.filter(d => d.progress >= 1000);
        if (finishedDucks.length > 0) {
           // Sort by highest progress to ensure the furthest duck is crowned if multiple finish in the same tick
           finishedDucks.sort((a, b) => b.progress - a.progress);
           const winner = finishedDucks[0];
           
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
          // Increase variance for natural separation (0.4x to 1.2x)
          let multiplier = Math.random() * 0.8 + 0.4;
          
          let burstTicks = duck.burstTicks || 0;
          let stumbleTicks = duck.stumbleTicks || 0;

          // 1. Roll for new states if not currently in a special state
          if (burstTicks === 0 && Math.random() > 0.95) {
             burstTicks = Math.floor(Math.random() * 3) + 2; // 2-4 ticks of normal burst
          }

          // Drama mechanic 1: Continuous chaotic lead changes throughout the race
          if (maxProgress > 100 && maxProgress < 970 && burstTicks === 0 && stumbleTicks === 0) {
            if (duck.id === leaderId && Math.random() > 0.85) { 
              // Leader stumbles for 2-4 ticks (0.8 - 1.6 seconds)
              stumbleTicks = Math.floor(Math.random() * 3) + 2;
            } else if (duck.progress < maxProgress - 80 && Math.random() > 0.85) { 
              // Stragglers get a long adrenaline rush (3-5 ticks)
              burstTicks = Math.floor(Math.random() * 3) + 3;
            }
          }

          // Drama mechanic 2: The Final Scramble
          if (maxProgress > 850 && maxProgress < 970) {
            if (duck.id === leaderId && stumbleTicks === 0 && burstTicks === 0) {
               // Leader gets nervous and stumbles (100% guaranteed, but only if not currently bursting)
               stumbleTicks = 2;
            } else if (duck.progress > maxProgress - 200 && burstTicks === 0 && stumbleTicks === 0) {
              // Trailing ducks get a massive adrenaline rush
              if (Math.random() > 0.50) { // 50% chance (very high) to prevent clumping
                burstTicks = 4; // Long sprint to the finish
              }
            }
          }

          // 2. Apply active states
          if (stumbleTicks > 0) {
             multiplier = 0.5; // Slow but NOT a freeze (0.5x)
             stumbleTicks--;
          } else if (burstTicks > 0) {
             multiplier = 3.5; // Extremely fast (3.5x) to blast out of the pack
             burstTicks--;
          }

          const step = baseStep * multiplier;

          return {
            ...duck,
            progress: duck.progress + step,
            burstTicks,
            stumbleTicks
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
            <p className="text-sm text-slate-400 mb-3">
              Hệ thống sẽ tự động ghép tên người chơi vào 30 chú vịt vui nhộn ngẫu nhiên. 
              <br/><span className="text-yellow-400 font-bold">MẸO:</span> Để gán cố định 1 người chơi vào 1 chú vịt cụ thể (nhằm mục đích trêu đùa), hãy gõ theo cú pháp: <code className="bg-slate-700 px-1 rounded text-yellow-300">Tên người: Tên vịt</code> (Ví dụ: <i>Nguyễn Văn A: Vịt Sịp Hồng</i>).
            </p>
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
