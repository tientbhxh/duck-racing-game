import React, { useState, useEffect } from 'react';
import ChatBox from '../components/ChatBox';
import DuckSVG from '../components/DuckSVG';
import { dbRef, onValue } from '../firebase';

const RaceTrack = () => {
  const [ducks, setDucks] = useState([]);
  const [raceStatus, setRaceStatus] = useState('idle');
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    const raceRef = dbRef('raceState');
    const unsubscribe = onValue(raceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.ducks) setDucks(data.ducks);
        if (data.status) setRaceStatus(data.status);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (raceStatus === 'matching') {
      setRevealedCount(0);
      const interval = setInterval(() => {
        setRevealedCount(prev => prev + 1);
      }, 500); // Reveal one duck every 500ms
      return () => clearInterval(interval);
    }
  }, [raceStatus]);

  const TRACK_LENGTH_VW = 150; // Total physical length of the track in vw
  const progressToVw = (p) => (p / 1000) * TRACK_LENGTH_VW;

  const maxProgress = ducks.length > 0 ? Math.max(...ducks.map(d => d.progress)) : 0;
  const maxVw = progressToVw(maxProgress);

  // Camera keeps the leader at exactly 30vw (center-left) to track perfectly. 
  let cameraX = Math.max(0, maxVw - 30); 
  // Cap camera so finish line (TRACK_LENGTH_VW) reaches 100vw edge max (assuming container is ~75vw, subtract 60)
  cameraX = Math.min(cameraX, TRACK_LENGTH_VW - 60); 
  const bgScrollX = -cameraX; // Background scrolls 1:1 with camera

  return (
    // YouTube-like responsive layout: 
    // Portrait mobile: flex-col, Track takes top 45vh, Chat takes bottom remaining space
    // Desktop: flex-row, Track exactly 75%, Chat exactly 25%
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[85vh] gap-4">
      {/* Race Track Container */}
      <div className="flex-none md:flex-none h-[45vh] md:h-full w-full md:w-3/4 bg-slate-900 rounded-xl shadow-lg overflow-hidden flex flex-col relative">
        <div className="p-2 md:p-4 bg-blue-600 text-white font-bold text-sm md:text-lg flex justify-between z-20 shadow-md">
          <span>Trường Đua Vịt {raceStatus === 'matching' ? '(Bốc thăm...)' : ''}</span>
          <span>Sĩ số: {ducks.filter(d => d.playerName).length}/30</span>
        </div>
        
        {/* Matchmaking Overlay */}
        {raceStatus === 'matching' && (
          <div className="absolute inset-0 top-[60px] bg-slate-900 z-50 flex flex-col items-center justify-start pt-8 overflow-y-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-6 animate-pulse">ĐANG BỐC THĂM TỪNG NGƯỜI CHƠI...</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 w-full px-4">
              {ducks.filter(d => d.playerName).map((duck, idx) => {
                if (idx > revealedCount) return null;
                const isJustRevealed = idx === revealedCount;
                
                return (
                  <div key={duck.id} className={`bg-white/10 rounded-lg p-2 flex flex-col items-center border border-white/20 transition-all ${isJustRevealed ? 'scale-110 shadow-[0_0_15px_yellow]' : 'scale-100'}`}>
                    <div className="scale-75 origin-top">
                      <DuckSVG color={duck.color} hat={duck.hat} accessory={duck.accessory} number={duck.id} />
                    </div>
                    <div className="text-white font-bold mt-1 text-center text-xs break-words w-full px-1">{duck.playerName}</div>
                    <div className="text-yellow-400 text-[10px] text-center leading-tight mt-1">{duck.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Track Elements (Hidden during matching) */}
        {raceStatus !== 'matching' && (
          <div className="flex-1 relative flex flex-col overflow-hidden bg-white dark:bg-slate-800">
            {/* Scenery: Sky & Grass (Parallax) */}
            <div className="h-1/5 sky-pattern scene-transition" style={{ backgroundPositionX: `${bgScrollX * 0.5}vw` }}></div>
            <div className="h-12 grass-pattern scene-transition relative" style={{ backgroundPositionX: `${bgScrollX}vw` }}>
              {/* Moving bushes */}
              <div className="absolute top-2 w-16 h-8 bg-green-700 rounded-t-full opacity-80 scene-transition" style={{ transform: `translateX(${10 - cameraX}vw)` }}></div>
              <div className="absolute top-4 w-12 h-6 bg-green-800 rounded-t-full opacity-80 scene-transition" style={{ transform: `translateX(${40 - cameraX}vw)` }}></div>
              <div className="absolute top-1 w-24 h-10 bg-green-700 rounded-t-full opacity-80 scene-transition" style={{ transform: `translateX(${80 - cameraX}vw)` }}></div>
            </div>
            
            {/* Scenery: River Race Track */}
            <div className="flex-1 river-pattern river-waves scene-transition relative" style={{ backgroundPositionX: `${bgScrollX * 1.5}vw` }}>
              {/* Start Line */}
              <div className="absolute top-0 bottom-0 w-2 bg-white/40 border-l-4 border-dashed border-white scene-transition" style={{ transform: `translateX(${10 - cameraX}vw)`, left: 0 }}></div>
              
              {/* Finish Line */}
              <div className="absolute top-0 bottom-0 w-8 flex flex-col z-0 border-l-2 border-black scene-transition" style={{ transform: `translateX(${TRACK_LENGTH_VW - cameraX}vw)`, left: 0 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 w-full flex">
                    <div className={`flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}></div>
                    <div className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`}></div>
                  </div>
                ))}
              </div>
              
              <div className="absolute inset-0">
              {ducks.map((duck) => {
                const duckScreenX = progressToVw(duck.progress) - cameraX;
                return (
                  <div 
                    key={duck.id}
                    className="absolute flex flex-col items-center duck-smooth" 
                    style={{ 
                      transform: `translateX(${duckScreenX}vw)`,
                      left: 0,
                      top: `${duck.topOffset}%`,
                      zIndex: Math.round(duck.topOffset)
                    }}
                  >
                    <div className="relative group animate-paddle" style={{ animationDelay: `${duck.id * -0.15}s` }}>
                      {/* Persistent Name Tag */}
                      {duck.playerName && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap z-50 shadow">
                          {duck.playerName}
                        </div>
                      )}
                      <DuckSVG color={duck.color} hat={duck.hat} accessory={duck.accessory} number={duck.id} />
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Box Container */}
      <div className="flex-1 md:flex-none w-full md:w-1/4 min-h-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex flex-col">
        <ChatBox />
      </div>
    </div>
  );
};

export default RaceTrack;
