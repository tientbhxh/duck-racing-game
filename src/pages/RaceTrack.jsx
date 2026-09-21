import React, { useState, useEffect } from 'react';
import ChatBox from '../components/ChatBox';
import DuckSVG from '../components/DuckSVG';
import { dbRef, onValue } from '../firebase';

const RaceTrack = () => {
  const [ducks, setDucks] = useState([]);
  const [raceStatus, setRaceStatus] = useState('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [winner, setWinner] = useState(null);
  const [prizeContent, setPrizeContent] = useState('');

  useEffect(() => {
    const raceRef = dbRef('raceState');
    const unsubscribe = onValue(raceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.ducks) setDucks(data.ducks);
        if (data.status) setRaceStatus(data.status);
        if (data.winner) setWinner(data.winner);
        else setWinner(null);
        if (data.prize) setPrizeContent(data.prize);
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

  const TRACK_LENGTH_VW = 300; // Decreased from 400vw to 300vw to slow down visual speed by 25%
  const progressToVw = (p) => (p / 1000) * TRACK_LENGTH_VW;

  const maxProgress = ducks.length > 0 ? Math.max(...ducks.map(d => d.progress)) : 0;
  const maxVw = progressToVw(maxProgress);

  // Camera keeps the leader at exactly 30vw (center-left) to track perfectly. 
  // No cap! The camera will endlessly track the leader, even past the finish line!
  let cameraX = Math.max(0, maxVw - 30); 
  const bgScrollX = -cameraX; // Background scrolls 1:1 with camera

  return (
    // YouTube-like responsive layout: 
    // Portrait mobile: flex-col, Track takes top 45vh, Chat takes bottom remaining space
    // Desktop: flex-row, Track exactly 75%, Chat exactly 25%
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[85vh] gap-4">
      {/* Race Track Container */}
      <div className="flex-none md:flex-none h-[45vh] md:h-full w-full md:w-3/4 glass-card rounded-2xl overflow-hidden flex flex-col relative border-4 border-slate-700/50 shadow-2xl">
        <div className="px-4 py-3 bg-slate-900/80 backdrop-blur-md text-white font-bold text-sm md:text-lg flex justify-between z-20 border-b border-slate-700 shadow-lg">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            TRƯỜNG ĐUA VỊT {raceStatus === 'matching' ? <span className="text-yellow-400 ml-2">(Đang bốc thăm...)</span> : ''}
          </span>
          <span className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 border border-blue-500/30 text-sm">
            SĨ SỐ: {ducks.filter(d => d.playerName).length}/30
          </span>
        </div>
        
        {/* Matchmaking Overlay */}
        {raceStatus === 'matching' && (
          <div className="absolute inset-0 top-[50px] md:top-[60px] bg-slate-900/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-start pt-4 overflow-y-auto custom-scrollbar pb-4">
            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 mb-4 animate-pulse tracking-wide drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
              ĐANG BỐC THĂM TỪNG NGƯỜI CHƠI...
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 w-full px-4 md:px-8">
              {ducks.filter(d => d.playerName).map((duck, idx) => {
                if (idx > revealedCount) return null;
                const isJustRevealed = idx === revealedCount;
                
                return (
                  <div key={duck.id} className={`glass-panel rounded-lg p-2 flex flex-col items-center transition-all duration-500 ${isJustRevealed ? 'scale-110 shadow-[0_0_30px_rgba(250,204,21,0.6)] border-yellow-400/50' : 'scale-100'}`}>
                    <div className="scale-[0.6] origin-top drop-shadow-lg -mb-6">
                      <DuckSVG color={duck.color} hat={duck.hat} accessory={duck.accessory} number={duck.id} />
                    </div>
                    <div className="text-white font-bold mt-1 text-center text-[11px] sm:text-xs break-words w-full px-1 leading-tight">{duck.playerName}</div>
                    <div className="text-yellow-400 text-[9px] sm:text-[10px] font-medium text-center leading-tight mt-1 bg-black/30 px-2 py-0.5 rounded-full w-full whitespace-nowrap overflow-hidden text-ellipsis">{duck.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Track Elements (Hidden during matching) */}
        {raceStatus !== 'matching' && (
          <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 w-full overflow-hidden">
            <div className="w-full flex-1 relative flex flex-col overflow-hidden bg-white dark:bg-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              {/* Scenery: Sky & Grass (Parallax) */}
            <div className="h-1/5 sky-pattern scene-transition" style={{ backgroundPositionX: `${bgScrollX * 0.5}vw` }}></div>
            <div className="h-12 grass-pattern scene-transition relative" style={{ backgroundPositionX: `${bgScrollX}vw` }}>
              {/* Dynamically generated moving bushes spanning way past the finish line (600vw) */}
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={`bush-${i}`} className={`absolute bottom-0 rounded-t-full opacity-80 scene-transition ${i % 2 === 0 ? 'bg-green-700 w-16 h-8' : 'bg-green-800 w-12 h-6'}`} style={{ transform: `translateX(${i * 20 + 10 - cameraX}vw)` }}></div>
              ))}
              {/* Distance markers to make camera panning extremely obvious */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`marker-${i}`} className="absolute top-1 text-white/70 font-bold text-[10px] px-1 bg-black/30 rounded scene-transition" style={{ transform: `translateX(${i * 50 + 50 - cameraX}vw)` }}>{i * 50 + 50}m</div>
              ))}
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
              <div className="absolute top-0 w-32 h-10 bg-red-600 border-4 border-yellow-400 flex items-center justify-center text-white font-black text-lg z-10 rounded shadow-[0_0_15px_red] scene-transition" style={{ transform: `translateX(${TRACK_LENGTH_VW - cameraX - 6}vw)`, left: 0 }}>
                ĐÍCH ĐẾN
              </div>
              
              <div className="absolute inset-0">
              {ducks.map((duck) => {
                const duckScreenX = progressToVw(duck.progress) - cameraX;
                return (
                  <div 
                    key={duck.id}
                    className="absolute flex flex-col items-center duck-smooth scale-[0.45] sm:scale-[0.6] md:scale-100 origin-bottom" 
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
                        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap z-10 shadow-lg">
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
          </div>
        )}
        
        {/* Winner Celebration Overlay */}
        {raceStatus === 'finished' && winner && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 p-[2px] rounded-3xl shadow-[0_0_80px_rgba(250,204,21,0.5)] w-full max-w-md">
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden w-full">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-yellow-500/20 to-transparent"></div>
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 mb-2 uppercase drop-shadow-md z-10">NHÀ VÔ ĐỊCH!</h2>
                
                <div className="scale-125 my-6 origin-center z-10 drop-shadow-2xl">
                  <DuckSVG color={winner.color} hat={winner.hat} accessory={winner.accessory} number={winner.id} />
                </div>
                
                <div className="text-2xl md:text-3xl font-black text-white mb-2 z-10 tracking-tight">{winner.playerName}</div>
                <div className="text-yellow-400 text-lg font-medium mb-4 z-10 bg-yellow-500/10 px-4 py-1 rounded-full border border-yellow-500/30">{winner.name}</div>
                
                {prizeContent && (
                  <div className="mt-2 p-4 bg-gradient-to-r from-yellow-900/50 via-orange-900/50 to-yellow-900/50 border border-yellow-500/40 rounded-2xl w-full z-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-yellow-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="text-yellow-400 font-bold uppercase text-xs mb-1 tracking-widest">Phần Thưởng</div>
                    <div className="text-white font-black text-xl md:text-2xl drop-shadow-md">{prizeContent}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Box Container */}
      <div className="flex-1 md:flex-none w-full md:w-1/4 min-h-0 glass-card rounded-2xl flex flex-col">
        <ChatBox />
      </div>
    </div>
  );
};

export default RaceTrack;
