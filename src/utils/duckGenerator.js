export const DUCK_TYPES = [
  { id: 1, name: 'Vịt Sịp Hồng', color: '#FF69B4', hat: 'none', accessory: 'pink_undies' },
  { id: 2, name: 'Vịt Bóng Đêm', color: '#333333', hat: 'ninja', accessory: 'sword' },
  { id: 3, name: 'Vịt Hoàng Gia', color: '#FFD700', hat: 'crown', accessory: 'cape' },
  { id: 4, name: 'Vịt Tuần Lộc', color: '#8B4513', hat: 'antlers', accessory: 'red_nose' },
  { id: 5, name: 'Vịt Giao Thông', color: '#FF8C00', hat: 'police', accessory: 'sunglasses' },
  { id: 6, name: 'Vịt Băng Giá', color: '#E0FFFF', hat: 'snowman', accessory: 'scarf' },
  { id: 7, name: 'Vịt Trẩu Tre', color: '#FFD700', hat: 'mohawk_green', accessory: 'none' },
  { id: 8, name: 'Vịt Trọc Phú', color: '#FFD700', hat: 'tophat', accessory: 'tie' },
  { id: 9, name: 'Vịt Batman', color: '#111111', hat: 'batman', accessory: 'black_cape' },
  { id: 10, name: 'Vịt Nông Dân', color: '#FFD700', hat: 'straw_hat', accessory: 'none' },
  { id: 11, name: 'Vịt Bác Học', color: '#FFFFFF', hat: 'glasses', accessory: 'book' },
  { id: 12, name: 'Vịt Cướp Biển', color: '#FFD700', hat: 'pirate', accessory: 'eyepatch' },
  { id: 13, name: 'Vịt Hồng Kông', color: '#FF1493', hat: 'none', accessory: 'necklace' },
  { id: 14, name: 'Vịt Đỏ Tươi', color: '#FF0000', hat: 'none', accessory: 'none' },
  { id: 15, name: 'Vịt Lục Bảo', color: '#00FA9A', hat: 'halo', accessory: 'none' },
  { id: 16, name: 'Vịt Lam Giang', color: '#1E90FF', hat: 'cap_backwards', accessory: 'none' },
  { id: 17, name: 'Vịt Nhẫn Giả', color: '#FFFFFF', hat: 'ninja_white', accessory: 'shuriken' },
  { id: 18, name: 'Vịt Đầu Bếp', color: '#FFD700', hat: 'chef', accessory: 'apron' },
  { id: 19, name: 'Vịt Thợ Lặn', color: '#FFD700', hat: 'goggles', accessory: 'snorkel' },
  { id: 20, name: 'Vịt Phi Hành Gia', color: '#F8F8FF', hat: 'astronaut', accessory: 'none' },
  { id: 21, name: 'Vịt Thầy Pháp', color: '#8A2BE2', hat: 'wizard', accessory: 'wand' },
  { id: 22, name: 'Vịt Lính Cứu Hỏa', color: '#FFD700', hat: 'fireman', accessory: 'none' },
  { id: 23, name: 'Vịt Thợ Mỏ', color: '#FFD700', hat: 'miner', accessory: 'none' },
  { id: 24, name: 'Vịt Kỵ Sĩ', color: '#C0C0C0', hat: 'knight', accessory: 'shield' },
  { id: 25, name: 'Vịt Y Tá', color: '#FFFFFF', hat: 'nurse', accessory: 'none' },
  { id: 26, name: 'Vịt Thể Thao', color: '#FFD700', hat: 'headband', accessory: 'medal' },
  { id: 27, name: 'Vịt Rockstar', color: '#FFD700', hat: 'punk_hair', accessory: 'guitar' },
  { id: 28, name: 'Vịt Cao Bồi', color: '#CD853F', hat: 'cowboy', accessory: 'badge' },
  { id: 29, name: 'Vịt Thiên Thần', color: '#FFFFFF', hat: 'halo', accessory: 'wings' },
  { id: 30, name: 'Vịt Ác Quỷ', color: '#FF0000', hat: 'horns', accessory: 'pitchfork' },
];

// Trạng thái mặc định ban đầu của cuộc đua
export const getInitialRaceState = () => {
  return DUCK_TYPES.map(duck => ({
    ...duck,
    playerName: '', // Admin sẽ điền tên người chơi vào đây
    progress: 0, // Từ 0 đến 100
    topOffset: Math.random() * 80 + 10, // Vị trí ngẫu nhiên theo chiều dọc (10% đến 90%)
    speed: 0,
  }));
};
