import React from 'react';

interface LcdDisplayProps {
  lines: string[];
  debug?: boolean;
}

const LINE_LENGTH = 20;

function padLine(s: string): string {
  return s.padEnd(LINE_LENGTH).slice(0, LINE_LENGTH);
}

const LcdDisplay: React.FC<LcdDisplayProps> = ({ lines, debug = false }) => {
  const filled: string[] = [];
  for (let i = 0; i < 4; i++) {
    filled.push(padLine(lines[i] ?? ''));
  }

  const containerStyle: React.CSSProperties = {
    backgroundColor: debug ? 'rgba(0,200,100,0.35)' : '#0d1f0d',
    border: debug ? '2px solid rgba(0,200,100,0.8)' : '1px solid #1a3a1a',
    borderRadius: '2px',
    padding: 0,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    overflow: 'hidden',
    boxShadow: debug ? 'none' : 'inset 0 0 8px rgba(0,80,0,0.6)',
  };

  const lineStyle: React.CSSProperties = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '11px',
    color: '#7fff7f',
    textShadow: '0 0 4px #3fff3f, 0 0 1px #9fff9f',
    whiteSpace: 'pre',
    letterSpacing: '0.5px',
    lineHeight: '1.15',
    userSelect: 'none',
    paddingLeft: '3px',
  };

  return (
    <div style={containerStyle} data-name="LCD">
      {filled.map((line, i) => (
        <div key={i} style={lineStyle}>{line}</div>
      ))}
    </div>
  );
};

export default LcdDisplay;
