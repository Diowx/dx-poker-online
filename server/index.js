const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameRoom = require('./gameRoom');

const app = express();
app.use(cors());

// If in production, serve client static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for easy development
    methods: ["GET", "POST"]
  }
});

const rooms = {}; // roomId -> GameRoom instance

// Helper to generate a unique room code
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  do {
    result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[result]);
  return result;
}

// Helper to clean game state for a specific client (hides other players' cards)
function getCleanedGameState(room, clientSocketId) {
  const playersCleaned = {};
  
  Object.keys(room.players).forEach(sid => {
    const p = room.players[sid];
    
    // Only send card info if it's the owner, or if the game is in SHOWDOWN and the card is revealed
    const showCards = (sid === clientSocketId) || 
                      (room.gameState === 'SHOWDOWN' && !p.isFolded && p.cards.length > 0);

    playersCleaned[sid] = {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
      seatIndex: p.seatIndex,
      isReady: p.isReady,
      isFolded: p.isFolded,
      isAllIn: p.isAllIn,
      currentBet: p.currentBet,
      totalContribution: p.totalContribution,
      talked: p.talked,
      isOnline: p.isOnline,
      cards: showCards ? p.cards : (p.cards.length > 0 ? [true, true] : [])
    };
  });

  return {
    roomId: room.roomId,
    hostId: room.hostId,
    smallBlind: room.smallBlind,
    bigBlind: room.bigBlind,
    defaultBuyIn: room.defaultBuyIn,
    turnDuration: room.turnDuration,
    useTimer: room.useTimer,
    maxPlayers: room.maxPlayers,
    gameState: room.gameState,
    seats: room.seats,
    players: playersCleaned,
    communityCards: room.communityCards,
    pot: room.pot,
    currentBet: room.currentBet,
    dealerIndex: room.dealerIndex,
    currentPlayerIndex: room.currentPlayerIndex,
    timerTimeLeft: room.timerTimeLeft,
    lobbyCountdown: room.lobbyCountdown,
    cardBack: room.cardBack,
    gameMode: room.gameMode,
    maxHands: room.maxHands,
    currentHandCount: room.currentHandCount,
    winnersLeaderboard: room.winnersLeaderboard,
    gameLogs: room.gameLogs.slice(-30) // Only send the last 30 logs to reduce bandwidth
  };
}

// Helper to broadcast state to all players in a room individually (so each gets their clean view)
function broadcastRoomState(room) {
  const players = Object.keys(room.players);
  players.forEach(sid => {
    if (room.players[sid].isOnline) {
      io.to(sid).emit('room-state', getCleanedGameState(room, sid));
    }
  });
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  let currentRoomId = null;

  // 1. Create Room
  socket.on('create-room', (config, callback) => {
    const roomId = generateRoomId();
    const room = new GameRoom(roomId, socket.id, config);
    rooms[roomId] = room;

    // Attach room event callbacks for broadcasting
    room.onTimerUpdate = (timeLeft) => {
      io.to(roomId).emit('timer-update', { timeLeft, currentPlayerIndex: room.currentPlayerIndex });
    };

    room.onLobbyTimerUpdate = (timeLeft) => {
      broadcastRoomState(room);
    };

    room.onShowdown = (results, opponentCards) => {
      io.to(roomId).emit('showdown-results', { results, opponentCards });
      broadcastRoomState(room);
    };

    room.onHandComplete = () => {
      broadcastRoomState(room);
    };

    room.onHandStart = () => {
      broadcastRoomState(room);
    };

    room.onTurnChange = () => {
      broadcastRoomState(room);
    };

    // Join socket room
    socket.join(roomId);
    currentRoomId = roomId;
    
    // Add host as player
    room.addPlayer(socket.id, config.playerName || 'Host', config.avatar);
    
    // Auto sit the host at seat 0
    room.sitPlayer(socket.id, 0, config.buyIn || room.defaultBuyIn);

    callback({ success: true, roomId });
    broadcastRoomState(room);
  });

  // 2. Join Room
  socket.on('join-room', ({ roomId, name, avatar }, callback) => {
    const cleanedRoomId = roomId.toUpperCase();
    const room = rooms[cleanedRoomId];
    if (!room) {
      return callback({ success: false, message: 'Room not found.' });
    }

    const seated = room.getSeatedPlayers();
    if (seated.length >= room.maxPlayers) {
      // Allow joining as spectator
      // To keep it simple, we can allow joining the room and let them sit if space opens up.
    }

    socket.join(cleanedRoomId);
    currentRoomId = cleanedRoomId;
    
    // Add player to the room
    room.addPlayer(socket.id, name, avatar);

    // Auto-sit at first available seat
    let assignedSeat = -1;
    for (let i = 0; i < room.maxPlayers; i++) {
      if (room.seats[i] === null) {
        assignedSeat = i;
        break;
      }
    }

    if (assignedSeat !== -1) {
      room.sitPlayer(socket.id, assignedSeat, room.defaultBuyIn);
    } else {
      room.log(`${name} joined as a spectator (table is full).`);
    }

    callback({ success: true, roomId: cleanedRoomId });
    broadcastRoomState(room);
  });

  // 3. Sit Player
  socket.on('sit-player', ({ seatIndex, buyIn }, callback) => {
    const room = rooms[currentRoomId];
    if (!room) return callback({ success: false, message: 'Room not found.' });

    const success = room.sitPlayer(socket.id, seatIndex, buyIn);
    if (success) {
      callback({ success: true });
      broadcastRoomState(room);
    } else {
      callback({ success: false, message: 'Could not sit down.' });
    }
  });

  // 4. Stand Player
  socket.on('stand-player', (callback) => {
    const room = rooms[currentRoomId];
    if (!room) return callback({ success: false });

    const success = room.standPlayer(socket.id);
    callback({ success });
    broadcastRoomState(room);
  });

  // 5. Rebuy Chips
  socket.on('rebuy', ({ amount }, callback) => {
    const room = rooms[currentRoomId];
    if (!room) return callback({ success: false });

    const success = room.rebuyPlayer(socket.id, amount);
    callback({ success });
    broadcastRoomState(room);
  });

  // 6. Set Ready State
  socket.on('set-ready', ({ isReady }) => {
    const room = rooms[currentRoomId];
    if (!room) return;

    room.setReady(socket.id, isReady);
    broadcastRoomState(room);
  });

  // 7. Player Action (Check, Fold, Call, Raise)
  socket.on('player-action', ({ action, amount }) => {
    const room = rooms[currentRoomId];
    if (!room) return;

    const success = room.handleAction(socket.id, action, amount);
    if (success) {
      broadcastRoomState(room);
    }
  });

  // 8. Chat Message
  socket.on('chat-message', (messageText) => {
    const room = rooms[currentRoomId];
    if (!room) return;

    const player = room.players[socket.id];
    if (!player) return;

    room.gameLogs.push({
      time: new Date().toLocaleTimeString(),
      text: `${player.name}: ${messageText}`,
      type: 'chat'
    });

    // ยิงอีเวนต์ใหม่เพื่อส่งข้อความทำบับเบิ้ลแสดงบนโต๊ะ
    io.to(currentRoomId).emit('new-chat-message', {
      playerId: socket.id,
      name: player.name,
      text: messageText
    });

    broadcastRoomState(room);
  });

  // 8.5. Claim Free Chips from Sponsor
  socket.on('claim-free-chips', (callback) => {
    if (!currentRoomId) return callback({ success: false, message: 'ไม่ได้อยู่ในห้องเล่นเกม' });
    const room = rooms[currentRoomId];
    if (!room) return callback({ success: false, message: 'ไม่พบห้องเล่นเกม' });

    const player = room.players[socket.id];
    if (!player) return callback({ success: false, message: 'ไม่พบข้อมูลผู้เล่น' });

    // ความปลอดภัย: เช็คยอดเงินจริงบนเซิร์ฟเวอร์ว่าหมดตัวแล้วจริง
    const currentChips = player.chips || 0;
    if (currentChips > 0) {
      return callback({ success: false, message: 'คุณยังมีชิปเหลืออยู่ ไม่สามารถรับชิปฟรีได้' });
    }

    const success = room.claimFreeChips(socket.id);
    if (success) {
      broadcastRoomState(room);
      callback({ success: true, newChips: player.chips });
    } else {
      callback({ success: false, message: 'เกิดข้อผิดพลาดในการรับชิปฟรี' });
    }
  });

  // 8.6. Reset Tournament
  socket.on('reset-tournament', (callback) => {
    if (!currentRoomId) return callback({ success: false, message: 'ไม่ได้อยู่ในห้องเล่นเกม' });
    const room = rooms[currentRoomId];
    if (!room) return callback({ success: false, message: 'ไม่พบห้องเล่นเกม' });
    if (socket.id !== room.hostId) return callback({ success: false, message: 'เฉพาะผู้สร้างห้องเท่านั้นที่ทำรายการนี้ได้' });

    room.resetTournament();
    broadcastRoomState(room);
    callback({ success: true });
  });

  // 9. Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (currentRoomId) {
      const room = rooms[currentRoomId];
      if (room) {
        const result = room.disconnectPlayer(socket.id);
        
        // Clean up room if it's completely empty
        const activeConnections = Object.values(room.players).filter(p => p.isOnline).length;
        if (activeConnections === 0) {
          room.clearTimer();
          delete rooms[currentRoomId];
          console.log(`Room ${currentRoomId} deleted (all players disconnected).`);
        } else {
          broadcastRoomState(room);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
