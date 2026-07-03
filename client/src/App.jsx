import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import GameChat from './components/GameChat';
import HandRankingsModal from './components/HandRankingsModal';
import { playCardDeal, playChipBet, playTimerAlert, playWinnerReveal } from './utils/audio';

function App() {
  const [view, setView] = useState('lobby'); // 'lobby' or 'game'
  const [roomId, setRoomId] = useState('');
  const [socketId, setSocketId] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [isRankingsOpen, setIsRankingsOpen] = useState(false);
  
  // Showdown state persistence
  const [showdownOpponentCards, setShowdownOpponentCards] = useState(null);
  const [showdownResults, setShowdownResults] = useState([]);

  useEffect(() => {
    // Listen for socket events
    socket.on('connect', () => {
      setSocketId(socket.id);
      console.log('Socket connected:', socket.id);
    });

    socket.on('room-state', (newRoomState) => {
      setRoomState((prevRoomState) => {
        // Play sounds based on state changes
        if (newRoomState) {
          // Play card dealing sound when gameState progresses
          if (!prevRoomState || prevRoomState.gameState !== newRoomState.gameState) {
            if (['PRE_FLOP', 'FLOP', 'TURN', 'RIVER'].includes(newRoomState.gameState)) {
              playCardDeal();
            }
            if (newRoomState.gameState === 'LOBBY') {
              // Reset showdown info when entering lobby
              setShowdownOpponentCards(null);
              setShowdownResults([]);
            }
          }

          // Play chip sound when pot increases
          if (prevRoomState && newRoomState.pot > prevRoomState.pot) {
            playChipBet();
          }

          // Play warning beep if it's our turn and time is running out (handled in timer-update)
        }
        return newRoomState;
      });
    });

    socket.on('timer-update', ({ timeLeft, currentPlayerIndex }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        
        // Find if it's my turn
        const mySeatIndex = prev.players[socket.id]?.seatIndex;
        if (mySeatIndex !== -1 && mySeatIndex === currentPlayerIndex) {
          // Beep on last 5 seconds
          if (timeLeft > 0 && timeLeft <= 5) {
            playTimerAlert();
          }
        }

        return {
          ...prev,
          timerTimeLeft: timeLeft
        };
      });
    });

    socket.on('showdown-results', ({ results, opponentCards }) => {
      setShowdownResults(results);
      setShowdownOpponentCards(opponentCards);
      playWinnerReveal();
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setView('lobby');
      setRoomState(null);
      setRoomId('');
      setShowdownResults([]);
      setShowdownOpponentCards(null);
    });

    return () => {
      socket.off('connect');
      socket.off('room-state');
      socket.off('timer-update');
      socket.off('showdown-results');
      socket.off('disconnect');
    };
  }, []);

  const handleRoomJoined = (joinedRoomId, name) => {
    setRoomId(joinedRoomId);
    setView('game');
  };

  const handleAction = (action, amount) => {
    playChipBet();
    socket.emit('player-action', { action, amount });
  };

  const handleStandUp = () => {
    playChipBet();
    socket.emit('stand-player', (res) => {
      if (!res.success) {
        alert('ไม่สามารถลุกขึ้นได้ในขณะนี้');
      }
    });
  };

  const handleSetReady = (isReady) => {
    playChipBet();
    socket.emit('set-ready', { isReady });
  };

  const handleSitOrRebuy = (seatIndex, buyInAmount) => {
    playChipBet();
    // If not seated, sit down
    const me = roomState?.players[socket.id];
    if (!me || me.seatIndex === -1) {
      socket.emit('sit-player', { seatIndex, buyIn: buyInAmount }, (res) => {
        if (!res.success) {
          alert(res.message || 'ไม่สามารถนั่งตำแหน่งนี้ได้');
        }
      });
    } else {
      // If already seated, top up / rebuy
      socket.emit('rebuy', { amount: buyInAmount }, (res) => {
        if (!res.success) {
          alert('ไม่สามารถเติมชิปได้ในขณะนี้');
        }
      });
    }
  };

  const handleLeaveRoom = () => {
    playChipBet();
    const confirmLeave = window.confirm("คุณต้องการออกจากห้องเล่นเกมนี้ใช่หรือไม่?");
    if (confirmLeave) {
      socket.disconnect();
      setView('lobby');
      setRoomState(null);
      setRoomId('');
      setShowdownResults([]);
      setShowdownOpponentCards(null);
    }
  };

  return (
    <div className="app-layout">
      {view === 'lobby' ? (
        <Lobby onRoomJoined={handleRoomJoined} onOpenRankings={() => setIsRankingsOpen(true)} />
      ) : (
        roomState && (
          <div className="game-screen-wrapper">
            <GameBoard
              room={roomState}
              socketId={socketId}
              onAction={handleAction}
              showdownOpponentCards={showdownOpponentCards}
              showdownResults={showdownResults}
              onStandUp={handleStandUp}
              onSetReady={handleSetReady}
              onRebuy={handleSitOrRebuy}
              onLeaveRoom={handleLeaveRoom}
              onOpenRankings={() => setIsRankingsOpen(true)}
            />
            <GameChat logs={roomState.gameLogs} />
          </div>
        )
      )}

      <HandRankingsModal 
        isOpen={isRankingsOpen} 
        onClose={() => setIsRankingsOpen(false)} 
      />
    </div>
  );
}

export default App;
