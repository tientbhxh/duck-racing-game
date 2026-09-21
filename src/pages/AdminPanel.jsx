import React, { useState, useEffect, useRef } from 'react';
import { db, dbRef, set, onValue, update } from '../firebase';
import { getInitialRaceState } from '../utils/duckGenerator';

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [playerNames, setPlayerNames] = useState('');
  const [duration, setDuration] = useState(30);
  const [raceStatus, setRaceStatus] = useState('idle');
  const [ducks, setDucks] = useState([]);
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
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

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
      winner: null
    });
    alert('Đã cập nhật danh sách Vịt! Bạn hãy bốc thăm để gán người chơi.');
  };

  const handleMatchmaking = () => {
    const names = playerNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) {
      alert('Vui lòng nhập ít nhất 1 người chơi.');
      return;
    }
    
    let initialDucks = getInitialRaceState();
    // Shuffle ducks to randomize pairing
    initialDucks.sort(() => Math.random() - 0.5);
    
    // Assign names up to the available slots
    const configuredDucks = initialDucks.slice(0, Math.min(names.length, 30)).map((duck, idx) => ({
      ...duck,
      playerName: names[idx]
    }));

    update(dbRef('raceState'), { 
      status: 'matching',
      ducks: configuredDucks 
    });
    
    // Auto transition to ready after 15 seconds of matching animation
    setTimeout(() => {
      update(dbRef('raceState'), { status: 'ready' });
    }, 15000);
  };

  const handleStartRace = () => {
    if (ducks.length === 0) {
      alert("Lỗi: Danh sách vịt trống! Vui lòng ấn 'Cập nhật cấu hình' trước (và đảm bảo Firebase đã cấp quyền).");
      return;
    }

    update(dbRef('raceState'), { status: 'running' });
    
    // Start Game Loop on Admin side
    if (raceLoopRef.current) clearInterval(raceLoopRef.current);
    
    raceLoopRef.current = setInterval(() => {
      setDucks((currentDucks) => {
        let allFinished = true;
        const newDucks = currentDucks.map(duck => {
          if (duck.progress >= 1000) return duck; // Target distance is 1000
          allFinished = false;
          
          // Random burst logic (duration average for 1000 distance)
          // Progress per tick (400ms) = 1000 / (duration * 2.5 ticks/sec)
          const baseStep = 1000 / (duration * 2.5);
          const isBurst = Math.random() > 0.85; 
          const step = baseStep * (isBurst ? (Math.random() * 3 + 1) : Math.random() + 0.5);

          return {
            ...duck,
            progress: Math.min(1000, duck.progress + step)
          };
        });

        // Push to firebase
        update(dbRef('raceState'), { ducks: newDucks });

        if (allFinished) {
          clearInterval(raceLoopRef.current);
          update(dbRef('raceState'), { status: 'finished' });
        }
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
      <div className="flex justify-center items-center h-[70vh]">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập Admin</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-4 py-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Cấu hình cuộc đua</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Danh sách Người chơi (Tối đa 30, mỗi dòng 1 tên):</label>
            <p className="text-sm text-slate-500 mb-2">Hệ thống sẽ tự động ghép tên người chơi vào 30 chú vịt vui nhộn ngẫu nhiên.</p>
            <textarea 
              value={playerNames}
              onChange={(e) => setPlayerNames(e.target.value)}
              className="w-full h-48 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:bg-slate-700 dark:border-slate-600"
              placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C"
            ></textarea>
          </div>
          <div>
            <label className="block mb-2 font-medium">Thời gian đua dự kiến (giây):</label>
            <input 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:bg-slate-700 dark:border-slate-600" 
            />
          </div>
          <div className="flex space-x-4">
            <button onClick={handleUpdateConfig} className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
              Cập nhật cấu hình
            </button>
            <button onClick={handleMatchmaking} disabled={raceStatus === 'running'} className="disabled:opacity-50 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Bốc thăm ngẫu nhiên
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Điều khiển (Trạng thái: {raceStatus})</h2>
        <div className="flex space-x-4">
          <button onClick={handleStartRace} disabled={raceStatus !== 'ready'} className="disabled:opacity-50 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Bắt đầu đua ngay
          </button>
          <button onClick={handleReset} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
            Làm lại (Reset)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
