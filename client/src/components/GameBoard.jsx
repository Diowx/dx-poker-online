import React from 'react';
import PlayerSeat from './PlayerSeat';
import Controls from './Controls';
import Card from './Card';
import { playChipBet } from '../utils/audio';

function GameBoard({
  room,
  socketId,
  onAction,
  showdownOpponentCards,
  showdownResults = [],
  onStandUp,
  onSetReady,
  onRebuy,
  onLeaveRoom,
  onOpenRankings
}) {
  const me = room.players[socketId];
  const isHost = socketId === room.hostId;
  const isSpectator = me ? me.seatIndex === -1 : true;

  const winnerIds = showdownResults.map(r => r.id);

  // Copy room code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomId);
    playChipBet();
    alert('คัดลอกรหัสเข้าห้องแล้ว: ' + room.roomId);
  };

  // Seated players and seats
  const renderSeats = () => {
    // 6 fixed positions mapping to seatIndex 0 to 5
    const positions = [
      { top: '80%', left: '50%', transform: 'translate(-50%, -30%)' },      // Seat 0 (Bottom-Center)
      { top: '60%', left: '5%', transform: 'translate(0, -50%)' },        // Seat 1 (Bottom-Left)
      { top: '20%', left: '5%', transform: 'translate(0, -50%)' },        // Seat 2 (Top-Left)
      { top: '2%', left: '50%', transform: 'translate(-50%, 0)' },         // Seat 3 (Top-Center)
      { top: '20%', right: '5%', transform: 'translate(0, -50%)' },       // Seat 4 (Top-Right)
      { top: '60%', right: '5%', transform: 'translate(0, -50%)' }        // Seat 5 (Bottom-Right)
    ];

    return room.seats.map((playerId, seatIndex) => {
      const player = playerId ? room.players[playerId] : null;
      const pos = positions[seatIndex];
      const isActive = room.currentPlayerIndex === seatIndex;
      const isSelf = playerId === socketId;

      return (
        <div key={seatIndex} className="seat-position-wrapper" style={{ position: 'absolute', ...pos }}>
          {player ? (
            <PlayerSeat
              player={player}
              seatIndex={seatIndex}
              isActive={isActive}
              isSelf={isSelf}
              dealerIndex={room.dealerIndex}
              timerTimeLeft={room.timerTimeLeft}
              turnDuration={room.turnDuration}
              showdownOpponentCards={showdownOpponentCards}
              winnerIds={winnerIds}
            />
          ) : (
            // Seated spectator can click an empty seat to sit down
            <div 
              className={`player-seat empty ${isSpectator ? 'clickable' : ''}`}
              onClick={() => isSpectator && handleSitDown(seatIndex)}
            >
              <div className="empty-seat-circle">
                <span>ว่าง</span>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  const handleSitDown = (seatIndex) => {
    const buyIn = prompt('ป้อนจำนวนชิปเริ่มต้นที่ต้องการซื้อ ($):', room.defaultBuyIn) || room.defaultBuyIn;
    onRebuy(seatIndex, parseInt(buyIn));
  };

  // Community cards layout
  const renderCommunityCards = () => {
    const cards = room.communityCards || [];
    const slots = Array(5).fill(null);

    return (
      <div className="community-cards-container">
        {slots.map((_, idx) => {
          const card = cards[idx];
          return (
            <div key={idx} className="community-card-slot">
              {card ? (
                <Card 
                  rank={card.rank} 
                  suit={card.suit} 
                  hidden={false} 
                  highlighted={showdownResults.some(r => r.handCards?.some(hc => hc.rank === card.rank && hc.suit === card.suit))}
                />
              ) : (
                <div className="card-slot-placeholder"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper for game stage header text
  const getGameStateHeader = () => {
    switch (room.gameState) {
      case 'LOBBY': return 'ห้องพักผู้เล่น (LOBBY)';
      case 'PRE_FLOP': return 'รอบแจกไพ่ 2 ใบ (PRE-FLOP)';
      case 'FLOP': return 'รอบหงายไพ่กองกลาง 3 ใบ (FLOP)';
      case 'TURN': return 'รอบหงายไพ่กองกลางใบที่ 4 (TURN)';
      case 'RIVER': return 'รอบหงายไพ่กองกลางใบสุดท้าย (RIVER)';
      case 'SHOWDOWN': return 'รอบเปิดไพ่ตัดสิน (SHOWDOWN)';
      default: return '';
    }
  };

  return (
    <div className="game-board-container">
      {/* Top action bar */}
      <div className="top-action-bar">
        <div className="room-info">
          <span className="room-label">รหัสโต๊ะ:</span>
          <span className="room-value code" onClick={handleCopyCode}>{room.roomId} 📋</span>
          <span className="room-divider">|</span>
          <span className="room-label">Small/Big Blind:</span>
          <span className="room-value">${room.smallBlind}/${room.bigBlind}</span>
        </div>

        <div className="game-header-status">
          {getGameStateHeader()}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            className="lobby-action-btn" 
            onClick={onOpenRankings}
            style={{ padding: '5px 12px', fontSize: '0.8rem', borderColor: 'var(--gold-dark)', color: 'var(--gold)' }}
          >
            ℹ️ ลำดับไพ่
          </button>
          <button className="leave-room-btn" onClick={onLeaveRoom}>
            ออกจากห้อง
          </button>
        </div>
      </div>

      {/* Main Oval Table */}
      <div className="poker-table-canvas">
        <div className="poker-table-felt">
          {/* Seating layout */}
          {renderSeats()}

          {/* Central felt content */}
          <div className="table-center-area">
            {/* Pot display */}
            {room.pot > 0 && (
              <div className="table-pot-wrapper">
                <span className="pot-chip-icon">🪙</span>
                <span className="pot-amount">POT: ${room.pot.toLocaleString()}</span>
              </div>
            )}

            {/* Community cards */}
            {renderCommunityCards()}

            {/* Showdown info overlays */}
            {room.gameState === 'SHOWDOWN' && showdownResults.length > 0 && (
              <div className="showdown-winner-overlay animate-fadeIn">
                <div className="showdown-title">👑 ผู้ชนะในตานี้ 👑</div>
                {showdownResults.map((r, i) => (
                  <div key={i} className="winner-row">
                    <span className="winner-name">{r.name}</span> ได้รับ 
                    <span className="winner-amount"> ${r.winAmount.toLocaleString()}</span> 
                    {r.handName && <span className="winner-hand-desc">ด้วย {r.handName}</span>}
                  </div>
                ))}
              </div>
            )}

            {room.gameState === 'LOBBY' && (
              <div className="lobby-waiting-overlay">
                <h3>รอผู้เล่นให้พร้อมเพื่อเริ่มเกม</h3>
                <p>จำนวนที่นั่งเล่นปัจจุบัน: {room.seats.filter(s => s !== null).length}/6 คน</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom control panel */}
      <div className="bottom-control-panel">
        {/* If local player is seated, show status bar / lobby actions */}
        {me && me.seatIndex !== -1 && (
          <div className="lobby-actions-row">
            <span className="my-chips-label">ชิปของฉัน: <strong>${me.chips.toLocaleString()}</strong></span>
            
            {room.gameState === 'LOBBY' ? (
              <label className="checkbox-container ready-checkbox">
                <input 
                  type="checkbox" 
                  checked={me.isReady} 
                  onChange={(e) => onSetReady(e.target.checked)} 
                />
                <span className="checkmark"></span>
                กดเพื่อตั้งค่าสถานะ "พร้อมเล่น"
              </label>
            ) : (
              me.chips === 0 && (
                <button className="lobby-action-btn rebuy-btn" onClick={() => onRebuy(me.seatIndex, room.defaultBuyIn)}>
                  เติมชิป (Rebuy)
                </button>
              )
            )}
            
            <button className="lobby-action-btn stand-btn" onClick={onStandUp}>
              ลุกขึ้นยืน (Stand)
            </button>
          </div>
        )}

        {/* Action Controls for turns */}
        <Controls 
          player={me}
          room={room}
          onAction={onAction}
        />
      </div>
    </div>
  );
}

export default GameBoard;
