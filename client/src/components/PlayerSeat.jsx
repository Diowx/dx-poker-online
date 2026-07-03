import React from 'react';
import Card from './Card';
import { AvatarIcon } from './AvatarIcon';

function PlayerSeat({ 
  player, 
  seatIndex, 
  isActive, 
  isSelf, 
  dealerIndex, 
  timerTimeLeft, 
  turnDuration, 
  showdownOpponentCards,
  winnerIds = [] 
}) {
  if (!player) {
    return (
      <div className="player-seat empty">
        <div className="empty-seat-circle">
          <span>ว่าง</span>
        </div>
      </div>
    );
  }

  const isDealer = seatIndex === dealerIndex;
  const isWinner = winnerIds.includes(player.id);
  
  // Choose avatar color based on seat index
  const avatarColors = [
    '#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#00bcd4', '#4caf50'
  ];
  const avatarBg = avatarColors[seatIndex % avatarColors.length];

  // Action text parser
  const getActionBadge = () => {
    if (player.isFolded) return { text: 'FOLDED', className: 'fold' };
    if (player.isAllIn) return { text: 'ALL-IN', className: 'all-in' };
    if (player.currentBet > 0) {
      if (player.talked) {
        return { text: `BETS $${player.currentBet}`, className: 'bet' };
      }
      return { text: `$${player.currentBet}`, className: 'pending' };
    }
    if (player.talked) return { text: 'CHECK', className: 'check' };
    return null;
  };

  const badge = getActionBadge();

  // SVG timer countdown calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isActive 
    ? circumference - (timerTimeLeft / turnDuration) * circumference 
    : circumference;

  // Pocket cards to render
  const renderCards = () => {
    let cardsToUse = player.cards;
    
    // If we have showdown cards for opponents, use them
    if (showdownOpponentCards && showdownOpponentCards[player.id]) {
      cardsToUse = showdownOpponentCards[player.id];
    }

    if (!cardsToUse || cardsToUse.length === 0) return null;

    // ถ้ายอมแพ้/หมอบไปแล้ว จะแสดงก็ต่อเมื่อจบเกมและเผยไพ่ทุกคน (showdownOpponentCards มีค่าของคนๆ นี้)
    const showEvenIfFolded = showdownOpponentCards && showdownOpponentCards[player.id];
    if (player.isFolded && !showEvenIfFolded) return null;

    return (
      <div className="pocket-cards">
        {isWinner && <div className="winner-crown-cards">👑</div>}
        {cardsToUse.map((c, idx) => (
          <Card 
            key={idx}
            rank={c === true ? 0 : c.rank}
            suit={c === true ? '' : c.suit}
            hidden={c === true}
            dimmed={player.isFolded}
            highlighted={isWinner}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`player-seat occupied ${isActive ? 'active' : ''} ${player.isOnline ? '' : 'offline'} ${isWinner ? 'winner-glow' : ''} ${isSelf ? 'self-seat' : ''}`}>
      {/* Turn timer circle */}
      {isActive && (
        <svg className="timer-svg" width="100" height="100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#d4af37"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Seated user card */}
      <div className="player-avatar-wrapper">
        <div className="player-avatar" style={{ background: 'transparent' }}>
          <AvatarIcon id={player.avatar} size="100%" />
        </div>
        {isSelf && <span className="self-tag">ME</span>}
        
        {isDealer && <div className="dealer-button">D</div>}
        
        {badge && <div className={`action-badge ${badge.className}`}>{badge.text}</div>}
      </div>

      <div className={`player-details ${isSelf ? 'self-details' : ''}`}>
        <span className="player-name">{player.name}</span>
        <span className="player-chips">${player.chips.toLocaleString()}</span>
      </div>

      {renderCards()}

      {!player.isOnline && (
        <div className="offline-overlay">
          <span>Disconnected</span>
        </div>
      )}
    </div>
  );
}

export default PlayerSeat;
