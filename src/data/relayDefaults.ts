import type { RelayState, TsSetting, TsConType } from '../logic/relayState';

export const DEFAULT_PASSWORD = '0000';

export const relayInfo = {
  type:    'GD31-AB17',
  version: 'V2.01',
  appName: 'OCR SIMULATOR',
};

const EMPTY_CONTACTS = {
  ts1: false, ts2: false, ts3: false, ts4: false,
  ts5: false, ts6: false, ts7: false, ts8: false,
  ts9: false, ts10: false, ts11: false,
};

const DEFAULT_TS_CONS: TsConType[] = [
  'IOCR_A', 'IOCR_B', 'IOCR_C', 'IOCGR', 'UBOCR',
  'OFF', 'OFF', 'OFF', 'OFF', 'OFF', 'OFF',
];

function makeTsSettings(): TsSetting[] {
  return Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    con: DEFAULT_TS_CONS[i],
    rst: i < 5 ? 'Manual' : 'Self',
    dly: 0,
  }));
}

export function createDefaultRelayState(): RelayState {
  return {
    mode: 'NORMAL',
    displayNav: { menuPath: [], selectedIndex: 0, pageIndex: 0 },
    settingNav:  { menuPath: [], selectedIndex: 0, pageIndex: 0, editMode: false, editValue: 0 },
    lcdLines: [
      '   GD31-AB17        ',
      '  OCR SIMULATOR     ',
      ' STATUS : NORMAL    ',
      ' PRESS DIS/SET      ',
    ],
    currents: { ia: 0, ib: 0, ic: 0, in: 0 },
    settings: {
      iocrPickup:  5.0,
      tocrPickup:  1.0,
      iocgrPickup: 0.5,
      tocgrPickup: 0.5,
      ubocrPickup: 1.0,
    },
    leds: {
      pwr: true, run: true, err: false,
      pickup5051n: false, pickup50b46: false,
      tripInstA: false, tripInstB: false, tripInstC: false, tripInstN: false,
      tripTimedA: false, tripTimedB: false, tripTimedC: false, tripTimedN: false,
      trip50b: false, ubocr: false,
    },
    contacts: { ...EMPTY_CONTACTS },
    waveformRecords: [],
    passwordInput: '0000',
    passwordCursor: 0,
    systemSettings: {
      freq: '60Hz',
      pCtRat: 600,
      gCtRat: 200,
      rtc: '2026/06/11 00:00:00',
      waveformType: '150cycle',
      tpos: 50,
      tsrc: 'TRIP',
      slvAddr: 1,
      bps: 9600,
      protocol: 'ModBus',
      password: DEFAULT_PASSWORD,
    },
    tsSettings: makeTsSettings(),
    protectionSettings: {
      iocr:  { function: 'Enabled', mode: 'Inst',  pickup: 5.0, dtTime: 0.04, block: 'No' },
      tocr:  { function: 'Enabled', curve: 'NI',   pickup: 1.0, tDial: 1.00, dtTime: 0.04, block: 'No' },
      iocgr: { function: 'Enabled', mode: 'Inst',  pickup: 0.5, dtTime: 0.04, block: 'No' },
      tocgr: { function: 'Enabled', curve: 'NI',   pickup: 0.5, tDial: 1.00, dtTime: 0.04, block: 'No' },
      fiftyB:{ function: 'Enabled', mode: 'Inst',  pickup: 5.0, dtTime: 0.04, block: 'No' },
      ubocr: { function: 'Enabled', mode: '3I2',   pickup: 1.0, dtTime: 0.04, block: 'No' },
    },
    testContacts: { ...EMPTY_CONTACTS },
    panelTestMode: false,
    eventLog: ['System initialized'],
    debugOverlay: false,
  };
}
