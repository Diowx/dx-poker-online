import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';

function GameChat({ logs = [] }) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    socket.emit('chat-message', chatInput.trim());
    setChatInput('');
  };

  // Auto-scroll chat to the bottom when new logs arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="game-chat-container">
      <div className="chat-header">
        <h3>ข้อความแชทและประวัติเกม</h3>
      </div>
      
      <div className="chat-logs-wrapper">
        {logs.map((log, index) => {
          const isSystem = log.type === 'system';
          return (
            <div 
              key={index} 
              className={`chat-log-item ${isSystem ? 'system-log' : 'player-log'}`}
            >
              <span className="log-time">[{log.time}]</span>
              <span className="log-text">{log.text}</span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input 
          type="text" 
          placeholder="พิมพ์ข้อความคุยกับเพื่อน..." 
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          maxLength={100}
        />
        <button type="submit">ส่ง</button>
      </form>
    </div>
  );
}

export default GameChat;
