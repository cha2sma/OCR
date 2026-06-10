import type { SettingMenuItem } from '../logic/relayState';

export const SETTING_MENU: SettingMenuItem[] = [
  {
    id: 'SYSTEM',
    label: 'SYSTEM',
    children: [],
  },
  {
    id: 'PROTECTION',
    label: 'PROTECTION',
    children: [
      { key: 'iocrPickup',  label: 'IOCR PICKUP',  min: 0.1, max: 20.0, step: 0.1,  unit: 'A' },
      { key: 'tocrPickup',  label: 'TOCR PICKUP',  min: 0.1, max: 20.0, step: 0.1,  unit: 'A' },
      { key: 'iocgrPickup', label: 'IOCGR PICKUP', min: 0.1, max: 10.0, step: 0.1,  unit: 'A' },
      { key: 'tocgrPickup', label: 'TOCGR PICKUP', min: 0.1, max: 10.0, step: 0.1,  unit: 'A' },
      { key: 'ubocrPickup', label: 'UBOCR PICKUP', min: 0.1, max: 10.0, step: 0.01, unit: 'A' },
    ],
  },
  {
    id: 'CONTACT_TEST',
    label: 'CONTACT TEST',
    children: [],
  },
];

export interface DisplayMenuNode {
  id: string;
  label: string;
  children?: DisplayMenuNode[];
}

export const DISPLAY_MENU: DisplayMenuNode[] = [
  {
    id: 'status',
    label: 'STATUS',
    children: [
      { id: 'contact-input',  label: 'CONTACT INPUT'  },
      { id: 'contact-output', label: 'CONTACT OUTPUT' },
      { id: 'self-diag',      label: 'SELF DIAG.'     },
      { id: 'protection',     label: 'PROTECTION'     },
      { id: 'rs485',          label: 'RS-485 MONITOR' },
    ],
  },
  {
    id: 'measure',
    label: 'MEASURE',
    children: [
      { id: 'phase-current',    label: 'PHASE CURRENT' },
      { id: 'sequence-current', label: 'SEQUENCE CURR' },
    ],
  },
  { id: 'event-record',    label: 'EVENT RECORD'    },
  { id: 'waveform-record', label: 'WAVEFORM RECORD' },
  { id: 'system-info',     label: 'SYSTEM INFO.'    },
];
