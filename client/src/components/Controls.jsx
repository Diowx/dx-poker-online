import React, { useState, useEffect } from 'react';
import { playChipBet } from '../utils/audio';

function Controls({ player, room, onAction }) {
  if (!player || player.seatIndex !== room.currentPlayerIndex || room.gameState === 'SHOWDOWN' || room.gameState === 'LOBBY') {
    return null; // Not our turn
  }

  const checkCost = room.currentBet - player.currentBet;
  const canCheck = checkCost === 0;
  
  // Calculate raise bounds
  const minRaise = room.currentBet + Math.max(room.bigBlind, room.currentBet);
  const maxRaise = player.chips + player.currentBet;
  
  // If no bets are made yet, it's a "Bet" rather than a "Raise"
  const isBetting = room.currentBet === 0;

  const [raiseVal, setRaiseVal] = useState(minRaise);

  // Sync raiseVal with changes in room state (e.g., when someone else bets/raises)
  useEffect(() => {
    setRaiseVal(Math.min(maxRaise, Math.max(minRaise, raiseVal)));
  }, [room.currentBet, player.chips, player.currentBet]);

  const handleFold = () => {
    onAction('fold');
  };

  const handleCheckOrCall = () => {
    if (canCheck) {
      onAction('check');
    } else {
      onAction('call');
    }
  };

  const handleRaiseSubmit = (e) => {
    e.preventDefault();
    onAction('raise', raiseVal);
  };

  const handleSliderChange = (e) => {
    setRaiseVal(parseInt(e.target.value));
  };

  // Preset buttons
  const handlePreset = (multiplier) => {
    playChipBet();
    let target = 0;
    if (multiplier === 'pot') {
      // Pot size raise = current pot + all active bets + call amount
      // Let's approximate pot-size raise simply:
      target = room.pot + checkCost;
    } else if (multiplier === 'all-in') {
      target = maxRaise;
    } else {
      target = room.currentBet * multiplier;
    }
    
    setRaiseVal(Math.min(maxRaise, Math.max(minRaise, target)));
  };

  const canRaise = player.chips > checkCost && maxRaise >= minRaise;

  return (
    <div className="game-controls">
      <div className="action-buttons-row">
        <button className="action-btn fold-btn" onClick={handleFold}>
          หมอบ (Fold)
        </button>

        <button className="action-btn check-call-btn" onClick={handleCheckOrCall}>
          {canCheck ? 'ผ่าน (Check)' : `สู้ (Call $${checkCost})`}
        </button>

        {canRaise && (
          <button 
            className="action-btn raise-submit-btn" 
            onClick={handleRaiseSubmit}
          >
            {isBetting ? `เดิมพัน (Bet $${raiseVal})` : `เกทับ (Raise to $${raiseVal})`}
          </button>
        )}
      </div>

      {canRaise && (
        <div className="raise-slider-box">
          <div className="presets-row">
            {!isBetting && <button onClick={() => handlePreset(2)}>2x</button>}
            {!isBetting && <button onClick={() => handlePreset(3)}>3x</button>}
            <button onClick={() => handlePreset('pot')}>Pot</button>
            <button onClick={() => handlePreset('all-in')} className="all-in-preset">All-in</button>
          </div>

          <div className="slider-row">
            <span className="slider-label">${minRaise}</span>
            <input 
              type="range" 
              min={minRaise} 
              max={maxRaise} 
              value={raiseVal} 
              onChange={handleSliderChange} 
              className="raise-slider"
            />
            <span className="slider-label">${maxRaise}</span>
          </div>

          <div className="raise-value-input">
            <span className="dollar-prefix">$</span>
            <input 
              type="number"
              min={minRaise}
              max={maxRaise}
              value={raiseVal}
              onChange={(e) => setRaiseVal(Math.min(maxRaise, Math.max(minRaise, parseInt(e.target.value) || 0)))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Controls;
