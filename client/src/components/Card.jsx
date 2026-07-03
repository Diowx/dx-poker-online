import React from 'react';

function Card({ rank, suit, hidden, dimmed, highlighted }) {
  const getSuitSymbol = (s) => {
    switch (s) {
      case 'H': return '♥';
      case 'D': return '♦';
      case 'C': return '♣';
      case 'S': return '♠';
      default: return '';
    }
  };

  const getSuitName = (s) => {
    switch (s) {
      case 'H': return 'hearts';
      case 'D': return 'diamonds';
      case 'C': return 'clubs';
      case 'S': return 'spades';
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

  const isRed = suit === 'H' || suit === 'D';

  if (hidden) {
    return (
      <div className={`poker-card back ${dimmed ? 'folded' : ''}`}>
        <div className="card-back-pattern">
          <div className="pattern-inner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`poker-card ${isRed ? 'red' : 'black'} ${dimmed ? 'folded' : ''} ${highlighted ? 'winner-card' : ''}`}>
      <div className="card-top-left">
        <span className="card-rank">{getRankStr(rank)}</span>
        <span className="card-suit">{getSuitSymbol(suit)}</span>
      </div>
      
      <div className="card-center-suit">
        {getSuitSymbol(suit)}
      </div>

      <div className="card-bottom-right">
        <span className="card-rank">{getRankStr(rank)}</span>
        <span className="card-suit">{getSuitSymbol(suit)}</span>
      </div>
    </div>
  );
}

export default Card;
