import React from 'react';

interface LedIndicatorProps {
  name: string;
  active: boolean;
  color: 'green' | 'red' | 'yellow';
  debug?: boolean;
}

const COLOR_MAP = {
  green:  { on: '#00ff44', off: '#003311', glow: '#00ff44' },
  red:    { on: '#ff2222', off: '#330000', glow: '#ff2222' },
  yellow: { on: '#ffdd00', off: '#332200', glow: '#ffdd00' },
};

const LedIndicator: React.FC<LedIndicatorProps> = ({ name, active, color, debug = false }) => {
  const c = COLOR_MAP[color];

  const style: React.CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: active ? c.on : c.off,
    boxShadow: active
      ? `0 0 5px 2px ${c.glow}, 0 0 2px ${c.glow}`
      : debug
      ? `0 0 0 2px rgba(255,255,0,0.6)`
      : `inset 0 1px 2px rgba(0,0,0,0.5)`,
    border: `1px solid ${active ? c.on : '#222'}`,
    transition: 'background-color 0.15s, box-shadow 0.15s',
    outline: debug ? '1.5px solid rgba(255,200,0,0.8)' : 'none',
  };

  return <div style={style} data-name={name} title={name} />;
};

export default LedIndicator;
