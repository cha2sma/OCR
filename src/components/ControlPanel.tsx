import React, { useState } from 'react';
import type { RelayCurrents, RelaySettings } from '../logic/relayState';

interface ControlPanelProps {
  currents: RelayCurrents;
  settings: RelaySettings;
  debugOverlay: boolean;
  onCurrentsChange: (c: RelayCurrents) => void;
  onSettingsChange: (s: RelaySettings) => void;
  onSimulateFault: () => void;
  onClearFault: () => void;
  onToggleDebug: () => void;
}

function NumInput({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="cp-row">
      <label className="cp-label">{label}</label>
      <input
        className="cp-input"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
      />
      <span className="cp-unit">A</span>
    </div>
  );
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currents,
  settings,
  debugOverlay,
  onCurrentsChange,
  onSettingsChange,
  onSimulateFault,
  onClearFault,
  onToggleDebug,
}) => {
  const [localC, setLocalC] = useState<RelayCurrents>(currents);
  const [localS, setLocalS] = useState<RelaySettings>(settings);

  const applyCurrents = () => onCurrentsChange(localC);
  const applySettings = () => onSettingsChange(localS);

  const setC = (key: keyof RelayCurrents, v: number) =>
    setLocalC((prev) => ({ ...prev, [key]: v }));

  const setS = (key: keyof RelaySettings, v: number) =>
    setLocalS((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="control-panel">
      <h3 className="cp-title">Control Panel</h3>

      <section className="cp-section">
        <div className="cp-section-title">Current Input (A)</div>
        <NumInput label="IA" value={localC.ia} onChange={(v) => setC('ia', v)} />
        <NumInput label="IB" value={localC.ib} onChange={(v) => setC('ib', v)} />
        <NumInput label="IC" value={localC.ic} onChange={(v) => setC('ic', v)} />
        <NumInput label="IN" value={localC.in} onChange={(v) => setC('in', v)} />
        <button className="cp-btn cp-btn-apply" onClick={applyCurrents}>Apply Currents</button>
      </section>

      <section className="cp-section">
        <div className="cp-section-title">Pickup Settings (A)</div>
        <NumInput label="IOCR Pickup"  value={localS.iocrPickup}  onChange={(v) => setS('iocrPickup', v)}  min={0.1} max={20} step={0.1} />
        <NumInput label="TOCR Pickup"  value={localS.tocrPickup}  onChange={(v) => setS('tocrPickup', v)}  min={0.1} max={20} step={0.1} />
        <NumInput label="IOCGR Pickup" value={localS.iocgrPickup} onChange={(v) => setS('iocgrPickup', v)} min={0.1} max={10} step={0.1} />
        <NumInput label="TOCGR Pickup" value={localS.tocgrPickup} onChange={(v) => setS('tocgrPickup', v)} min={0.1} max={10} step={0.1} />
        <NumInput label="UBOCR Pickup" value={localS.ubocrPickup} onChange={(v) => setS('ubocrPickup', v)} min={0.1} max={10} step={0.01} />
        <button className="cp-btn cp-btn-apply" onClick={applySettings}>Apply Settings</button>
      </section>

      <section className="cp-section cp-section-actions">
        <button className="cp-btn cp-btn-fault" onClick={onSimulateFault}>Simulate Fault</button>
        <button className="cp-btn cp-btn-clear" onClick={onClearFault}>Clear Fault</button>
        <button
          className={`cp-btn cp-btn-debug ${debugOverlay ? 'cp-btn-debug-on' : ''}`}
          onClick={onToggleDebug}
        >
          Debug Overlay: {debugOverlay ? 'ON' : 'OFF'}
        </button>
      </section>
    </div>
  );
};

export default ControlPanel;
