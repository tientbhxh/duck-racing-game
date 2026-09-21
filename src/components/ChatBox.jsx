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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg h-full flex flex-col p-4">
        <h3 className="font-bold text-lg mb-4 text-center">Tham gia Chat</h3>
        <form onSubmit={handleJoin} className="flex flex-col space-y-4 flex-1 justify-center">
          <input 
            type="text" 
            placeholder="Nhập tên của bạn..." 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:bg-slate-700 dark:border-slate-600"
          />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
            Vào phòng
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg h-full flex flex-col">
      <div className="p-4 border-b dark:border-slate-700">
        <h3 className="font-bold text-lg">Khung Chat</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-bold text-blue-600">{msg.user}: </span>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..." 
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:bg-slate-700 dark:border-slate-600"
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
