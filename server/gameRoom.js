const { evaluate7CardHand, compareHands } = require('./handEvaluator');

class GameRoom {
  constructor(roomId, hostId, config = {}) {
    this.roomId = roomId;
    this.hostId = hostId;
    
    // Configurations
    this.smallBlind = config.smallBlind || 10;
    this.bigBlind = this.smallBlind * 2;
    this.defaultBuyIn = config.defaultBuyIn || 1000;
    this.turnDuration = config.turnDuration !== undefined ? config.turnDuration : 30; // seconds
    this.useTimer = config.useTimer !== undefined ? config.useTimer : true;
    this.cardBack = config.cardBack || 'red';
    this.gameMode = config.gameMode || 'free'; // 'free' หรือ 'tournament'
    this.maxHands = config.maxHands || 0;
    this.currentHandCount = 0;
    this.winnersLeaderboard = [];
    this.maxPlayers = 6;

    // Room state
    this.players = {}; // socketId -> Player info
    this.seats = Array(this.maxPlayers).fill(null); // seatIndex -> socketId
    this.gameState = 'LOBBY'; // LOBBY, PRE_FLOP, FLOP, TURN, RIVER, SHOWDOWN

    // Game table state
    this.deck = [];
    this.communityCards = [];
    this.pot = 0;
    this.mainPot = 0;
    this.sidePots = []; // Array of side pots: { amount, eligiblePlayerIds }
    this.currentBet = 0; // The highest bet in the current round
    this.dealerIndex = 0; // Dealer button position (seat index)
    this.currentPlayerIndex = -1; // Seat index of player whose turn it is
    this.actionTimer = null;
    this.timerTimeLeft = 0;
    this.lobbyCountdown = null;
    this.lobbyCountdownInterval = null;
    
    // Game logs / Chat logs
    this.gameLogs = [];
  }

  log(msg) {
    this.gameLogs.push({
      time: new Date().toLocaleTimeString(),
      text: msg,
      type: 'system'
    });
  }

  addPlayer(socketId, name, avatar = 'm1') {
    this.players[socketId] = {
      id: socketId,
      name: name,
      avatar: avatar,
      chips: this.defaultBuyIn,
      seatIndex: -1,
      cards: [],
      isReady: false,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      totalContribution: 0,
      talked: false,
      isOnline: true
    };
    this.log(`${name} joined the room.`);
  }

  disconnectPlayer(socketId) {
    const player = this.players[socketId];
    if (!player) return null;

    player.isOnline = false;
    this.log(`${player.name} disconnected.`);

    // If game is in Lobby, stand up and remove them
    if (this.gameState === 'LOBBY') {
      this.removePlayer(socketId);
      return 'REMOVED';
    } else {
      // If active hand is running, auto-fold on their turn
      if (this.seats[this.currentPlayerIndex] === socketId) {
        this.handleAutoAction(socketId);
      }
      return 'MARKED_OFFLINE';
    }
  }

  removePlayer(socketId) {
    const player = this.players[socketId];
    if (!player) return;

    if (player.seatIndex !== -1) {
      this.seats[player.seatIndex] = null;
    }
    delete this.players[socketId];
    this.log(`${player.name} left the room.`);
    
    // Adjust dealer index if needed
    if (this.gameState === 'LOBBY') {
      this.checkLobbyStatus();
    }
  }

  sitPlayer(socketId, seatIndex, buyInAmount) {
    const player = this.players[socketId];
    if (!player) return false;
    if (seatIndex < 0 || seatIndex >= this.maxPlayers) return false;
    if (this.seats[seatIndex] !== null) return false; // Seat taken
    if (player.seatIndex !== -1) return false; // Player already seated

    // กำหนดจำนวนชิป: ต้องมีชิปเก่าค้างอยู่จริง (> 0) เพื่ออนุญาตให้นั่งเล่นได้ (ถ้าเป็น 0 ต้องผ่านสปอนเซอร์ก่อน)
    if (!player.chips || player.chips <= 0) {
      return false;
    }

    this.log(`${player.name} sat down at seat ${seatIndex + 1} with their stack of $${player.chips}.`);

    player.seatIndex = seatIndex;
    this.seats[seatIndex] = socketId;
    player.isReady = false;

    this.checkLobbyStatus();
    return true;
  }

  standPlayer(socketId) {
    const player = this.players[socketId];
    if (!player || player.seatIndex === -1) return false;

    // If game is running, fold them first
    if (this.gameState !== 'LOBBY' && !player.isFolded) {
      player.isFolded = true;
      player.talked = true;
      this.log(`${player.name} folds.`);
    }

    const seat = player.seatIndex;
    this.seats[seat] = null;
    player.seatIndex = -1;
    player.isReady = false; // ปิดการล้างค่าชิปเป็น 0 เพื่อจดจำยอดชิปเก่าของผู้เล่นไว้ในสเปกเตเตอร์

    this.log(`${player.name} stood up from seat ${seat + 1}.`);
    
    if (this.gameState === 'LOBBY') {
      this.checkLobbyCountdownCancel();
      this.checkLobbyStatus();
    } else {
      this.checkActivePlayers();
    }
    return true;
  }

  rebuyPlayer(socketId, buyInAmount) {
    const player = this.players[socketId];
    if (!player || player.seatIndex === -1) return false;
    
    // Only allow rebuy if they have 0 chips and the hand is not actively betting, or if they are in lobby
    // For play money, let's allow it anytime (will add chips after current hand completes, or instantly if they are folded/out)
    const topUp = parseInt(buyInAmount) || this.defaultBuyIn;
    if (this.gameState === 'LOBBY') {
      player.chips += topUp;
      this.log(`${player.name} re-bought for $${topUp}. Total chips: $${player.chips}`);
      return true;
    } else {
      // Queue rebuy for the end of the hand to prevent in-play stack manipulation
      player.queuedRebuy = topUp;
      this.log(`${player.name} requested a rebuy of $${topUp} (will be added next hand).`);
      return true;
    }
  }

  claimFreeChips(socketId) {
    const player = this.players[socketId];
    if (!player) return false;

    // ระบบความปลอดภัย: อนุญาตให้เคลมได้เฉพาะเมื่อไม่มีชิปเหลืออยู่เลยจริงๆ เท่านั้น
    const currentChips = player.chips || 0;
    if (currentChips > 0) return false;

    player.chips = 1000;
    this.log(`${player.name} claimed $1,000 free chips from Sponsor.`);

    if (this.gameState === 'LOBBY') {
      this.checkLobbyStatus();
    }
    return true;
  }

  setReady(socketId, isReady) {
    const player = this.players[socketId];
    if (!player || player.seatIndex === -1) return;

    player.isReady = isReady;
    this.log(`${player.name} is ${isReady ? 'READY' : 'NOT READY'}.`);
    
    if (this.gameState === 'LOBBY') {
      const seated = this.getSeatedPlayers();
      const readyPlayers = seated.filter(p => p.isReady);
      if (isReady && seated.length >= 2 && readyPlayers.length === seated.length) {
        if (this.lobbyCountdown === null) {
          this.startLobbyCountdown();
        }
      } else {
        this.checkLobbyCountdownCancel();
      }
    }
  }

  checkLobbyStatus() {
    // If lobby, check if at least 2 players are seated and ready
    if (this.gameState !== 'LOBBY') return;

    const seatedPlayers = this.getSeatedPlayers();
    const readyPlayers = seatedPlayers.filter(p => p.isReady);
    
    // Auto-start if all seated players (minimum 2) are ready
    if (seatedPlayers.length >= 2 && readyPlayers.length === seatedPlayers.length) {
      this.startHand();
    }
  }

  getSeatedPlayers() {
    return this.seats
      .map(id => this.players[id])
      .filter(p => p !== null && p !== undefined);
  }

  getActivePlayers() {
    // Seated, in the hand (not folded), and has chips or is all-in
    return this.getSeatedPlayers().filter(p => !p.isFolded && p.isOnline);
  }

  getActiveNotAllInPlayers() {
    return this.getActivePlayers().filter(p => !p.isAllIn);
  }

  createDeck() {
    const suits = ['H', 'D', 'C', 'S']; // Hearts, Diamonds, Clubs, Spades
    const deck = [];
    for (let rank = 2; rank <= 14; rank++) {
      for (const suit of suits) {
        deck.push({ rank, suit });
      }
    }
    // Shuffle (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.deck = deck;
  }

  startHand() {
    const seated = this.getSeatedPlayers();
    
    // Clean up disconnected players sitting at the table
    for (const p of seated) {
      if (!p.isOnline) {
        this.standPlayer(p.id);
        this.removePlayer(p.id);
      }
    }

    // Check again
    const activeSeated = this.getSeatedPlayers().filter(p => p.chips > 0 || p.queuedRebuy > 0);
    if (activeSeated.length < 2) {
      this.gameState = 'LOBBY';
      this.log("Not enough players with chips to start a hand.");
      return;
    }

    // บวกจำนวนตาเมื่อเริ่มแจกไพ่ในโหมดทัวร์นาเมนต์
    if (this.gameMode === 'tournament') {
      this.currentHandCount++;
      this.log(`--- Tournament Hand ${this.currentHandCount} / ${this.maxHands} starts ---`);
    }

    // Apply queued rebuys
    for (const p of this.getSeatedPlayers()) {
      if (p.queuedRebuy) {
        p.chips += p.queuedRebuy;
        p.queuedRebuy = 0;
        this.log(`${p.name} refilled chips to $${p.chips}.`);
      }
    }

    // Reset player variables for the hand
    Object.values(this.players).forEach(p => {
      p.cards = [];
      p.isFolded = p.seatIndex === -1 || p.chips === 0;
      p.isAllIn = false;
      p.currentBet = 0;
      p.totalContribution = 0;
      p.talked = false;
    });

    this.gameState = 'PRE_FLOP';
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;

    // Create and shuffle deck
    this.createDeck();

    // Determine Dealer button
    // Move to next seated player
    const seatedIndices = this.seats.map((id, index) => id !== null ? index : -1).filter(idx => idx !== -1);
    
    if (seatedIndices.length >= 2) {
      let nextDealerIdx = seatedIndices.findIndex(idx => idx > this.dealerIndex);
      if (nextDealerIdx === -1) nextDealerIdx = 0;
      this.dealerIndex = seatedIndices[nextDealerIdx];
    }

    this.log(`Hand started. Dealer Button is at seat ${this.dealerIndex + 1}.`);

    // Deal pocket cards: 2 cards each
    const activePlayers = this.getActivePlayers();
    for (let i = 0; i < 2; i++) {
      for (const player of activePlayers) {
        player.cards.push(this.deck.pop());
      }
    }

    // Post Blinds
    this.postBlinds();

    // Start betting round
    this.startBettingRound();

    if (this.onHandStart) {
      this.onHandStart();
    }
  }

  postBlinds() {
    const activeSeats = this.seats.map((id, index) => {
      if (id !== null && this.players[id] && !this.players[id].isFolded) {
        return index;
      }
      return -1;
    }).filter(idx => idx !== -1);

    let sbSeat, bbSeat;

    if (activeSeats.length === 2) {
      // Heads-up: Dealer button is SB, the other is BB
      sbSeat = this.dealerIndex;
      bbSeat = activeSeats.find(idx => idx !== this.dealerIndex);
    } else {
      // Multiplayer: Dealer button + 1 is SB, Dealer button + 2 is BB
      let dlIdx = activeSeats.indexOf(this.dealerIndex);
      sbSeat = activeSeats[(dlIdx + 1) % activeSeats.length];
      bbSeat = activeSeats[(dlIdx + 2) % activeSeats.length];
    }

    const sbPlayer = this.players[this.seats[sbSeat]];
    const bbPlayer = this.players[this.seats[bbSeat]];

    // SB payment
    const sbPaid = Math.min(sbPlayer.chips, this.smallBlind);
    sbPlayer.chips -= sbPaid;
    sbPlayer.currentBet = sbPaid;
    sbPlayer.totalContribution = sbPaid;
    if (sbPlayer.chips === 0) {
      sbPlayer.isAllIn = true;
    }
    this.log(`${sbPlayer.name} posts Small Blind $${sbPaid}.`);

    // BB payment
    const bbPaid = Math.min(bbPlayer.chips, this.bigBlind);
    bbPlayer.chips -= bbPaid;
    bbPlayer.currentBet = bbPaid;
    bbPlayer.totalContribution = bbPaid;
    if (bbPlayer.chips === 0) {
      bbPlayer.isAllIn = true;
    }
    this.log(`${bbPlayer.name} posts Big Blind $${bbPaid}.`);

    this.currentBet = Math.max(sbPaid, bbPaid);
  }

  startBettingRound() {
    // Reset talked state for active players who are not all-in
    const activePlayers = this.getActivePlayers();
    activePlayers.forEach(p => {
      p.talked = false;
    });

    if (this.gameState === 'PRE_FLOP') {
      // Action starts with the player left of BB
      const activeSeats = this.seats.map((id, index) => {
        if (id !== null && this.players[id] && !this.players[id].isFolded) {
          return index;
        }
        return -1;
      }).filter(idx => idx !== -1);

      let bbSeat;
      if (activeSeats.length === 2) {
        bbSeat = activeSeats.find(idx => idx !== this.dealerIndex);
      } else {
        let dlIdx = activeSeats.indexOf(this.dealerIndex);
        bbSeat = activeSeats[(dlIdx + 2) % activeSeats.length];
      }
      
      let bbIdx = activeSeats.indexOf(bbSeat);
      this.currentPlayerIndex = activeSeats[(bbIdx + 1) % activeSeats.length];
    } else {
      // Post-flop: Action starts with first active player left of Dealer button
      const activeSeats = this.seats.map((id, index) => {
        if (id !== null && this.players[id] && !this.players[id].isFolded) {
          return index;
        }
        return -1;
      }).filter(idx => idx !== -1);

      let dlIdx = activeSeats.indexOf(this.dealerIndex);
      if (dlIdx === -1) {
        // Button stood up or folded, find closest index
        let nextIdx = this.seats.findIndex((id, index) => index > this.dealerIndex && id !== null && !this.players[id].isFolded);
        if (nextIdx === -1) nextIdx = this.seats.findIndex((id, index) => id !== null && !this.players[id].isFolded);
        dlIdx = activeSeats.indexOf(nextIdx);
      }
      
      this.currentPlayerIndex = activeSeats[(dlIdx + 1) % activeSeats.length];
    }

    // If the currentPlayer has already gone all-in or folded, skip them
    const currentPlayer = this.players[this.seats[this.currentPlayerIndex]];
    if (currentPlayer && (currentPlayer.isFolded || currentPlayer.isAllIn)) {
      this.moveToNextPlayer();
    } else {
      this.resetTimer();
    }
  }

  resetTimer() {
    this.clearTimer();
    if (!this.useTimer) return;

    this.timerTimeLeft = this.turnDuration;
    this.actionTimer = setInterval(() => {
      this.timerTimeLeft--;
      if (this.timerTimeLeft <= 0) {
        this.clearTimer();
        this.handleAutoAction(this.seats[this.currentPlayerIndex]);
      }
      // Broadcast timer updates to room via external socket events
      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.timerTimeLeft);
      }
    }, 1000);
  }

  clearTimer() {
    if (this.actionTimer) {
      clearInterval(this.actionTimer);
      this.actionTimer = null;
    }
  }

  handleAutoAction(socketId) {
    // Force player to Fold when they run out of time (AFK/Inactive)
    const player = this.players[socketId];
    if (!player || player.seatIndex !== this.currentPlayerIndex) return;

    this.handleAction(socketId, 'fold');

    if (this.onTurnChange) {
      this.onTurnChange();
    }
  }

  handleAction(socketId, actionType, amount = 0) {
    const player = this.players[socketId];
    if (!player || player.seatIndex !== this.currentPlayerIndex) return false;

    const checkCost = this.currentBet - player.currentBet;
    let success = false;

    switch (actionType.toLowerCase()) {
      case 'fold':
        player.isFolded = true;
        player.talked = true;
        this.log(`${player.name} folds.`);
        success = true;
        break;

      case 'check':
        if (checkCost > 0) return false; // Cannot check if there is an active bet
        player.talked = true;
        this.log(`${player.name} checks.`);
        success = true;
        break;

      case 'call':
        const callAmount = Math.min(player.chips, checkCost);
        player.chips -= callAmount;
        player.currentBet += callAmount;
        player.totalContribution += callAmount;
        player.talked = true;
        if (player.chips === 0) {
          player.isAllIn = true;
        }
        this.log(`${player.name} calls $${callAmount}.`);
        success = true;
        break;

      case 'raise':
        // Amount is the absolute bet amount (e.g. if pot is 50, raise to 100 means total bet = 100)
        // Max raise is player's total chips. Min raise is currentBet + (currentBet - previousBet or bigBlind)
        const minRaise = this.currentBet + Math.max(this.bigBlind, this.currentBet);
        const actualAmount = Math.min(player.chips + player.currentBet, Math.max(minRaise, amount));
        const raiseCost = actualAmount - player.currentBet;

        player.chips -= raiseCost;
        player.currentBet = actualAmount;
        player.totalContribution += raiseCost;
        this.currentBet = actualAmount;
        
        // Reset talked status for other active players because bet raised
        const activeNotAllIn = this.getActiveNotAllInPlayers();
        activeNotAllIn.forEach(p => {
          p.talked = false;
        });
        player.talked = true;

        if (player.chips === 0) {
          player.isAllIn = true;
        }
        this.log(`${player.name} raises to $${actualAmount}.`);
        success = true;
        break;

      default:
        return false;
    }

    if (success) {
      this.clearTimer();
      
      // Check if hand is won because everyone else folded
      if (this.checkActivePlayers()) {
        return true;
      }
      
      // Check if betting round is complete
      if (this.checkBettingRoundComplete()) {
        this.advanceGame();
      } else {
        this.moveToNextPlayer();
      }
    }

    return success;
  }

  checkActivePlayers() {
    const active = this.getActivePlayers();
    if (active.length === 1) {
      this.clearTimer();
      // Only 1 player left, they win the pot!
      const winner = active[0];
      this.gameState = 'SHOWDOWN';
      
      // Collect bets into pot
      this.collectBets();

      this.log(`${winner.name} wins $${this.pot} (everyone else folded).`);
      
      // Showdown results for client overlay
      const showdownResults = [{
        id: winner.id,
        name: winner.name,
        cards: [], // No cards shown since others folded
        winAmount: this.pot,
        handName: 'ทุกคนหมอบหมด (Everyone Folded)',
        handCards: []
      }];

      winner.chips += this.pot;

      const opponentCards = {};
      this.getSeatedPlayers().forEach(p => {
        if (p.cards && p.cards.length > 0) {
          opponentCards[p.id] = p.cards;
        }
      });

      if (this.onShowdown) {
        this.onShowdown(showdownResults, opponentCards);
      }

      this.pot = 0;
      
      // Reset game room state and schedule next hand in 7 seconds
      setTimeout(() => {
        this.gameState = 'LOBBY';
        // Seated players with 0 chips must be stood up or prompt for rebuy
        this.getSeatedPlayers().forEach(p => {
          if (p.chips === 0 && !p.queuedRebuy) {
            this.log(`${p.name} has 0 chips and is stood up.`);
            this.standPlayer(p.id);
          }
        });
        
        // ตรวจสอบและเริ่มเวลานับถอยหลังหน้า Lobby 30 วินาทีก่อนตาใหม่จะเริ่มขึ้น
        const seated = this.getSeatedPlayers();
        const readyPlayers = seated.filter(p => p.isReady);
        if (seated.length >= 2 && readyPlayers.length === seated.length) {
          this.startLobbyCountdown();
        } else {
          this.checkLobbyStatus();
        }

        if (this.onHandComplete) {
          this.onHandComplete();
        }
      }, 7000);

      return true;
    }
    return false;
  }

  checkBettingRoundComplete() {
    const active = this.getActivePlayers();
    const activeNotAllIn = this.getActiveNotAllInPlayers();

    // If 0 or 1 active players can still make decisions, betting is effectively complete
    if (activeNotAllIn.length <= 1) {
      // Check if remaining active players who aren't all-in have matched the highest bet
      const allMatched = activeNotAllIn.every(p => p.currentBet === this.currentBet && p.talked);
      if (allMatched) return true;
      if (activeNotAllIn.length === 0) return true;
    }

    // Everyone who is active must have talked and match the highest bet
    return active.every(p => p.isAllIn || (p.talked && p.currentBet === this.currentBet));
  }

  moveToNextPlayer() {
    const activeSeats = this.seats.map((id, index) => {
      if (id !== null && this.players[id] && !this.players[id].isFolded && !this.players[id].isAllIn) {
        return index;
      }
      return -1;
    }).filter(idx => idx !== -1);

    if (activeSeats.length === 0) {
      this.advanceGame();
      return;
    }

    let currentIdx = activeSeats.indexOf(this.currentPlayerIndex);
    if (currentIdx === -1) {
      // The current player might have folded/stood up, find the next active seat left of current
      let nextSeat = this.seats.findIndex((id, index) => index > this.currentPlayerIndex && id !== null && !this.players[id].isFolded && !this.players[id].isAllIn);
      if (nextSeat === -1) nextSeat = this.seats.findIndex((id, index) => id !== null && !this.players[id].isFolded && !this.players[id].isAllIn);
      this.currentPlayerIndex = nextSeat;
    } else {
      this.currentPlayerIndex = activeSeats[(currentIdx + 1) % activeSeats.length];
    }

    this.resetTimer();
  }

  collectBets() {
    Object.values(this.players).forEach(p => {
      this.pot += p.currentBet;
      p.currentBet = 0;
    });
    this.currentBet = 0;
  }

  advanceGame() {
    this.collectBets();

    // Check if we need to skip straight to showdown (i.e. all players but at most 1 are all-in)
    const activeNotAllIn = this.getActiveNotAllInPlayers();
    const active = this.getActivePlayers();
    const skipToShowdown = activeNotAllIn.length <= 1 && active.length > 1;

    if (this.gameState === 'PRE_FLOP') {
      this.gameState = 'FLOP';
      // Burn 1, deal 3 community cards
      this.deck.pop(); // Burn
      this.communityCards.push(this.deck.pop());
      this.communityCards.push(this.deck.pop());
      this.communityCards.push(this.deck.pop());
      this.log(`Flop dealt: ${this.communityCards.map(c => this.cardToString(c)).join(', ')}`);
      
      if (skipToShowdown) {
        setTimeout(() => this.advanceGame(), 1500);
      } else {
        this.startBettingRound();
      }
    } else if (this.gameState === 'FLOP') {
      this.gameState = 'TURN';
      this.deck.pop(); // Burn
      this.communityCards.push(this.deck.pop());
      this.log(`Turn dealt: ${this.cardToString(this.communityCards[3])}`);
      
      if (skipToShowdown) {
        setTimeout(() => this.advanceGame(), 1500);
      } else {
        this.startBettingRound();
      }
    } else if (this.gameState === 'TURN') {
      this.gameState = 'RIVER';
      this.deck.pop(); // Burn
      this.communityCards.push(this.deck.pop());
      this.log(`River dealt: ${this.cardToString(this.communityCards[4])}`);
      
      if (skipToShowdown) {
        setTimeout(() => this.advanceGame(), 1500);
      } else {
        this.startBettingRound();
      }
    } else if (this.gameState === 'RIVER') {
      this.showdown();
    }
  }

  cardToString(card) {
    const ranks = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    const suits = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };
    const rankStr = ranks[card.rank] || card.rank.toString();
    const suitStr = suits[card.suit] || card.suit;
    return rankStr + suitStr;
  }

  showdown() {
    this.gameState = 'SHOWDOWN';
    this.clearTimer();

    const activePlayers = this.getActivePlayers();
    
    // Evaluate hands for all active players
    const evaluated = activePlayers.map(p => {
      const fullHand = [...p.cards, ...this.communityCards];
      const evaluation = evaluate7CardHand(fullHand);
      return {
        id: p.id,
        name: p.name,
        hand: evaluation,
        totalContribution: p.totalContribution
      };
    });

    // Split pots calculation (handles main + side pots via total Contribution)
    // We will distribute the chips to the winners of each pot tier.
    const contributions = activePlayers.map(p => ({
      id: p.id,
      contrib: p.totalContribution,
      folded: p.isFolded
    }));

    // Add contributions of folded players as well
    Object.values(this.players).forEach(p => {
      if (p.isFolded && p.totalContribution > 0) {
        contributions.push({
          id: p.id,
          contrib: p.totalContribution,
          folded: true
        });
      }
    });

    const distributions = {}; // socketId -> amount won
    activePlayers.forEach(p => { distributions[p.id] = 0; });

    // Solve pots level by level
    let totalDistributed = 0;
    
    while (true) {
      // Find contributors with positive remaining contributions
      const activeContributors = contributions.filter(c => c.contrib > 0);
      if (activeContributors.length === 0) break;

      // Find the minimum contribution in this round
      const minContrib = Math.min(...activeContributors.map(c => c.contrib));
      
      // Calculate pot for this level
      let levelPot = 0;
      activeContributors.forEach(c => {
        levelPot += minContrib;
        c.contrib -= minContrib;
      });

      // Find players eligible for this pot level (must not be folded and had contribution in this level)
      const eligibleIds = activeContributors
        .filter(c => !c.folded)
        .map(c => c.id);

      if (eligibleIds.length === 0) {
        // Fallback: If no one is eligible (should not happen normally), give to first active player
        const fallback = activePlayers[0];
        if (fallback) {
          distributions[fallback.id] = (distributions[fallback.id] || 0) + levelPot;
        }
        continue;
      }

      // Find the best hand among eligible players
      const levelEvaluations = evaluated.filter(e => eligibleIds.includes(e.id));
      
      // Sort hands descending
      levelEvaluations.sort((a, b) => compareHands(b.hand, a.hand));

      // Check if there are ties
      const bestEvaluation = levelEvaluations[0];
      const winners = levelEvaluations.filter(e => compareHands(e.hand, bestEvaluation.hand) === 0);

      // Distribute level pot equally among winners
      const winShare = Math.floor(levelPot / winners.length);
      const remainder = levelPot % winners.length;

      winners.forEach((w, idx) => {
        const bonus = (idx === 0) ? remainder : 0; // First winner gets the rounding odd chip
        distributions[w.id] = (distributions[w.id] || 0) + winShare + bonus;
      });
    }

    // Apply winnings to player chips and log the results
    const showdownResults = [];
    Object.entries(distributions).forEach(([socketId, winAmount]) => {
      if (winAmount > 0) {
        const p = this.players[socketId];
        p.chips += winAmount;
        const evalHand = evaluated.find(e => e.id === socketId);
        const handText = evalHand ? `${evalHand.hand.type} (${evalHand.hand.cards.map(c => this.cardToString(c)).join(' ')})` : '';
        this.log(`${p.name} wins $${winAmount} with ${handText}.`);
        showdownResults.push({
          id: socketId,
          name: p.name,
          cards: p.cards,
          winAmount,
          handName: evalHand ? evalHand.hand.type : '',
          handCards: evalHand ? evalHand.hand.cards : []
        });
      }
    });

    // Send others' cards to client for final display
    const opponentCards = {};
    this.getSeatedPlayers().forEach(p => {
      if (p.cards && p.cards.length > 0) {
        opponentCards[p.id] = p.cards;
      }
    });

    if (this.onShowdown) {
      this.onShowdown(showdownResults, opponentCards);
    }

    this.pot = 0;

    // Reset game room state and schedule next hand in 7 seconds
    setTimeout(() => {
      // ตรวจสอบหากสิ้นสุดการแข่งขันในโหมดทัวร์นาเมนต์
      if (this.gameMode === 'tournament' && this.currentHandCount >= this.maxHands) {
        this.gameState = 'GAME_OVER';

        // เรียงลำดับแชมป์เปี้ยนผู้มีชิปสูงสุด
        const seated = this.getSeatedPlayers();
        this.winnersLeaderboard = seated.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          chips: p.chips
        })).sort((a, b) => b.chips - a.chips);

        this.log(`Tournament complete! Champion: ${this.winnersLeaderboard[0]?.name || 'None'} with $${this.winnersLeaderboard[0]?.chips || 0}`);

        if (this.onHandComplete) {
          this.onHandComplete();
        }
        return; // ห้ามเริ่มตาใหม่หรือนับถอยหลังใดๆ ทั้งสิ้น
      }

      this.gameState = 'LOBBY';
      // Seated players with 0 chips must be stood up or prompt for rebuy
      this.getSeatedPlayers().forEach(p => {
        if (p.chips === 0 && !p.queuedRebuy) {
          this.log(`${p.name} has 0 chips and is stood up.`);
          this.standPlayer(p.id);
        }
      });

      // ตรวจสอบและเริ่มเวลานับถอยหลังหน้า Lobby 30 วินาทีก่อนตาใหม่จะเริ่มขึ้น
      const seated = this.getSeatedPlayers();
      const readyPlayers = seated.filter(p => p.isReady);
      if (seated.length >= 2 && readyPlayers.length === seated.length) {
        this.startLobbyCountdown();
      } else {
        this.checkLobbyStatus();
      }

      if (this.onHandComplete) {
        this.onHandComplete();
      }
    }, 7000);
  }

  startLobbyCountdown() {
    this.clearLobbyCountdown();
    
    const seated = this.getSeatedPlayers();
    const readyPlayers = seated.filter(p => p.isReady);
    
    if (seated.length >= 2 && readyPlayers.length === seated.length) {
      this.lobbyCountdown = 30; // 30 seconds
      this.log(`Next hand starting in ${this.lobbyCountdown} seconds.`);
      
      if (this.onLobbyTimerUpdate) {
        this.onLobbyTimerUpdate(this.lobbyCountdown);
      }
      
      this.lobbyCountdownInterval = setInterval(() => {
        this.lobbyCountdown--;
        
        if (this.onLobbyTimerUpdate) {
          this.onLobbyTimerUpdate(this.lobbyCountdown);
        }
        
        if (this.lobbyCountdown <= 0) {
          this.clearLobbyCountdown();
          this.startHand();
        }
      }, 1000);
    }
  }

  clearLobbyCountdown() {
    if (this.lobbyCountdownInterval) {
      clearInterval(this.lobbyCountdownInterval);
      this.lobbyCountdownInterval = null;
    }
    this.lobbyCountdown = null;
  }

  checkLobbyCountdownCancel() {
    if (this.lobbyCountdown !== null) {
      const seated = this.getSeatedPlayers();
      const readyPlayers = seated.filter(p => p.isReady);
      if (seated.length < 2 || readyPlayers.length < 2 || readyPlayers.length !== seated.length) {
        this.clearLobbyCountdown();
        this.log("Lobby countdown cancelled.");
        if (this.onLobbyTimerUpdate) {
          this.onLobbyTimerUpdate(null);
        }
      }
    }
  }

  // Helper for manual raise checks
  getMinRaiseAmount(socketId) {
    const player = this.players[socketId];
    if (!player) return 0;
    return this.currentBet + Math.max(this.bigBlind, this.currentBet);
  }

  getMaxRaiseAmount(socketId) {
    const player = this.players[socketId];
    if (!player) return 0;
    return player.chips + player.currentBet;
  }

  resetTournament() {
    this.gameState = 'LOBBY';
    this.currentHandCount = 0;
    this.winnersLeaderboard = [];

    // รีเซ็ตชิปผู้เล่นทุกคนในห้องให้เท่ากับยอด defaultBuyIn เริ่มต้นเพื่อเปิดฤดูกาลแข่งใหม่
    Object.values(this.players).forEach(p => {
      p.chips = this.defaultBuyIn;
      p.isReady = false;
      p.isFolded = false;
      p.isAllIn = false;
      p.currentBet = 0;
      p.totalContribution = 0;
      p.queuedRebuy = 0;
      p.cards = [];
    });

    this.log("Tournament reset. A new match is ready to start.");
    this.checkLobbyStatus();
  }
}

module.exports = GameRoom;
