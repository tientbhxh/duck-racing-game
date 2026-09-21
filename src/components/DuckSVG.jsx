import React from 'react';

const DuckSVG = ({ color, hat, accessory, number }) => {
  const strokeColor = '#000000';

  const hatEmojis = {
    crown: '👑', police: '👮‍♂️', snowman: '⛄', tophat: '🎩', ninja: '🥷', ninja_white: '🥷',
    mohawk_green: '🦚', batman: '🦇', straw_hat: '👒', glasses: '👓', pirate: '🏴‍☠️',
    cap_backwards: '🧢', chef: '👨‍🍳', goggles: '🥽', astronaut: '👨‍🚀', wizard: '🧙',
    fireman: '👨‍🚒', miner: '👷', knight: '🛡️', nurse: '👩‍⚕️', headband: '🥋',
    punk_hair: '🤘', cowboy: '🤠', halo: '👼', horns: '😈', antlers: '🦌', none: ''
  };

  const accessoryEmojis = {
    pink_undies: '🩲', sword: '🗡️', cape: '🦸', red_nose: '🔴', sunglasses: '🕶️',
    scarf: '🧣', tie: '👔', black_cape: '🦇', book: '📖', eyepatch: '👁️‍🗨️',
    necklace: '📿', shuriken: '🥏', apron: '🎽', snorkel: '🤿', wand: '🪄',
    shield: '🛡️', medal: '🏅', guitar: '🎸', badge: '📛', wings: '🪽', pitchfork: '🔱', none: ''
  };

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-md">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          {/* Duck Body */}
          <path d="M 30,70 C 15,70 10,60 15,45 C 18,35 30,30 40,35 C 50,40 70,40 80,60 C 85,70 70,85 50,85 C 35,85 30,80 30,70 Z" fill={color} />
          
          {/* Duck Head */}
          <circle cx="65" cy="35" r="18" fill={color} />
          
          {/* Duck Beak */}
          <path d="M 78,35 C 90,32 95,38 95,40 C 95,45 85,48 75,45 Z" fill="#FF8C00" />
          
          {/* Duck Eye */}
          <circle cx="70" cy="30" r="4" fill="#FFFFFF" />
          <circle cx="72" cy="30" r="2" fill="#000000" />

          {/* Number Badge */}
          <rect x="20" y="55" width="22" height="18" rx="4" fill="#FFFFFF" />
          <text x="31" y="68" fontSize="12" fontWeight="bold" fill="#000000" textAnchor="middle" strokeWidth="0">{number}</text>
        </g>
      </svg>
      
      {/* Hat Emoji Overlay */}
      {hatEmojis[hat] && (
        <div className="absolute" style={{ top: '-10%', right: '15%', fontSize: '1.5rem', transform: 'rotate(10deg)' }}>
          {hatEmojis[hat]}
        </div>
      )}

      {/* Accessory Emoji Overlay */}
      {accessoryEmojis[accessory] && (
        <div className="absolute" style={{ bottom: '10%', right: '-5%', fontSize: '1.5rem' }}>
          {accessoryEmojis[accessory]}
        </div>
      )}
    </div>
  );
};

export default DuckSVG;
