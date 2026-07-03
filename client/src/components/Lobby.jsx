import React, { useState } from 'react';
import { socket } from '../socket';
import { playChipBet } from '../utils/audio';

function Lobby({ onRoomJoined }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [smallBlind, setSmallBlind] = useState(10);
  const [defaultBuyIn, setDefaultBuyIn] = useState(1000);
  const [useTimer, setUseTimer] = useState(true);
  const [turnDuration, setTurnDuration] = useState(30);
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [error, setError] = useState('');

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('กรุณาใส่ชื่อของคุณ');
      return;
    }
    setError('');
    playChipBet();

    socket.connect();
    socket.emit('create-room', {
      playerName: playerName.trim(),
      smallBlind: parseInt(smallBlind),
      defaultBuyIn: parseInt(defaultBuyIn),
      useTimer,
      turnDuration: parseInt(turnDuration)
    }, (response) => {
      if (response.success) {
        onRoomJoined(response.roomId, playerName.trim());
      } else {
        setError('เกิดข้อผิดพลาดในการสร้างห้อง');
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('กรุณาใส่ชื่อของคุณ');
      return;
    }
    if (!roomCode.trim()) {
      setError('กรุณาใส่รหัสห้อง 6 หลัก');
      return;
    }
    setError('');
    playChipBet();

    socket.connect();
    socket.emit('join-room', {
      roomId: roomCode.trim().toUpperCase(),
      name: playerName.trim()
    }, (response) => {
      if (response.success) {
        onRoomJoined(response.roomId, playerName.trim());
      } else {
        setError(response.message || 'ไม่พบห้องที่ระบุ');
      }
    });
  };

  return (
    <div className="lobby-container">
      <div className="lobby-brand">
        <h1 className="brand-logo">ROYAL POKER</h1>
        <p className="brand-tagline">Play Texas Hold'em with Friends Online</p>
      </div>

      <div className="lobby-card">
        <div className="lobby-tabs">
          <button 
            className={`lobby-tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => { setActiveTab('join'); setError(''); }}
          >
            เข้าร่วมโต๊ะ (Join Table)
          </button>
          <button 
            className={`lobby-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveTab('create'); setError(''); }}
          >
            สร้างโต๊ะใหม่ (Create Table)
          </button>
        </div>

        {error && <div className="lobby-error">{error}</div>}

        <div className="lobby-form-container">
          <div className="input-group">
            <label htmlFor="player-name">ชื่อผู้เล่น (Nickname)</label>
            <input 
              id="player-name"
              type="text" 
              placeholder="ใส่ชื่อของคุณ..." 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
              required
            />
          </div>

          {activeTab === 'join' ? (
            <form onSubmit={handleJoinRoom} className="lobby-form">
              <div className="input-group">
                <label htmlFor="room-code">รหัสโต๊ะเล่นเกม (Room Code)</label>
                <input 
                  id="room-code"
                  type="text" 
                  placeholder="เช่น A7B8CD" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="code-input"
                  required
                />
              </div>
              <button type="submit" className="lobby-submit-btn">
                เข้าสู่เกม (Join Table)
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateRoom} className="lobby-form">
              <div className="form-grid">
                <div className="input-group">
                  <label htmlFor="small-blind">Small Blind ($)</label>
                  <select 
                    id="small-blind"
                    value={smallBlind}
                    onChange={(e) => setSmallBlind(parseInt(e.target.value))}
                  >
                    <option value={5}>$5</option>
                    <option value={10}>$10</option>
                    <option value={25}>$25</option>
                    <option value={50}>$50</option>
                    <option value={100}>$100</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="buy-in">เงินซื้อชิปเริ่มต้น ($)</label>
                  <input 
                    id="buy-in"
                    type="number" 
                    value={defaultBuyIn}
                    onChange={(e) => setDefaultBuyIn(Math.max(100, parseInt(e.target.value) || 0))}
                    min={100}
                    step={100}
                    required
                  />
                </div>
              </div>

              <div className="form-checkbox-group">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={useTimer} 
                    onChange={(e) => setUseTimer(e.target.checked)} 
                  />
                  <span className="checkmark"></span>
                  จำกัดเวลาในการตัดสินใจ (Turn Timer)
                </label>
              </div>

              {useTimer && (
                <div className="input-group">
                  <label htmlFor="turn-duration">เวลาต่อตา (วินาที)</label>
                  <select 
                    id="turn-duration"
                    value={turnDuration}
                    onChange={(e) => setTurnDuration(parseInt(e.target.value))}
                  >
                    <option value={15}>15 วินาที</option>
                    <option value={30}>30 วินาที</option>
                    <option value={45}>45 วินาที</option>
                    <option value={60}>60 วินาที</option>
                  </select>
                </div>
              )}

              <button type="submit" className="lobby-submit-btn create-btn">
                สร้างโต๊ะและเริ่มเกม (Start Table)
              </button>
            </form>
          )}

          <button 
            type="button" 
            className="lobby-info-link" 
            onClick={onOpenRankings}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginTop: '20px',
              width: '100%',
              textAlign: 'center',
              textDecoration: 'underline',
              fontFamily: 'var(--font-brand)',
              fontWeight: '600'
            }}
          >
            ℹ️ ดูคู่มือลำดับหน้าไพ่ (Hand Rankings Guide)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
