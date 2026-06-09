import React, { useReducer, useCallback } from 'react';
import RelayPanel from './RelayPanel';
import ControlPanel from './ControlPanel';
import EventLog from './EventLog';
import type { RelayState, RelayButton, RelayCurrents, RelaySettings } from '../logic/relayState';
import {
  createInitialRelayState,
  handleRelayButton,
  updateCurrents,
  updateSettings,
  simulateFault,
  clearFault,
} from '../logic/relayEngine';

type Action =
  | { type: 'BUTTON'; button: RelayButton }
  | { type: 'UPDATE_CURRENTS'; currents: RelayCurrents }
  | { type: 'UPDATE_SETTINGS'; settings: RelaySettings }
  | { type: 'SIMULATE_FAULT' }
  | { type: 'CLEAR_FAULT' }
  | { type: 'TOGGLE_DEBUG' };

function relayReducer(state: RelayState, action: Action): RelayState {
  switch (action.type) {
    case 'BUTTON':
      return handleRelayButton(state, action.button);
    case 'UPDATE_CURRENTS':
      return updateCurrents(state, action.currents);
    case 'UPDATE_SETTINGS':
      return updateSettings(state, action.settings);
    case 'SIMULATE_FAULT':
      return simulateFault(state);
    case 'CLEAR_FAULT':
      return clearFault(state);
    case 'TOGGLE_DEBUG':
      return { ...state, debugOverlay: !state.debugOverlay };
    default:
      return state;
  }
}

const RelaySimulator: React.FC = () => {
  const [state, dispatch] = useReducer(relayReducer, undefined, createInitialRelayState);

  const handleButton = useCallback((button: RelayButton) => {
    dispatch({ type: 'BUTTON', button });
  }, []);

  const handleCurrentsChange = useCallback((currents: RelayCurrents) => {
    dispatch({ type: 'UPDATE_CURRENTS', currents });
  }, []);

  const handleSettingsChange = useCallback((settings: RelaySettings) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  }, []);

  const handleSimulateFault = useCallback(() => {
    dispatch({ type: 'SIMULATE_FAULT' });
  }, []);

  const handleClearFault = useCallback(() => {
    dispatch({ type: 'CLEAR_FAULT' });
  }, []);

  const handleToggleDebug = useCallback(() => {
    dispatch({ type: 'TOGGLE_DEBUG' });
  }, []);

  return (
    <div className="simulator-root">
      <header className="simulator-header">
        <h1 className="simulator-title">GD31-AB17 OCR Simulator</h1>
        <span className="simulator-subtitle">Educational / Pre-check Tool — Does not replace actual relay operation</span>
      </header>

      <div className="simulator-body">
        <div className="simulator-panel-area">
          <RelayPanel state={state} onButtonPress={handleButton} />
        </div>

        <div className="simulator-right">
          <ControlPanel
            currents={state.currents}
            settings={state.settings}
            debugOverlay={state.debugOverlay}
            onCurrentsChange={handleCurrentsChange}
            onSettingsChange={handleSettingsChange}
            onSimulateFault={handleSimulateFault}
            onClearFault={handleClearFault}
            onToggleDebug={handleToggleDebug}
          />
          <EventLog logs={state.eventLog} />
        </div>
      </div>
    </div>
  );
};

export default RelaySimulator;
