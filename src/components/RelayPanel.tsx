import React from 'react';
import LcdDisplay from './LcdDisplay';
import LedIndicator from './LedIndicator';
import RelayButtonOverlay from './RelayButtonOverlay';
import { relayLayout } from '../data/relayLayout';
import type { RelayState, RelayButton } from '../logic/relayState';
import relayImage from '../assets/gd31-ab17.svg';

interface RelayPanelProps {
  state: RelayState;
  onButtonPress: (button: RelayButton) => void;
  lastPressTime: number;
}

const LED_CONFIG: { key: keyof RelayState['leds']; name: string; color: 'green' | 'red' | 'yellow' }[] = [
  { key: 'pwr',         name: 'PWR',           color: 'green'  },
  { key: 'run',         name: 'RUN',           color: 'green'  },
  { key: 'err',         name: 'ERR',           color: 'red'    },
  { key: 'pickup5051n', name: 'PICKUP_50_51_N',color: 'yellow' },
  { key: 'pickup50b46', name: 'PICKUP_50B_46', color: 'yellow' },
  { key: 'tripInstA',   name: 'TRIP_INST_A',   color: 'red'    },
  { key: 'tripInstB',   name: 'TRIP_INST_B',   color: 'red'    },
  { key: 'tripInstC',   name: 'TRIP_INST_C',   color: 'red'    },
  { key: 'tripInstN',   name: 'TRIP_INST_N',   color: 'red'    },
  { key: 'tripTimedA',  name: 'TRIP_TIMED_A',  color: 'red'    },
  { key: 'tripTimedB',  name: 'TRIP_TIMED_B',  color: 'red'    },
  { key: 'tripTimedC',  name: 'TRIP_TIMED_C',  color: 'red'    },
  { key: 'tripTimedN',  name: 'TRIP_TIMED_N',  color: 'red'    },
  { key: 'trip50b',     name: 'TRIP_50B',      color: 'red'    },
  { key: 'ubocr',       name: 'UBOCR',         color: 'yellow' },
];

const BUTTON_KEYS: RelayButton[] = ['DIS', 'SET', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'ENT', 'RESET'];

const RelayPanel: React.FC<RelayPanelProps> = ({ state, onButtonPress, lastPressTime }) => {
  const { panelWidth, lcd, buttons, leds } = relayLayout;
  const { lcdLines, leds: ledState, debugOverlay } = state;

  const panelStyle: React.CSSProperties = {
    position: 'relative',
    width: panelWidth,
    display: 'inline-block',
    flexShrink: 0,
  };

  const imageStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: 'auto',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  const lcdOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    left: lcd.left,
    top: lcd.top,
    width: lcd.width,
    height: lcd.height,
  };

  return (
    <div style={panelStyle}>
      <img src={relayImage} alt="GD31-AB17 Relay" style={imageStyle} draggable={false} />

      {/* LCD overlay */}
      <div style={lcdOverlayStyle} data-name="LCD-AREA">
        <LcdDisplay lines={lcdLines} debug={debugOverlay} lastPressTime={lastPressTime} />
      </div>

      {/* LED overlays */}
      {LED_CONFIG.map(({ key, name, color }) => {
        const pos = leds[name as keyof typeof leds];
        if (!pos) return null;
        return (
          <div
            key={name}
            style={{
              position: 'absolute',
              left: pos.left - 5,
              top: pos.top - 5,
              width: 10,
              height: 10,
            }}
          >
            <LedIndicator
              name={name}
              active={ledState[key] as boolean}
              color={color}
              debug={debugOverlay}
            />
          </div>
        );
      })}

      {/* Button overlays */}
      {BUTTON_KEYS.map((btnName) => {
        const rect = buttons[btnName];
        if (!rect) return null;
        return (
          <RelayButtonOverlay
            key={btnName}
            name={btnName}
            rect={rect}
            debug={debugOverlay}
            onPress={onButtonPress}
          />
        );
      })}
    </div>
  );
};

export default RelayPanel;
