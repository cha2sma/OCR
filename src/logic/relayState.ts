export type RelayMode =
  | 'NORMAL'
  | 'DISPLAY'
  | 'PASSWORD'
  | 'SETTING'
  | 'CONTACT_TEST';

export type RelayButton =
  | 'DIS' | 'SET' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ENT' | 'RESET';

export interface RelayCurrents { ia: number; ib: number; ic: number; in: number; }

export interface RelaySettings {
  iocrPickup:  number;
  tocrPickup:  number;
  iocgrPickup: number;
  tocgrPickup: number;
  ubocrPickup: number;
}

export interface RelayLeds {
  pwr: boolean; run: boolean; err: boolean;
  pickup5051n: boolean; pickup50b46: boolean;
  tripInstA: boolean; tripInstB: boolean; tripInstC: boolean; tripInstN: boolean;
  tripTimedA: boolean; tripTimedB: boolean; tripTimedC: boolean; tripTimedN: boolean;
  trip50b: boolean; ubocr: boolean;
}

export interface RelayContacts {
  ts1: boolean; ts2: boolean; ts3: boolean; ts4: boolean;
  ts5: boolean; ts6: boolean; ts7: boolean; ts8: boolean;
  ts9: boolean; ts10: boolean; ts11: boolean;
}

export interface WaveformRecord { id: number; label: string; createdAt: string; }

export interface RelayDisplayNavigation {
  menuPath: string[]; selectedIndex: number; pageIndex: number;
}

// ─── Setting types ──────────────────────────────────────────────────────────

export type CurveType = 'NI' | 'VI' | 'EI' | 'LI' | 'DT' | 'KNI' | 'KDNI' | 'KVI';
export type TsConType =
  'OFF' | 'PROT_OR' | 'IOCR_OR' | 'IOCR_A' | 'IOCR_B' | 'IOCR_C' |
  'TOCR_OR' | 'TOCR_A' | 'TOCR_B' | 'TOCR_C' | 'IOCGR' | 'TOCGR' |
  'OCR_A_OR' | 'OCR_B_OR' | 'OCR_C_OR' | 'IOCR+TOCR' | 'IOCR+IOCGR' |
  'IOCR+TOCGR' | 'TOCR+IOCGR' | 'TOCR+TOCGR' | 'IOCGR+TOCGR' |
  '50B_OR' | '50B_A' | '50B_B' | '50B_C' | 'UBOCR';

export interface SystemSettings {
  freq: '50Hz' | '60Hz';
  pCtRat: number;
  gCtRat: number;
  rtc: string;
  waveformType: '150cycle' | '300cycle';
  tpos: number;
  tsrc: 'PKP' | 'TRIP' | 'PKP+TRIP' | 'EXT_L_H' | 'EXT_H_L' | 'TRIP+EXT';
  slvAddr: number;
  bps: 9600 | 19200 | 38400;
  protocol: 'ModBus';
  password: string;
}

export interface TsSetting { id: number; con: TsConType; rst: 'Self' | 'Manual'; dly: number; }

export interface IocrProtSettings {
  function: 'Enabled' | 'Disabled'; mode: 'Inst' | 'DT';
  pickup: number; dtTime: number; block: 'Yes' | 'No';
}
export interface TocrProtSettings {
  function: 'Enabled' | 'Disabled'; curve: CurveType;
  pickup: number; tDial: number; dtTime: number; block: 'Yes' | 'No';
}
export interface IocgrProtSettings {
  function: 'Enabled' | 'Disabled'; mode: 'Inst' | 'DT';
  pickup: number; dtTime: number; block: 'Yes' | 'No';
}
export interface TocgrProtSettings {
  function: 'Enabled' | 'Disabled'; curve: CurveType;
  pickup: number; tDial: number; dtTime: number; block: 'Yes' | 'No';
}
export interface FiftyBProtSettings {
  function: 'Enabled' | 'Disabled'; mode: 'Inst' | 'DT';
  pickup: number; dtTime: number; block: 'Yes' | 'No';
}
export interface UbocrProtSettings {
  function: 'Enabled' | 'Disabled'; mode: '3I0' | '3I2';
  pickup: number; dtTime: number; block: 'Yes' | 'No';
}
export interface ProtectionSettings {
  iocr: IocrProtSettings; tocr: TocrProtSettings;
  iocgr: IocgrProtSettings; tocgr: TocgrProtSettings;
  fiftyB: FiftyBProtSettings; ubocr: UbocrProtSettings;
}

export interface RelaySettingNavigation {
  menuPath: string[];
  selectedIndex: number;
  pageIndex: number;
  editMode: boolean;
  editValue: number;
}

// ─── Draft / save-confirm ───────────────────────────────────────────────────

export type ConfirmChoice = 'YES' | 'NO';

export interface SettingDraft {
  systemSettings:     SystemSettings;
  tsSettings:         TsSetting[];
  protectionSettings: ProtectionSettings;
}

export interface SaveConfirmState {
  active:      boolean;
  choice:      ConfirmChoice;
  pendingPath: string[];
}

// ─── Root state ─────────────────────────────────────────────────────────────

export interface RelayState {
  mode:               RelayMode;
  displayNav:         RelayDisplayNavigation;
  settingNav:         RelaySettingNavigation;
  passwordInput:      string;
  passwordCursor:     number;
  lcdLines:           string[];
  currents:           RelayCurrents;
  settings:           RelaySettings;
  leds:               RelayLeds;
  contacts:           RelayContacts;
  waveformRecords:    WaveformRecord[];
  systemSettings:     SystemSettings;
  tsSettings:         TsSetting[];
  protectionSettings: ProtectionSettings;
  testContacts:             RelayContacts;
  panelTestMode:            boolean;
  settingDraft:             SettingDraft;
  hasUnsavedSettingChanges: boolean;
  saveConfirm:              SaveConfirmState;
  eventLog:                 string[];
  debugOverlay:             boolean;
}
