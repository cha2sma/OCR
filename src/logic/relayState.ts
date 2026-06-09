export type RelayMode =
  | 'NORMAL'
  | 'DISPLAY'
  | 'PASSWORD'
  | 'SETTING'
  | 'CONTACT_TEST';

export type DisplayPage =
  | 'STATUS'
  | 'MEASURE'
  | 'CONTACT_OUTPUT'
  | 'SELF_DIAGNOSIS';

export type RelayButton =
  | 'DIS'
  | 'SET'
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'ENT'
  | 'RESET';

export interface RelayCurrents {
  ia: number;
  ib: number;
  ic: number;
  in: number;
}

export interface RelaySettings {
  iocrPickup: number;
  tocrPickup: number;
  iocgrPickup: number;
  tocgrPickup: number;
  ubocrPickup: number;
}

export interface RelayLeds {
  pwr: boolean;
  run: boolean;
  err: boolean;
  pickup5051n: boolean;
  pickup50b46: boolean;
  tripInstA: boolean;
  tripInstB: boolean;
  tripInstC: boolean;
  tripInstN: boolean;
  tripTimedA: boolean;
  tripTimedB: boolean;
  tripTimedC: boolean;
  tripTimedN: boolean;
  trip50b: boolean;
  ubocr: boolean;
}

export interface RelayContacts {
  ts1: boolean;
  ts2: boolean;
  ts3: boolean;
  ts4: boolean;
  ts5: boolean;
  ts6: boolean;
  ts7: boolean;
  ts8: boolean;
  ts9: boolean;
  ts10: boolean;
  ts11: boolean;
}

export type SettingMenuId =
  | 'SYSTEM'
  | 'PROTECTION'
  | 'CONTACT_TEST';

export interface SettingMenuItem {
  id: SettingMenuId;
  label: string;
  children?: SettingLeafItem[];
}

export interface SettingLeafItem {
  key: keyof RelaySettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface RelayState {
  mode: RelayMode;
  displayPage: DisplayPage;
  lcdLines: string[];
  currents: RelayCurrents;
  settings: RelaySettings;
  leds: RelayLeds;
  contacts: RelayContacts;
  passwordInput: string;
  passwordCursor: number;
  selectedMenuIndex: number;
  selectedLeafIndex: number;
  editingLeaf: boolean;
  editingValue: number;
  activeMenuId: SettingMenuId | null;
  eventLog: string[];
  debugOverlay: boolean;
}
