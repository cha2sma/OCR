import type { RelayState } from '../logic/relayState';

export const DEFAULT_PASSWORD = '0000';

export const DISPLAY_PAGES = ['STATUS', 'MEASURE', 'CONTACT_OUTPUT', 'SELF_DIAGNOSIS'] as const;

export function createDefaultRelayState(): RelayState {
  return {
    mode: 'NORMAL',
    displayPage: 'STATUS',
    lcdLines: [
      '   GD31-AB17        ',
      '  OCR SIMULATOR     ',
      ' STATUS : NORMAL    ',
      ' PRESS DIS/SET      ',
    ],
    currents: { ia: 0, ib: 0, ic: 0, in: 0 },
    settings: {
      iocrPickup:  5.0,
      tocrPickup:  5.0,
      iocgrPickup: 1.0,
      tocgrPickup: 1.0,
      ubocrPickup: 0.5,
    },
    leds: {
      pwr:          true,
      run:          true,
      err:          false,
      pickup5051n:  false,
      pickup50b46:  false,
      tripInstA:    false,
      tripInstB:    false,
      tripInstC:    false,
      tripInstN:    false,
      tripTimedA:   false,
      tripTimedB:   false,
      tripTimedC:   false,
      tripTimedN:   false,
      trip50b:      false,
      ubocr:        false,
    },
    contacts: {
      ts1: false, ts2: false, ts3: false, ts4: false,
      ts5: false, ts6: false, ts7: false, ts8: false,
      ts9: false, ts10: false, ts11: false,
    },
    passwordInput: '0000',
    passwordCursor: 0,
    selectedMenuIndex: 0,
    selectedLeafIndex: 0,
    editingLeaf: false,
    editingValue: 0,
    activeMenuId: null,
    eventLog: ['System initialized'],
    debugOverlay: false,
  };
}
