import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { dbRef, onValue, push, set } from '../firebase';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const chatRef = dbRef('chat');
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedMsgs = Object.values(data);
        // Sort by timestamp if necessary, but Firebase push keeps order
        setMessages(parsedMsgs);
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setHasJoined(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsgRef = push(dbRef('chat'));
      set(newMsgRef, {
        id: Date.now(),
        user: username,
        text: newMessage,
        timestamp: Date.now()
      });
      setNewMessage('');
    }
  };

  if (!hasJoined) {
    return (
      <div className="h-full flex flex-col p-6 items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 z-0"></div>
        <div className="z-10 w-full">
          <h3 className="font-black text-2xl mb-2 text-center text-gradient">Tham gia Chat</h3>
          <p className="text-slate-400 text-sm text-center mb-6">Cùng bình luận sôi nổi nào!</p>
          <form onSubmit={handleJoin} className="flex flex-col space-y-4 w-full">
            <input 
              type="text" 
              placeholder="Nhập tên của bạn..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all shadow-inner backdrop-blur-sm text-center"
            />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-1">
              Vào phòng
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800/30 backdrop-blur-md flex items-center justify-between z-10 shadow-sm">
        <h3 className="font-bold text-lg text-blue-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Kênh Trực Tiếp
        </h3>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">{username}</span>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-slate-900/50">
        {messages.map((msg) => {
          const isMe = msg.user === username;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
              <span className={`text-[10px] mb-1 px-1 ${isMe ? 'text-blue-400' : 'text-slate-400'}`}>{msg.user}</span>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] break-words shadow-md ${isMe ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-sm' : 'bg-slate-700/80 border border-slate-600 text-slate-100 rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-slate-700 bg-slate-800/50 backdrop-blur-md z-10">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..." 
            className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-full focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all shadow-inner"
          />
          <button type="submit" disabled={!newMessage.trim()} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none flex items-center justify-center min-w-[48px]">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
