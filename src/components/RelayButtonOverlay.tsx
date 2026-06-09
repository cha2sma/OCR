import React from 'react';
import type { RelayButton } from '../logic/relayState';
import type { Rect } from '../data/relayLayout';

interface RelayButtonOverlayProps {
  name: RelayButton;
  rect: Rect;
  debug: boolean;
  onPress: (button: RelayButton) => void;
}

const RelayButtonOverlay: React.FC<RelayButtonOverlayProps> = ({ name, rect, debug, onPress }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    cursor: 'pointer',
    borderRadius: '4px',
    boxSizing: 'border-box',
    backgroundColor: debug
      ? 'rgba(30,100,255,0.25)'
      : pressed
      ? 'rgba(100,255,150,0.25)'
      : hovered
      ? 'rgba(100,255,150,0.12)'
      : 'transparent',
    border: debug ? '1.5px solid rgba(60,140,255,0.8)' : 'none',
    outline: 'none',
    transition: 'background-color 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: debug ? 'block' : 'none',
    fontSize: '9px',
    color: 'rgba(180,220,255,0.9)',
    fontFamily: 'monospace',
    pointerEvents: 'none',
    lineHeight: 1,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setPressed(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setPressed(false);
    onPress(name);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setPressed(false);
  };

  return (
    <div
      style={style}
      data-name={name}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <span style={labelStyle}>{name}</span>
    </div>
  );
};

export default RelayButtonOverlay;
