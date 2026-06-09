import type {
  RelayState,
  RelayButton,
  RelayCurrents,
  RelaySettings,
  DisplayPage,
  SettingMenuId,
} from './relayState';
import { createDefaultRelayState, DEFAULT_PASSWORD, DISPLAY_PAGES } from '../data/relayDefaults';
import { SETTING_MENU } from '../data/menuTree';

export function createInitialRelayState(): RelayState {
  return createDefaultRelayState();
}

function addLog(state: RelayState, message: string): RelayState {
  return {
    ...state,
    eventLog: [message, ...state.eventLog].slice(0, 100),
  };
}

function pad20(s: string): string {
  return s.padEnd(20).slice(0, 20);
}

export function generateLcdLines(state: RelayState): string[] {
  const { mode, displayPage, currents, settings, leds, contacts, passwordInput, passwordCursor, selectedMenuIndex, selectedLeafIndex, editingLeaf, editingValue, activeMenuId } = state;

  if (mode === 'NORMAL') {
    return [
      pad20('   GD31-AB17'),
      pad20('  OCR SIMULATOR'),
      pad20(' STATUS : NORMAL'),
      pad20(' PRESS DIS/SET'),
    ];
  }

  if (mode === 'PASSWORD') {
    const display = passwordInput.split('').map((d, i) => (i === passwordCursor ? `[${d}]` : ` ${d} `)).join('');
    const cursor = '     '.slice(0, 6 + passwordCursor * 3) + '^';
    return [
      pad20('PASSWORD'),
      pad20(`INPUT :${display}`),
      pad20(cursor),
      pad20('ENT TO CONFIRM'),
    ];
  }

  if (mode === 'SETTING') {
    if (activeMenuId === null) {
      const lines: string[] = [pad20('SETTING MENU')];
      SETTING_MENU.forEach((item, i) => {
        const prefix = i === selectedMenuIndex ? '>' : ' ';
        lines.push(pad20(`${prefix} ${item.label}`));
      });
      while (lines.length < 4) lines.push(pad20(''));
      return lines.slice(0, 4);
    }

    const menu = SETTING_MENU.find(m => m.id === activeMenuId);
    if (!menu || !menu.children || menu.children.length === 0) {
      return [
        pad20(`${menu?.label ?? activeMenuId}`),
        pad20(' (NO ITEMS)'),
        pad20(''),
        pad20('LEFT: BACK'),
      ];
    }

    if (editingLeaf) {
      const leaf = menu.children[selectedLeafIndex];
      return [
        pad20(leaf.label),
        pad20(`VALUE: ${editingValue.toFixed(2)}${leaf.unit}`),
        pad20('UP/DOWN: CHANGE'),
        pad20('ENT:SAVE LEFT:CANCEL'),
      ];
    }

    const lines: string[] = [pad20(menu.label)];
    menu.children.forEach((leaf, i) => {
      const prefix = i === selectedLeafIndex ? '>' : ' ';
      const val = (settings[leaf.key] as number).toFixed(2);
      lines.push(pad20(`${prefix}${leaf.label}:${val}${leaf.unit}`));
    });
    while (lines.length < 4) lines.push(pad20(''));
    return lines.slice(0, 4);
  }

  if (mode === 'DISPLAY') {
    if (displayPage === 'STATUS') {
      const tripOn = leds.tripInstA || leds.tripInstB || leds.tripInstC || leds.tripInstN || leds.tripTimedA || leds.tripTimedB || leds.tripTimedC || leds.tripTimedN;
      const pickupOn = leds.pickup5051n || leds.pickup50b46;
      return [
        pad20('STATUS'),
        pad20(`PWR:ON  RUN:${leds.run ? 'ON' : 'OFF'}`),
        pad20(`ERR:${leds.err ? 'ON' : 'OFF'}  TRIP:${tripOn ? 'ON' : 'OFF'}`),
        pad20(`PICKUP:${pickupOn ? 'ON' : 'OFF'}`),
      ];
    }

    if (displayPage === 'MEASURE') {
      return [
        pad20('MEASURE CURRENT'),
        pad20(`IA:${currents.ia.toFixed(2)}A IB:${currents.ib.toFixed(2)}`),
        pad20(`IC:${currents.ic.toFixed(2)}A IN:${currents.in.toFixed(2)}`),
        pad20('ANGLE A REF'),
      ];
    }

    if (displayPage === 'CONTACT_OUTPUT') {
      return [
        pad20('CONTACT OUTPUT'),
        pad20(`T/S1:${contacts.ts1 ? 'ON' : 'OFF'} T/S2:${contacts.ts2 ? 'ON' : 'OFF'}`),
        pad20(`T/S3:${contacts.ts3 ? 'ON' : 'OFF'} T/S4:${contacts.ts4 ? 'ON' : 'OFF'}`),
        pad20(`T/S5:${contacts.ts5 ? 'ON' : 'OFF'}`),
      ];
    }

    if (displayPage === 'SELF_DIAGNOSIS') {
      return [
        pad20('SELF DIAGNOSIS'),
        pad20('CPU:OK MEMORY:OK'),
        pad20('ADC:OK CONTACT:OK'),
        pad20(`ERROR: ${leds.err ? 'DETECTED' : 'NONE'}`),
      ];
    }
  }

  if (mode === 'CONTACT_TEST') {
    return [
      pad20('CONTACT TEST'),
      pad20('NOT IMPLEMENTED'),
      pad20(''),
      pad20('LEFT: BACK'),
    ];
  }

  return [pad20(''), pad20(''), pad20(''), pad20('')];
}

export function evaluateProtection(state: RelayState): RelayState {
  const { currents, settings } = state;
  const { ia, ib, ic } = currents;

  const phasePickup = ia >= settings.iocrPickup || ib >= settings.iocrPickup || ic >= settings.iocrPickup;
  const nPickup = currents.in >= settings.iocgrPickup;

  const vals = [ia, ib, ic];
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const ubocrActive = max - min >= settings.ubocrPickup;

  const newLeds = {
    ...state.leds,
    pickup5051n: phasePickup || nPickup,
    pickup50b46: false,
    ubocr: ubocrActive,
  };

  let newState = { ...state, leds: newLeds };
  newState = { ...newState, lcdLines: generateLcdLines(newState) };
  return newState;
}

export function simulateFault(state: RelayState): RelayState {
  const { currents, settings } = state;
  const { ia, ib, ic } = currents;
  const inp = currents.in;

  const tripA = ia >= settings.iocrPickup;
  const tripB = ib >= settings.iocrPickup;
  const tripC = ic >= settings.iocrPickup;
  const tripN = inp >= settings.iocgrPickup;

  const ts5 = state.leds.trip50b || state.leds.ubocr;

  let next: RelayState = { ...state };
  const logs: string[] = [];

  if (tripA || tripB || tripC) {
    logs.push('Phase overcurrent detected');
    if (tripA) logs.push('A phase INST trip');
    if (tripB) logs.push('B phase INST trip');
    if (tripC) logs.push('C phase INST trip');
  }
  if (tripN) logs.push('N phase INST trip');
  if (!tripA && !tripB && !tripC && !tripN) logs.push('Simulate fault executed (no pickup)');

  const newLeds = {
    ...state.leds,
    tripInstA: tripA,
    tripInstB: tripB,
    tripInstC: tripC,
    tripInstN: tripN,
  };

  const newContacts = {
    ...state.contacts,
    ts1: tripA,
    ts2: tripB,
    ts3: tripC,
    ts4: tripN,
    ts5,
  };

  next = { ...next, leds: newLeds, contacts: newContacts };
  next = evaluateProtection(next);
  for (const log of logs) {
    next = addLog(next, log);
  }
  next = { ...next, lcdLines: generateLcdLines(next) };
  return next;
}

export function clearFault(state: RelayState): RelayState {
  const clearedLeds = {
    ...state.leds,
    pickup5051n: false,
    pickup50b46: false,
    tripInstA: false,
    tripInstB: false,
    tripInstC: false,
    tripInstN: false,
    tripTimedA: false,
    tripTimedB: false,
    tripTimedC: false,
    tripTimedN: false,
    trip50b: false,
    ubocr: false,
  };
  const clearedContacts = {
    ...state.contacts,
    ts1: false, ts2: false, ts3: false, ts4: false, ts5: false,
  };
  let next: RelayState = { ...state, leds: clearedLeds, contacts: clearedContacts };
  next = addLog(next, 'Clear fault executed');
  next = { ...next, lcdLines: generateLcdLines(next) };
  return next;
}

export function updateCurrents(state: RelayState, currents: RelayCurrents): RelayState {
  let next = { ...state, currents };
  next = evaluateProtection(next);
  next = { ...next, lcdLines: generateLcdLines(next) };
  return next;
}

export function updateSettings(state: RelayState, settings: RelaySettings): RelayState {
  let next = { ...state, settings };
  next = evaluateProtection(next);
  next = { ...next, lcdLines: generateLcdLines(next) };
  return next;
}

function nextDisplayPage(current: DisplayPage): DisplayPage {
  const idx = DISPLAY_PAGES.indexOf(current);
  return DISPLAY_PAGES[(idx + 1) % DISPLAY_PAGES.length];
}

function handlePasswordInput(state: RelayState, button: RelayButton): RelayState {
  const digits = state.passwordInput.split('');
  const cursor = state.passwordCursor;

  if (button === 'UP') {
    const d = (parseInt(digits[cursor]) + 1) % 10;
    digits[cursor] = String(d);
    let next = { ...state, passwordInput: digits.join('') };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'DOWN') {
    const d = (parseInt(digits[cursor]) + 9) % 10;
    digits[cursor] = String(d);
    let next = { ...state, passwordInput: digits.join('') };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'RIGHT') {
    const newCursor = Math.min(cursor + 1, 3);
    let next = { ...state, passwordCursor: newCursor };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'LEFT') {
    const newCursor = Math.max(cursor - 1, 0);
    let next = { ...state, passwordCursor: newCursor };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'ENT') {
    if (state.passwordInput === DEFAULT_PASSWORD) {
      let next: RelayState = {
        ...state,
        mode: 'SETTING',
        activeMenuId: null,
        selectedMenuIndex: 0,
        selectedLeafIndex: 0,
        editingLeaf: false,
        passwordInput: '0000',
        passwordCursor: 0,
      };
      next = addLog(next, 'Password accepted');
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    } else {
      let next: RelayState = {
        ...state,
        lcdLines: [
          pad20('PASSWORD ERROR'),
          pad20('WRONG PASSWORD'),
          pad20('TRY AGAIN'),
          pad20('ENT TO CONFIRM'),
        ],
      };
      next = addLog(next, 'Password error');
      return next;
    }
  }
  if (button === 'RESET') {
    let next: RelayState = { ...state, mode: 'NORMAL', passwordInput: '0000', passwordCursor: 0 };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  return state;
}

function handleSettingInput(state: RelayState, button: RelayButton): RelayState {
  const { activeMenuId, selectedMenuIndex, selectedLeafIndex, editingLeaf, editingValue } = state;

  if (activeMenuId === null) {
    if (button === 'UP') {
      const idx = Math.max(selectedMenuIndex - 1, 0);
      let next = { ...state, selectedMenuIndex: idx };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    if (button === 'DOWN') {
      const idx = Math.min(selectedMenuIndex + 1, SETTING_MENU.length - 1);
      let next = { ...state, selectedMenuIndex: idx };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    if (button === 'ENT' || button === 'RIGHT') {
      const menu = SETTING_MENU[selectedMenuIndex];
      if (menu.id === 'CONTACT_TEST') {
        let next: RelayState = { ...state, mode: 'CONTACT_TEST', activeMenuId: menu.id };
        next = { ...next, lcdLines: generateLcdLines(next) };
        return next;
      }
      let next: RelayState = { ...state, activeMenuId: menu.id as SettingMenuId, selectedLeafIndex: 0, editingLeaf: false };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    if (button === 'LEFT' || button === 'RESET') {
      let next: RelayState = { ...state, mode: 'NORMAL', activeMenuId: null };
      next = addLog(next, 'Exited SETTING menu');
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    return state;
  }

  const menu = SETTING_MENU.find(m => m.id === activeMenuId);
  if (!menu || !menu.children || menu.children.length === 0) {
    if (button === 'LEFT' || button === 'RESET') {
      let next: RelayState = { ...state, activeMenuId: null };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    return state;
  }

  if (editingLeaf) {
    const leaf = menu.children[selectedLeafIndex];
    if (button === 'UP') {
      const val = Math.min(+(editingValue + leaf.step).toFixed(3), leaf.max);
      let next = { ...state, editingValue: val };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    if (button === 'DOWN') {
      const val = Math.max(+(editingValue - leaf.step).toFixed(3), leaf.min);
      let next = { ...state, editingValue: val };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    if (button === 'ENT') {
      const newSettings = { ...state.settings, [leaf.key]: editingValue };
      let next: RelayState = { ...state, settings: newSettings, editingLeaf: false };
      next = addLog(next, `${leaf.label} set to ${editingValue.toFixed(2)}${leaf.unit}`);
      next = evaluateProtection(next);
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    if (button === 'LEFT') {
      let next: RelayState = { ...state, editingLeaf: false };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
    return state;
  }

  if (button === 'UP') {
    const idx = Math.max(selectedLeafIndex - 1, 0);
    let next = { ...state, selectedLeafIndex: idx };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'DOWN') {
    const idx = Math.min(selectedLeafIndex + 1, menu.children.length - 1);
    let next = { ...state, selectedLeafIndex: idx };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'ENT' || button === 'RIGHT') {
    const leaf = menu.children[selectedLeafIndex];
    let next: RelayState = {
      ...state,
      editingLeaf: true,
      editingValue: state.settings[leaf.key] as number,
    };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'LEFT') {
    let next: RelayState = { ...state, activeMenuId: null, selectedLeafIndex: 0, editingLeaf: false };
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  if (button === 'RESET') {
    let next: RelayState = { ...state, mode: 'NORMAL', activeMenuId: null, editingLeaf: false };
    next = addLog(next, 'Exited SETTING menu');
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }
  return state;
}

export function handleRelayButton(state: RelayState, button: RelayButton): RelayState {
  let next = addLog(state, `${button} pressed`);

  if (button === 'DIS') {
    if (next.mode === 'DISPLAY') {
      const newPage = nextDisplayPage(next.displayPage);
      next = { ...next, displayPage: newPage };
    } else {
      next = { ...next, mode: 'DISPLAY', displayPage: 'STATUS' };
    }
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }

  if (button === 'SET') {
    if (next.mode === 'NORMAL' || next.mode === 'DISPLAY') {
      next = { ...next, mode: 'PASSWORD', passwordInput: '0000', passwordCursor: 0 };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
  }

  if (button === 'RESET') {
    const hasLatch =
      next.leds.tripInstA || next.leds.tripInstB || next.leds.tripInstC || next.leds.tripInstN ||
      next.leds.tripTimedA || next.leds.tripTimedB || next.leds.tripTimedC || next.leds.tripTimedN ||
      next.leds.pickup5051n || next.leds.pickup50b46 || next.leds.ubocr;

    if (hasLatch) {
      next = clearFault(next);
      next = addLog(next, 'Reset executed - latch cleared');
    } else {
      next = { ...next, mode: 'DISPLAY', displayPage: 'STATUS' };
      next = addLog(next, 'Reset executed - status display');
    }
    next = { ...next, lcdLines: generateLcdLines(next) };
    return next;
  }

  if (next.mode === 'PASSWORD') {
    return handlePasswordInput(next, button);
  }

  if (next.mode === 'SETTING' || next.mode === 'CONTACT_TEST') {
    if (next.mode === 'CONTACT_TEST') {
      if (button === 'LEFT') {
        let out: RelayState = { ...next, mode: 'SETTING', activeMenuId: null };
        out = { ...out, lcdLines: generateLcdLines(out) };
        return out;
      }
      return next;
    }
    return handleSettingInput(next, button);
  }

  if (next.mode === 'DISPLAY') {
    if (button === 'UP' || button === 'DOWN') {
      const dir = button === 'UP' ? -1 : 1;
      const idx = (DISPLAY_PAGES.indexOf(next.displayPage) + dir + DISPLAY_PAGES.length) % DISPLAY_PAGES.length;
      next = { ...next, displayPage: DISPLAY_PAGES[idx] };
      next = { ...next, lcdLines: generateLcdLines(next) };
      return next;
    }
  }

  return { ...next, lcdLines: generateLcdLines(next) };
}

export function addEventLog(state: RelayState, message: string): RelayState {
  return addLog(state, message);
}
