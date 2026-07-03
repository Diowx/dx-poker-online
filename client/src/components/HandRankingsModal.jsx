import React from 'react';

function HandRankingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const rankings = [
    {
      rank: 1,
      title: "Royal Flush (รอยัลฟลัช)",
      desc: "ไพ่ 10, J, Q, K, A เรียงกัน และต้องมีดอกเดียวกันทั้งหมด (ใหญ่ที่สุด)",
      cards: [
        { rank: 10, suit: 'H' },
        { rank: 11, suit: 'H' },
        { rank: 12, suit: 'H' },
        { rank: 13, suit: 'H' },
        { rank: 14, suit: 'H' }
      ]
    },
    {
      rank: 2,
      title: "Straight Flush (สเตรทฟลัช)",
      desc: "ไพ่เรียงลำดับกัน 5 ใบ และมีดอกเดียวกันทั้งหมด",
      cards: [
        { rank: 5, suit: 'S' },
        { rank: 6, suit: 'S' },
        { rank: 7, suit: 'S' },
        { rank: 8, suit: 'S' },
        { rank: 9, suit: 'S' }
      ]
    },
    {
      rank: 3,
      title: "Four of a Kind (โฟร์การ์ด / ตอง 4)",
      desc: "ไพ่แต้มเดียวกันทั้งหมด 4 ใบ",
      cards: [
        { rank: 9, suit: 'H' },
        { rank: 9, suit: 'D' },
        { rank: 9, suit: 'C' },
        { rank: 9, suit: 'S' },
        { rank: 14, suit: 'D' }
      ]
    },
    {
      rank: 4,
      title: "Full House (ฟูลเฮาส์ / เห่า)",
      desc: "ไพ่ตอง (แต้มเท่ากัน 3 ใบ) ร่วมกับไพ่คู่ (แต้มเท่ากัน 2 ใบ)",
      cards: [
        { rank: 13, suit: 'H' },
        { rank: 13, suit: 'D' },
        { rank: 13, suit: 'S' },
        { rank: 12, suit: 'C' },
        { rank: 12, suit: 'H' }
      ]
    },
    {
      rank: 5,
      title: "Flush (ฟลัช / สี)",
      desc: "ไพ่ที่มีดอกเดียวกันทั้งหมด 5 ใบ (ไม่จำเป็นต้องเรียงแต้ม)",
      cards: [
        { rank: 2, suit: 'D' },
        { rank: 5, suit: 'D' },
        { rank: 8, suit: 'D' },
        { rank: 11, suit: 'D' },
        { rank: 14, suit: 'D' }
      ]
    },
    {
      rank: 6,
      title: "Straight (สเตรท / เรียง)",
      desc: "ไพ่เรียงแต้มลำดับต่อกัน 5 ใบ คละดอกได้ (Ace ทำแต้มต่ำสุด A-2-3-4-5 หรือแต้มสูงสุด 10-J-Q-K-A ได้)",
      cards: [
        { rank: 4, suit: 'H' },
        { rank: 5, suit: 'D' },
        { rank: 6, suit: 'S' },
        { rank: 7, suit: 'C' },
        { rank: 8, suit: 'H' }
      ]
    },
    {
      rank: 7,
      title: "Three of a Kind (ตอง)",
      desc: "ไพ่แต้มเดียวกันทั้งหมด 3 ใบ",
      cards: [
        { rank: 7, suit: 'H' },
        { rank: 7, suit: 'D' },
        { rank: 7, suit: 'S' },
        { rank: 11, suit: 'C' },
        { rank: 2, suit: 'D' }
      ]
    },
    {
      rank: 8,
      title: "Two Pair (สองคู่)",
      desc: "ไพ่ที่มีคู่ 2 คู่ (เช่น คู่เอ และ คู่สิบ)",
      cards: [
        { rank: 14, suit: 'H' },
        { rank: 14, suit: 'D' },
        { rank: 10, suit: 'S' },
        { rank: 10, suit: 'C' },
        { rank: 5, suit: 'D' }
      ]
    },
    {
      rank: 9,
      title: "One Pair (หนึ่งคู่)",
      desc: "ไพ่ที่มีแต้มเท่ากัน 2 ใบ (มีคู่ 1 คู่)",
      cards: [
        { rank: 12, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 14, suit: 'S' },
        { rank: 8, suit: 'C' },
        { rank: 4, suit: 'D' }
      ]
    },
    {
      rank: 10,
      title: "High Card (ไพ่สูง)",
      desc: "ไพ่ที่ดีที่สุดที่ไม่มีเข้าชุดใดๆ วัดผู้ชนะด้วยไพ่ที่มีแต้มใหญ่ที่สุด (เล็กที่สุด)",
      cards: [
        { rank: 14, suit: 'S' },
        { rank: 13, suit: 'D' },
        { rank: 8, suit: 'H' },
        { rank: 5, suit: 'C' },
        { rank: 2, suit: 'S' }
      ]
    }
  ];

  const getSuitSymbol = (s) => {
    switch (s) {
      case 'H': return '♥';
      case 'D': return '♦';
      case 'C': return '♣';
      case 'S': return '♠';
      default: return '';
    }
  };

  const getRankStr = (r) => {
    if (r === 11) return 'J';
    if (r === 12) return 'Q';
    if (r === 13) return 'K';
    if (r === 14) return 'A';
    return r.toString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>คู่มือลำดับแต้มไพ่ (Poker Hand Rankings)</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body-scroll">
          <p className="modal-intro">
            เรียงลำดับจากหน้าไพ่ที่มีค่า **ใหญ่ที่สุด** ไปหาหน้าไพ่ที่ **เล็กที่สุด** ดังนี้:
          </p>

          <div className="rankings-list">
            {rankings.map((item) => (
              <div key={item.rank} className="ranking-item">
                <div className="ranking-num">{item.rank}</div>
                <div className="ranking-info">
                  <h4 className="ranking-title">{item.title}</h4>
                  <p className="ranking-desc">{item.desc}</p>
                </div>
                
                {/* Mini Cards Display */}
                <div className="mini-cards-row">
                  {item.cards.map((c, i) => {
                    const isRed = c.suit === 'H' || c.suit === 'D';
                    return (
                      <div key={i} className={`mini-card ${isRed ? 'red' : 'black'}`}>
                        <span className="mini-rank">{getRankStr(c.rank)}</span>
                        <span className="mini-suit">{getSuitSymbol(c.suit)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HandRankingsModal;
