// ─── Display menu ───────────────────────────────────────────────────────────

export interface DisplayMenuNode { id: string; label: string; children?: DisplayMenuNode[]; }

export const DISPLAY_MENU: DisplayMenuNode[] = [
  { id: 'status', label: 'STATUS', children: [
    { id: 'contact-input',  label: 'CONTACT INPUT'  },
    { id: 'contact-output', label: 'CONTACT OUTPUT' },
    { id: 'self-diag',      label: 'SELF DIAG.'     },
    { id: 'protection',     label: 'PROTECTION'     },
    { id: 'rs485',          label: 'RS-485 MONITOR' },
  ]},
  { id: 'measure', label: 'MEASURE', children: [
    { id: 'phase-current',    label: 'PHASE CURRENT' },
    { id: 'sequence-current', label: 'SEQUENCE CURR' },
  ]},
  { id: 'event-record',    label: 'EVENT RECORD'    },
  { id: 'waveform-record', label: 'WAVEFORM RECORD' },
  { id: 'system-info',     label: 'SYSTEM INFO.'    },
];

// ─── Setting menu ────────────────────────────────────────────────────────────

export interface SettingMenuNode { id: string; label: string; children?: SettingMenuNode[]; }

export const SETTING_MENU_TREE: SettingMenuNode[] = [
  { id: 'system', label: 'SYSTEM', children: [
    { id: 'power-system', label: 'POWER SYSTEM' },
    { id: 'ts',           label: 'T/S'          },
    { id: 'rtc',          label: 'RTC'          },
    { id: 'waveform-set', label: 'WAVEFORM REC' },
    { id: 'com',          label: 'COM'          },
    { id: 'password',     label: 'PASSWORD'     },
  ]},
  { id: 'protection', label: 'PROTECTION', children: [
    { id: 'iocr',  label: 'IOCR'      },
    { id: 'tocr',  label: 'TOCR'      },
    { id: 'iocgr', label: 'IOCGR'     },
    { id: 'tocgr', label: 'TOCGR'     },
    { id: '50b',   label: '50B(OLTC)' },
    { id: 'ubocr', label: 'UBOCR'     },
  ]},
  { id: 'command', label: 'COMMAND', children: [
    { id: 'event-clear',    label: 'EVENT CLEAR'   },
    { id: 'waveform-clear', label: 'WAVEFORM CLEAR'},
    { id: 'contact-test',   label: 'CONTACT TEST'  },
    { id: 'panel-test',     label: 'PANEL TEST'    },
    { id: 'recl',           label: 'RECL. SEQUENCE'},
  ]},
];
