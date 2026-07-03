import React, { useState, useEffect } from 'react';
import PlayerSeat from './PlayerSeat';
import Controls from './Controls';
import Card from './Card';
import { playChipBet, playWinnerReveal } from '../utils/audio';
import { socket } from '../socket';
import { AvatarIcon } from './AvatarIcon';

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
  onOpenRankings,
  chatBubbles = {}
}) {
  const me = room.players[socketId];
  const isHost = socketId === room.hostId;
  const isSpectator = me ? me.seatIndex === -1 : true;
  const [showSuitRankings, setShowSuitRankings] = useState(false);

  const winnerIds = showdownResults.map(r => r.id);

  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isClaiming, setIsClaiming] = useState(false);

  // ควบคุมการนับถอยหลังของเวลารับชิปสปอนเซอร์
  useEffect(() => {
    let timer = null;
    if (showSponsorModal && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showSponsorModal, secondsLeft]);

  const handleOpenSponsorModal = () => {
    setSecondsLeft(15);
    setShowSponsorModal(true);
  };

  const handleCloseSponsorModal = () => {
    setShowSponsorModal(false);
  };

  const handleClaimChips = () => {
    if (secondsLeft > 0 || isClaiming) return;
    setIsClaiming(true);
    socket.emit('claim-free-chips', (res) => {
      setIsClaiming(false);
      if (res.success) {
        playWinnerReveal();
        setShowSponsorModal(false);
      } else {
        alert(res.message || 'เกิดข้อผิดพลาดในการรับชิปฟรี');
      }
    });
  };

  const handleResetTournament = () => {
    playChipBet();
    socket.emit('reset-tournament', (res) => {
      if (!res.success) {
        alert(res.message || 'เกิดข้อผิดพลาดในการรีเซ็ตการแข่งขัน');
      }
    });
  };

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
              chatBubble={chatBubbles[player.id]}
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
    onRebuy(seatIndex, null);
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
          {room.gameMode === 'tournament' && (
            <>
              <span className="room-divider">|</span>
              <span className="room-label font-gold">🏆 แข่งรอบ:</span>
              <span className="room-value font-gold font-bold">{room.currentHandCount} / {room.maxHands} ตา</span>
            </>
          )}
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
          <button 
            type="button" 
            className="lobby-action-btn" 
            onClick={() => setShowSuitRankings(true)}
            style={{ padding: '5px 12px', fontSize: '0.8rem', borderColor: 'var(--gold-dark)', color: 'var(--gold)' }}
          >
            🎨 ลำดับดอก
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
              room.lobbyCountdown !== null && room.lobbyCountdown !== undefined ? (
                <div className="lobby-countdown-overlay animate-fadeIn">
                  <div className="countdown-title">เกมถัดไปกำลังจะเริ่มใน</div>
                  <div className="countdown-number">{room.lobbyCountdown}</div>
                  <div className="countdown-subtitle">วินาที</div>
                </div>
              ) : (
                <div className="lobby-waiting-overlay">
                  <h3>รอผู้เล่นให้พร้อมเพื่อเริ่มเกม</h3>
                  <p>จำนวนที่นั่งเล่นปัจจุบัน: {room.seats.filter(s => s !== null).length}/6 คน</p>
                </div>
              )
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
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="lobby-action-btn" 
                onClick={onOpenRankings}
                style={{ borderColor: 'var(--gold-dark)', color: 'var(--gold)' }}
              >
                ℹ️ ลำดับไพ่
              </button>
              <button 
                type="button" 
                className="lobby-action-btn" 
                onClick={() => setShowSuitRankings(true)}
                style={{ borderColor: 'var(--gold-dark)', color: 'var(--gold)' }}
              >
                🎨 ลำดับดอก
              </button>
              <button className="lobby-action-btn stand-btn" onClick={onStandUp}>
                ลุกขึ้นยืน (Stand)
              </button>
            </div>
          </div>
        )}

        {/* แสดงแบนเนอร์แจ้งเงินหมดสำหรับผู้ชมเพื่อขอกดเติมชิปฟรีจากสปอนเซอร์ */}
        {isSpectator && me && me.chips === 0 && (
          <div className="lobby-actions-row spectator-broke-row animate-fadeIn">
            <span className="broke-text-warning">⚠️ ยอดเงินในกระเป๋าของคุณหมดเกลี้ยง ($0)</span>
            <button 
              className="lobby-action-btn claim-free-btn" 
              onClick={handleOpenSponsorModal}
              style={{ background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)', color: '#000', fontWeight: 'bold', border: 'none', boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)' }}
            >
              🎁 รับชิปฟรี $1,000
            </button>
          </div>
        )}

        {/* Action Controls for turns */}
        <Controls 
          player={me}
          room={room}
          onAction={onAction}
        />

        {showSuitRankings && (
          <div className="modal-overlay" onClick={() => setShowSuitRankings(false)}>
            <div className="modal-content suit-rankings-modal animate-scaleIn" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🏆 ลำดับดอกไพ่ (Suit Rankings)</h3>
                <button className="close-btn" onClick={() => setShowSuitRankings(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="suit-ranking-list">
                  <div className="suit-ranking-item highest">
                    <span className="rank-num">1</span>
                    <span className="suit-symbol spades">♠</span>
                    <span className="suit-name-th">โพดำ (Spades)</span>
                    <span className="suit-status-badge highest-badge">สูงสุด</span>
                  </div>
                  <div className="suit-ranking-item">
                    <span className="rank-num">2</span>
                    <span className="suit-symbol hearts">♥</span>
                    <span className="suit-name-th">โพแดง (Hearts)</span>
                  </div>
                  <div className="suit-ranking-item">
                    <span className="rank-num">3</span>
                    <span className="suit-symbol diamonds">♦</span>
                    <span className="suit-name-th">ข้าวหลามตัด (Diamonds)</span>
                  </div>
                  <div className="suit-ranking-item lowest">
                    <span className="rank-num">4</span>
                    <span className="suit-symbol clubs">♣</span>
                    <span className="suit-name-th">ดอกจิก (Clubs)</span>
                    <span className="suit-status-badge lowest-badge">ต่ำสุด</span>
                  </div>
                </div>
                <p className="suit-ranking-note">
                  ℹ️ ตามกติกาโป๊กเกอร์สากล ดอกไพ่ทั้งหมดมีค่าเท่ากันในการวัดแต้มไพ่ (ไม่มีการนับดอกเพื่อหาผู้ชนะหลัก) ลำดับนี้ใช้เพื่อการตัดสินผลในกรณีพิเศษ หรือกติกาเสริมเฉพาะกลุ่มเท่านั้น
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL นับถอยหลังโฆษณาสปอนเซอร์แลกชิปฟรี */}
        {showSponsorModal && (
          <div className="modal-overlay" onClick={handleCloseSponsorModal}>
            <div className="modal-content sponsor-modal animate-scaleIn" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🎁 สนับสนุนสปอนเซอร์เพื่อรับชิปฟรี</h3>
                <button className="close-btn" onClick={handleCloseSponsorModal}>&times;</button>
              </div>
              <div className="modal-body text-center">
                <p className="sponsor-instruction">
                  กรุณารอสปอนเซอร์ <strong className="timer-seconds">{secondsLeft} วินาที</strong> เพื่อสิทธิ์เคลมชิปตั้งตัวฟรี
                </p>
                
                {/* แถบ Progress Bar */}
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }}></div>
                </div>

                {/* ส่วนจำลองพื้นที่ติดป้ายโฆษณา AdSense */}
                <div className="sponsor-ad-container">
                  <div className="sponsor-ad-label">SPONSOR ADVERTISEMENT</div>
                  <div className="simulated-ad-banner">
                    <div className="ad-content-placeholder">
                      <div className="ad-title">🎰 DX Casino Online 🎰</div>
                      <div className="ad-desc">แจกฟรีสปินไม่อั้นวันนี้! คาสิโนออนไลน์ที่ใหญ่ที่สุด</div>
                      <div className="ad-button">เรียนรู้เพิ่มเติม</div>
                    </div>
                    {/* 
                      -- โค้ดสำหรับวาง AdSense จริงในอนาคต (เปิดใช้งานโดยการใส่ ID และลบคอมเมนต์ออก):
                      <ins className="adsbygoogle"
                           style={{display:"block"}}
                           data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
                           data-ad-slot="1234567890"
                           data-ad-format="auto"
                           data-full-width-responsive="true"></ins>
                      <script>
                           (adsbygoogle = window.adsbygoogle || []).push({});
                      </script>
                    */}
                  </div>
                </div>

                {/* ปุ่มกดยืนยันการเคลมเงิน */}
                <button 
                  className={`claim-chips-btn ${secondsLeft === 0 ? 'enabled' : 'disabled'}`}
                  disabled={secondsLeft > 0 || isClaiming}
                  onClick={handleClaimChips}
                >
                  {isClaiming ? 'กำลังประมวลผล...' : (secondsLeft > 0 ? `กรุณารอ... (${secondsLeft} วินาที)` : '🎁 กดรับชิปฟรี $1,000')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL แสดงพิธีมอบรางวัลแท่นรับรางวัลแชมป์เปี้ยนทัวร์นาเมนต์ */}
        {room.gameState === 'GAME_OVER' && (
          <div className="modal-overlay champions-ceremony-overlay animate-fadeIn">
            <div className="modal-content champions-ceremony-content animate-scaleIn" onClick={e => e.stopPropagation()}>
              <div className="ceremony-header">
                <div className="trophy-icon">🏆</div>
                <h2>TOURNAMENT COMPLETE</h2>
                <p className="ceremony-subtitle">ทำเนียบทำเนียบแชมป์ผู้ชนะประจำทัวร์นาเมนต์รอบนี้</p>
              </div>
              
              <div className="podium-container">
                {/* รองอันดับ 1 (โพเดียมฝั่งซ้าย - อันดับ 2) */}
                {room.winnersLeaderboard[1] && (
                  <div className="podium-step step-2 animate-slideUp">
                    <div className="podium-player">
                      <div className="podium-avatar">
                        <AvatarIcon id={room.winnersLeaderboard[1].avatar} size={50} />
                      </div>
                      <div className="podium-name">{room.winnersLeaderboard[1].name}</div>
                      <div className="podium-chips">${room.winnersLeaderboard[1].chips.toLocaleString()} ชิป</div>
                      <div className={`podium-net-profit ${room.winnersLeaderboard[1].netProfit >= 0 ? 'profit-plus' : 'profit-minus'}`}>
                        {room.winnersLeaderboard[1].netProfit >= 0 ? `+$${room.winnersLeaderboard[1].netProfit.toLocaleString()}` : `-$${Math.abs(room.winnersLeaderboard[1].netProfit).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="podium-pillar pillar-2">
                      <span className="place-num">2</span>
                    </div>
                  </div>
                )}

                {/* แชมป์ชนะเลิศอันดับ 1 (โพเดียมกลาง - แชมป์เปี้ยน) */}
                {room.winnersLeaderboard[0] && (
                  <div className="podium-step step-1 animate-slideUpDelay">
                    <div className="podium-player">
                      <div className="champion-crown animate-pulse">👑</div>
                      <div className="podium-avatar champion-avatar">
                        <AvatarIcon id={room.winnersLeaderboard[0].avatar} size={65} />
                      </div>
                      <div className="podium-name champion-name">{room.winnersLeaderboard[0].name}</div>
                      <div className="podium-chips champion-chips">${room.winnersLeaderboard[0].chips.toLocaleString()} ชิป</div>
                      <div className={`champion-net-profit ${room.winnersLeaderboard[0].netProfit >= 0 ? 'profit-plus' : 'profit-minus'}`}>
                        กำไร: {room.winnersLeaderboard[0].netProfit >= 0 ? `+$${room.winnersLeaderboard[0].netProfit.toLocaleString()}` : `-$${Math.abs(room.winnersLeaderboard[0].netProfit).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="podium-pillar pillar-1">
                      <span className="place-num">1</span>
                    </div>
                  </div>
                )}

                {/* รองอันดับ 2 (โพเดียมฝั่งขวา - อันดับ 3) */}
                {room.winnersLeaderboard[2] && (
                  <div className="podium-step step-3 animate-slideUp">
                    <div className="podium-player">
                      <div className="podium-avatar">
                        <AvatarIcon id={room.winnersLeaderboard[2].avatar} size={45} />
                      </div>
                      <div className="podium-name">{room.winnersLeaderboard[2].name}</div>
                      <div className="podium-chips">${room.winnersLeaderboard[2].chips.toLocaleString()} ชิป</div>
                      <div className={`podium-net-profit ${room.winnersLeaderboard[2].netProfit >= 0 ? 'profit-plus' : 'profit-minus'}`}>
                        {room.winnersLeaderboard[2].netProfit >= 0 ? `+$${room.winnersLeaderboard[2].netProfit.toLocaleString()}` : `-$${Math.abs(room.winnersLeaderboard[2].netProfit).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="podium-pillar pillar-3">
                      <span className="place-num">3</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ตารางแสดงผู้ร่วมแข่งคนอื่นๆ เพิ่มเติม (อันดับ 4 ลงไป) */}
              {room.winnersLeaderboard.length > 3 && (
                <div className="other-rankings-container">
                  <h4>อันดับผู้เล่นอื่น:</h4>
                  <div className="other-rankings-list">
                    {room.winnersLeaderboard.slice(3).map((player, idx) => (
                      <div key={player.id} className="other-ranking-row">
                        <span className="rank-badge">#{idx + 4}</span>
                        <span className="rank-name">{player.name}</span>
                        <div className="rank-scores-block">
                          <span className="rank-chips">${player.chips.toLocaleString()} ชิป</span>
                          <span className={`rank-net ${player.netProfit >= 0 ? 'profit-plus' : 'profit-minus'}`}>
                            {player.netProfit >= 0 ? `+$${player.netProfit.toLocaleString()}` : `-$${Math.abs(player.netProfit).toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ceremony-actions">
                {isHost ? (
                  <button className="ceremony-btn restart-btn animate-pulse" onClick={handleResetTournament}>
                    🔄 เริ่มทัวร์นาเมนต์ใหม่ (Host Only)
                  </button>
                ) : (
                  <div className="waiting-host-restart">
                    <span className="loading-dots-text animate-pulse">⏳ รอกลุ่มโฮสต์กดสร้างรอบแข่งขันใหม่...</span>
                  </div>
                )}
                <button className="ceremony-btn leave-btn" onClick={onLeaveRoom}>
                  🚪 ออกจากห้อง (Leave Room)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameBoard;
