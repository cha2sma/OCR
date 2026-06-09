import React, { useState, useEffect, useRef } from 'react';

interface LcdDisplayProps {
  lines: string[];
  debug?: boolean;
  lastPressTime?: number;
}

const LINE_LENGTH = 20;

function padLine(s: string): string {
  return s.padEnd(LINE_LENGTH).slice(0, LINE_LENGTH);
}

const LcdDisplay: React.FC<LcdDisplayProps> = ({ lines, debug = false, lastPressTime = 0 }) => {
  const filled: string[] = [];
  for (let i = 0; i < 4; i++) {
    filled.push(padLine(lines[i] ?? ''));
  }

  const [bright, setBright] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastPressTime) return;
    setBright(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBright(false), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastPressTime]);

  const containerStyle: React.CSSProperties = {
    backgroundColor: debug
      ? 'rgba(0,200,100,0.35)'
      : bright ? '#162e16' : '#0d1f0d',
    border: debug ? '2px solid rgba(0,200,100,0.8)' : '1px solid #1a3a1a',
    borderRadius: '2px',
    padding: 0,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2px',
    overflow: 'hidden',
    boxShadow: debug ? 'none' : 'inset 0 0 8px rgba(0,80,0,0.6)',
    transition: 'background-color 0.4s ease',
  };

  const lineStyle: React.CSSProperties = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '11px',
    color: bright ? '#c0ffc0' : '#7fff7f',
    textShadow: bright
      ? '0 0 6px #7fff7f, 0 0 2px #bfffbf'
      : '0 0 4px #3fff3f, 0 0 1px #9fff9f',
    whiteSpace: 'pre',
    letterSpacing: '0.5px',
    lineHeight: '1.15',
    userSelect: 'none',
    transition: 'color 0.4s ease, text-shadow 0.4s ease',
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
