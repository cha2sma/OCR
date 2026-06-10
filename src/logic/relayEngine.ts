import type {
  RelayState, RelayButton, RelayCurrents, RelaySettings, WaveformRecord,
} from './relayState';
import { createDefaultRelayState, relayInfo } from '../data/relayDefaults';
import { DISPLAY_MENU } from '../data/menuTree';
import type { DisplayMenuNode } from '../data/menuTree';
import { generateSettingLcdLines, handleSettingButton } from './settingEngine';

export function createInitialRelayState(): RelayState {
  return createDefaultRelayState();
}

function addLog(state: RelayState, message: string): RelayState {
  return { ...state, eventLog: [message, ...state.eventLog].slice(0, 100) };
}

function pad20(s: string): string { return s.padEnd(20).slice(0, 20); }

// ─── Display menu helpers ─────────────────────────────────────────────────────

function getDisplayNode(menuPath: string[]): DisplayMenuNode | null {
  let nodes: DisplayMenuNode[] = DISPLAY_MENU;
  let found: DisplayMenuNode | null = null;
  for (const id of menuPath) {
    found = nodes.find(n => n.id === id) ?? null;
    if (!found) return null;
    nodes = found.children ?? [];
  }
  return found;
}

function menuLines(header: string, items: DisplayMenuNode[], sel: number): string[] {
  const count = items.length;
  const start = count <= 3 ? 0 : Math.max(0, Math.min(sel - 1, count - 3));
  const vis = items.slice(start, start + 3);
  const lines: string[] = [pad20(header)];
  for (let i = 0; i < 3; i++) {
    const it = vis[i];
    if (!it) { lines.push(pad20('')); continue; }
    lines.push(pad20(`${(start + i) === sel ? '>' : ' '} ${it.label}`));
  }
  return lines;
}

function getMaxPage(leafId: string, state: RelayState): number {
  switch (leafId) {
    case 'contact-output':  return 2;
    case 'self-diag':       return 2;
    case 'protection':      return 1;
    case 'phase-current':   return 1;
    case 'event-record':    return Math.max(0, Math.ceil(state.eventLog.length / 3) - 1);
    case 'waveform-record': return Math.max(0, Math.ceil(Math.max(1, state.waveformRecords.length) / 3) - 1);
    default: return 0;
  }
}

// ─── Display leaf generators ──────────────────────────────────────────────────

function generateContactInputLines(_s: RelayState): string[] {
  return [pad20('STATUS'), pad20('CONTACT INPUT'), pad20('IN1:OFF IN2:OFF'), pad20('IN3:OFF')];
}

function generateContactOutputLines(state: RelayState, page: number): string[] {
  const c = state.contacts;
  const ts = [c.ts1,c.ts2,c.ts3,c.ts4,c.ts5,c.ts6,c.ts7,c.ts8,c.ts9,c.ts10,c.ts11];
  const pages = [[0,1,2,3],[4,5,6,7],[8,9,10]] as const;
  const p = Math.min(page, 2);
  const idxs = pages[p];
  const fmt = (i: number) => `T/S${String(i+1).padStart(2,'0')}:${ts[i]?'ON ':'OFF'}`;
  return [
    pad20('CONTACT OUTPUT'),
    pad20(`${fmt(idxs[0])} ${fmt(idxs[1])}`),
    idxs[2] !== undefined ? pad20(`${fmt(idxs[2])} ${idxs[3] !== undefined ? fmt(idxs[3]) : '        '}`) : pad20(''),
    pad20(`PAGE:${p+1}/3 UP/DWN`),
  ];
}

const DIAG_ITEMS = ['DC POWER ','MEMORY   ','SETTING  ','AI CIRC  ','DI/O CIRC','AUTO CAL ','CPU WDOG '];

function generateSelfDiagLines(_s: RelayState, page: number): string[] {
  const start = Math.min(page, 2) * 3;
  const lines: string[] = [pad20('SELF DIAGNOSIS')];
  for (let i = 0; i < 3; i++) {
    const item = DIAG_ITEMS[start + i];
    lines.push(item ? pad20(`${item}: OK`) : pad20(''));
  }
  return lines;
}

type ProtStatus = 'NORMAL' | 'PICKUP' | 'TRIP';
function protStatus(trip: boolean, pickup: boolean): ProtStatus {
  return trip ? 'TRIP' : pickup ? 'PICKUP' : 'NORMAL';
}

function generateProtectionLines(state: RelayState, page: number): string[] {
  const { leds } = state;
  const iocr  = protStatus(leds.tripInstA || leds.tripInstB || leds.tripInstC, leds.pickup5051n);
  const tocr  = protStatus(leds.tripTimedA || leds.tripTimedB || leds.tripTimedC, false);
  const iocgr = protStatus(leds.tripInstN, false);
  const tocgr = protStatus(leds.tripTimedN, false);
  const b50   = protStatus(leds.trip50b, false);
  const ubocr = protStatus(leds.ubocr, false);
  if (page === 0) return [pad20('PROTECTION STATUS'),pad20(`IOCR : ${iocr}`),pad20(`TOCR : ${tocr}`),pad20(`IOCGR: ${iocgr}`)];
  return [pad20('PROTECTION STATUS'),pad20(`TOCGR: ${tocgr}`),pad20(`50B  : ${b50}`),pad20(`UBOCR: ${ubocr}`)];
}

function generateRs485Lines(_s: RelayState): string[] {
  return [pad20('RS-485 MONITOR'),pad20('RXD : NORMAL'),pad20('TXD : NORMAL'),pad20('COM : STANDBY')];
}

function generatePhaseCurrentLines(state: RelayState, page: number): string[] {
  const { ia, ib, ic, in: inp } = state.currents;
  if (page === 0) return [pad20('PHASE CURRENT'),pad20(`IA:${ia.toFixed(2)}A  0DEG`),pad20(`IB:${ib.toFixed(2)}A -120D`),pad20(`IC:${ic.toFixed(2)}A 120D`)];
  return [pad20('PHASE CURRENT'),pad20(`IN:${inp.toFixed(2)}A`),pad20('ANGLE:0DEG'),pad20('PAGE 2/2')];
}

function generateSequenceCurrentLines(state: RelayState): string[] {
  const { ia, ib, ic, in: inp } = state.currents;
  const i0 = inp, i1 = (ia+ib+ic)/3, i2 = Math.max(ia,ib,ic)-Math.min(ia,ib,ic);
  return [pad20('SEQUENCE CURRENT'),pad20(`I0:${i0.toFixed(2)}A  0DEG`),pad20(`I1:${i1.toFixed(2)}A  0DEG`),pad20(`I2:${i2.toFixed(2)}A  0DEG`)];
}

function generateEventRecordLines(state: RelayState, page: number): string[] {
  const log = state.eventLog;
  if (log.length === 0) return [pad20('EVENT RECORD'),pad20('NO EVENT'),pad20(''),pad20('MAX 1024 EVENT')];
  const start = page * 3;
  const lines: string[] = [pad20('EVENT RECORD')];
  for (let i = 0; i < 3; i++) {
    const entry = log[start + i];
    lines.push(entry ? pad20(`${String(start+i+1).padStart(3,'0')} ${entry}`) : pad20(''));
  }
  return lines;
}

function generateWaveformRecordLines(state: RelayState, page: number): string[] {
  const recs = state.waveformRecords;
  if (recs.length === 0) return [pad20('WAVEFORM RECORD'),pad20('NO WAVEFORM'),pad20(''),pad20('MAX 6 RECORD')];
  const start = Math.min(page, 1) * 3;
  const lines: string[] = [pad20('WAVEFORM RECORD')];
  for (let i = 0; i < 3; i++) {
    const slot = start + i + 1;
    const rec = recs[start + i];
    lines.push(pad20(`WF${String(slot).padStart(2,'0')}:${rec ? rec.label : 'EMPTY'}`));
  }
  return lines;
}

function generateSystemInfoLines(): string[] {
  return [pad20('SYSTEM INFO.'),pad20(`TYPE:${relayInfo.type}`),pad20(`VERSION: ${relayInfo.version}`),pad20(relayInfo.appName)];
}

// ─── Display LCD dispatcher ───────────────────────────────────────────────────

function generateDisplayLcdLines(state: RelayState): string[] {
  const { menuPath, selectedIndex, pageIndex } = state.displayNav;
  if (menuPath.length === 0) return menuLines('DISPLAY MENU', DISPLAY_MENU, selectedIndex);

  const node = getDisplayNode(menuPath);
  if (node?.children && node.children.length > 0) {
    const hdr = node.id === 'status' ? 'STATUS MENU' : node.id === 'measure' ? 'MEASURE MENU' : `${node.label} MENU`;
    return menuLines(hdr, node.children, selectedIndex);
  }

  const leafId = menuPath[menuPath.length - 1];
  switch (leafId) {
    case 'contact-input':    return generateContactInputLines(state);
    case 'contact-output':   return generateContactOutputLines(state, pageIndex);
    case 'self-diag':        return generateSelfDiagLines(state, pageIndex);
    case 'protection':       return generateProtectionLines(state, pageIndex);
    case 'rs485':            return generateRs485Lines(state);
    case 'phase-current':    return generatePhaseCurrentLines(state, pageIndex);
    case 'sequence-current': return generateSequenceCurrentLines(state);
    case 'event-record':     return generateEventRecordLines(state, pageIndex);
    case 'waveform-record':  return generateWaveformRecordLines(state, pageIndex);
    case 'system-info':      return generateSystemInfoLines();
    default: return [pad20(leafId), pad20(''), pad20(''), pad20('')];
  }
}

// ─── Main LCD generator ───────────────────────────────────────────────────────

export function generateLcdLines(state: RelayState): string[] {
  const { mode, currents, settings, leds, contacts, passwordInput, passwordCursor } = state;

  if (mode === 'NORMAL') {
    return [pad20('   GD31-AB17'),pad20('  OCR SIMULATOR'),pad20(' STATUS : NORMAL'),pad20(' PRESS DIS/SET')];
  }
  if (mode === 'PASSWORD') {
    const display = passwordInput.split('').map((d, i) => (i === passwordCursor ? `[${d}]` : ` ${d} `)).join('');
    const cursor = '     '.slice(0, 6 + passwordCursor * 3) + '^';
    return [pad20('PASSWORD'),pad20(`INPUT :${display}`),pad20(cursor),pad20('ENT TO CONFIRM')];
  }
  if (mode === 'SETTING')      return generateSettingLcdLines(state);
  if (mode === 'DISPLAY')      return generateDisplayLcdLines(state);
  if (mode === 'CONTACT_TEST') return [pad20('CONTACT TEST'),pad20('NOT IMPLEMENTED'),pad20(''),pad20('LEFT: BACK')];

  void currents; void settings; void leds; void contacts;
  return [pad20(''), pad20(''), pad20(''), pad20('')];
}

// ─── Protection evaluation ────────────────────────────────────────────────────

export function evaluateProtection(state: RelayState): RelayState {
  const { currents } = state;
  const { ia, ib, ic } = currents;
  const ps = state.protectionSettings;

  const phasePickup = ia >= ps.iocr.pickup || ib >= ps.iocr.pickup || ic >= ps.iocr.pickup;
  const nPickup     = currents.in >= ps.iocgr.pickup;
  const max = Math.max(ia, ib, ic), min = Math.min(ia, ib, ic);
  const ubocrActive = max - min >= ps.ubocr.pickup;

  const newLeds = { ...state.leds, pickup5051n: phasePickup || nPickup, pickup50b46: false, ubocr: ubocrActive };
  const next = { ...state, leds: newLeds };
  return { ...next, lcdLines: generateLcdLines(next) };
}

// ─── Fault simulation ─────────────────────────────────────────────────────────

export function simulateFault(state: RelayState): RelayState {
  const { currents } = state;
  const { ia, ib, ic } = currents;
  const inp = currents.in;
  const ps  = state.protectionSettings;

  const tripA = ia >= ps.iocr.pickup;
  const tripB = ib >= ps.iocr.pickup;
  const tripC = ic >= ps.iocr.pickup;
  const tripN = inp >= ps.iocgr.pickup;
  const ts5   = state.leds.trip50b || state.leds.ubocr;

  const logs: string[] = [];
  if (tripA || tripB || tripC) { logs.push('Phase overcurrent detected'); }
  if (tripA) logs.push('A phase INST trip');
  if (tripB) logs.push('B phase INST trip');
  if (tripC) logs.push('C phase INST trip');
  if (tripN) logs.push('N phase INST trip');
  if (!tripA && !tripB && !tripC && !tripN) logs.push('Simulate fault executed (no pickup)');

  const newLeds = { ...state.leds, tripInstA: tripA, tripInstB: tripB, tripInstC: tripC, tripInstN: tripN };
  const newContacts = { ...state.contacts, ts1: tripA, ts2: tripB, ts3: tripC, ts4: tripN, ts5 };

  const wfLabel = tripA ? 'FAULT A' : tripB ? 'FAULT B' : tripC ? 'FAULT C' :
                  tripN ? 'FAULT N' : state.leds.ubocr ? 'UBOCR' : 'FAULT';
  const newWf: WaveformRecord = {
    id: (state.waveformRecords[0]?.id ?? 0) + 1,
    label: wfLabel,
    createdAt: new Date().toISOString().slice(0, 19),
  };
  const newWaveformRecords = [newWf, ...state.waveformRecords].slice(0, 6);

  let next: RelayState = { ...state, leds: newLeds, contacts: newContacts, waveformRecords: newWaveformRecords };
  next = evaluateProtection(next);
  for (const log of logs) next = addLog(next, log);
  return { ...next, lcdLines: generateLcdLines(next) };
}

// ─── Clear fault ──────────────────────────────────────────────────────────────

export function clearFault(state: RelayState): RelayState {
  const clearedLeds = {
    ...state.leds,
    pickup5051n: false, pickup50b46: false,
    tripInstA: false, tripInstB: false, tripInstC: false, tripInstN: false,
    tripTimedA: false, tripTimedB: false, tripTimedC: false, tripTimedN: false,
    trip50b: false, ubocr: false,
  };
  const clearedContacts = { ...state.contacts, ts1:false,ts2:false,ts3:false,ts4:false,ts5:false };
  let next: RelayState = { ...state, leds: clearedLeds, contacts: clearedContacts };
  next = addLog(next, 'Clear fault executed');
  return { ...next, lcdLines: generateLcdLines(next) };
}

// ─── Settings & currents update (from ControlPanel) ───────────────────────────

export function updateCurrents(state: RelayState, currents: RelayCurrents): RelayState {
  let next = { ...state, currents };
  next = evaluateProtection(next);
  return { ...next, lcdLines: generateLcdLines(next) };
}

export function updateSettings(state: RelayState, settings: RelaySettings): RelayState {
  // Sync flat settings -> protectionSettings pickup values
  const ps = state.protectionSettings;
  const newPs = {
    ...ps,
    iocr:  { ...ps.iocr,  pickup: settings.iocrPickup  },
    tocr:  { ...ps.tocr,  pickup: settings.tocrPickup  },
    iocgr: { ...ps.iocgr, pickup: settings.iocgrPickup },
    tocgr: { ...ps.tocgr, pickup: settings.tocgrPickup },
    ubocr: { ...ps.ubocr, pickup: settings.ubocrPickup },
  };
  let next = { ...state, settings, protectionSettings: newPs };
  next = evaluateProtection(next);
  return { ...next, lcdLines: generateLcdLines(next) };
}

// ─── Password handler ─────────────────────────────────────────────────────────

function handlePasswordInput(state: RelayState, button: RelayButton): RelayState {
  const digits = state.passwordInput.split('');
  const cursor = state.passwordCursor;

  if (button === 'UP') {
    const d = (parseInt(digits[cursor]) + 1) % 10; digits[cursor] = String(d);
    const next = { ...state, passwordInput: digits.join('') };
    return { ...next, lcdLines: generateLcdLines(next) };
  }
  if (button === 'DOWN') {
    const d = (parseInt(digits[cursor]) + 9) % 10; digits[cursor] = String(d);
    const next = { ...state, passwordInput: digits.join('') };
    return { ...next, lcdLines: generateLcdLines(next) };
  }
  if (button === 'RIGHT') {
    const next = { ...state, passwordCursor: Math.min(cursor + 1, 3) };
    return { ...next, lcdLines: generateLcdLines(next) };
  }
  if (button === 'LEFT') {
    const next = { ...state, passwordCursor: Math.max(cursor - 1, 0) };
    return { ...next, lcdLines: generateLcdLines(next) };
  }
  if (button === 'ENT') {
    if (state.passwordInput === state.systemSettings.password) {
      let next: RelayState = {
        ...state, mode: 'SETTING', passwordInput: '0000', passwordCursor: 0,
        settingNav: { menuPath: [], selectedIndex: 0, pageIndex: 0, editMode: false, editValue: 0 },
      };
      next = addLog(next, 'Password accepted');
      return { ...next, lcdLines: generateLcdLines(next) };
    } else {
      const next: RelayState = { ...state, lcdLines: [pad20('PASSWORD ERROR'),pad20('WRONG PASSWORD'),pad20('TRY AGAIN'),pad20('ENT TO CONFIRM')] };
      return addLog(next, 'Password error');
    }
  }
  return state;
}

// ─── Display mode handler ─────────────────────────────────────────────────────

function handleDisplayButton(state: RelayState, button: RelayButton): RelayState {
  const { menuPath, selectedIndex, pageIndex } = state.displayNav;
  const node = menuPath.length > 0 ? getDisplayNode(menuPath) : null;
  const isLeaf = menuPath.length > 0 && (!node?.children || node.children.length === 0);
  const currentChildren = menuPath.length === 0 ? DISPLAY_MENU : (node?.children ?? []);

  function upd(s: RelayState) { return { ...s, lcdLines: generateLcdLines(s) }; }

  if (button === 'LEFT') {
    if (menuPath.length === 0) {
      let next: RelayState = { ...state, mode: 'NORMAL' };
      next = addLog(next, 'Back to home');
      return upd(next);
    }
    return upd({ ...state, displayNav: { menuPath: menuPath.slice(0,-1), selectedIndex: 0, pageIndex: 0 } });
  }

  if (!isLeaf) {
    if (button === 'UP') return upd({ ...state, displayNav: { ...state.displayNav, selectedIndex: Math.max(selectedIndex-1,0) } });
    if (button === 'DOWN') return upd({ ...state, displayNav: { ...state.displayNav, selectedIndex: Math.min(selectedIndex+1, currentChildren.length-1) } });
    if (button === 'ENT' || button === 'RIGHT') {
      const sel = currentChildren[selectedIndex];
      if (!sel) return state;
      return upd({ ...state, displayNav: { menuPath: [...menuPath, sel.id], selectedIndex: 0, pageIndex: 0 } });
    }
  } else {
    const leafId = menuPath[menuPath.length - 1];
    if (button === 'UP') return upd({ ...state, displayNav: { ...state.displayNav, pageIndex: Math.max(pageIndex-1,0) } });
    if (button === 'DOWN') {
      const maxPage = getMaxPage(leafId, state);
      return upd({ ...state, displayNav: { ...state.displayNav, pageIndex: Math.min(pageIndex+1, maxPage) } });
    }
  }
  return state;
}

// ─── Main button handler ──────────────────────────────────────────────────────

export function handleRelayButton(state: RelayState, button: RelayButton): RelayState {
  let next = addLog(state, `${button} pressed`);

  if (button === 'DIS') {
    if (next.mode === 'DISPLAY') {
      if (next.displayNav.menuPath.length === 0) {
        const idx = (next.displayNav.selectedIndex + 1) % DISPLAY_MENU.length;
        next = { ...next, displayNav: { menuPath: [], selectedIndex: idx, pageIndex: 0 } };
      } else {
        next = { ...next, displayNav: { menuPath: [], selectedIndex: 0, pageIndex: 0 } };
      }
    } else {
      next = { ...next, mode: 'DISPLAY', displayNav: { menuPath: [], selectedIndex: 0, pageIndex: 0 } };
    }
    return { ...next, lcdLines: generateLcdLines(next) };
  }

  if (button === 'SET') {
    if (next.mode === 'NORMAL' || next.mode === 'DISPLAY') {
      next = { ...next, mode: 'PASSWORD', passwordInput: '0000', passwordCursor: 0 };
      return { ...next, lcdLines: generateLcdLines(next) };
    }
    if (next.mode === 'SETTING') {
      // Delegate to settingEngine — it handles SET as "go to root"
      return handleSettingButton(next, button, generateLcdLines);
    }
  }

  if (button === 'RESET') {
    const hasLatch =
      next.leds.tripInstA || next.leds.tripInstB || next.leds.tripInstC || next.leds.tripInstN ||
      next.leds.tripTimedA || next.leds.tripTimedB || next.leds.tripTimedC || next.leds.tripTimedN ||
      next.leds.pickup5051n || next.leds.pickup50b46 || next.leds.ubocr;
    if (hasLatch) { next = clearFault(next); next = addLog(next, 'Reset: latch cleared'); }
    next = { ...next, mode: 'NORMAL', panelTestMode: false, passwordInput: '0000', passwordCursor: 0,
             settingNav: { menuPath: [], selectedIndex: 0, pageIndex: 0, editMode: false, editValue: 0 } };
    next = addLog(next, 'Reset: returned to home');
    return { ...next, lcdLines: generateLcdLines(next) };
  }

  if (next.mode === 'PASSWORD') return handlePasswordInput(next, button);
  if (next.mode === 'SETTING')  return handleSettingButton(next, button, generateLcdLines);
  if (next.mode === 'DISPLAY')  return handleDisplayButton(next, button);

  return { ...next, lcdLines: generateLcdLines(next) };
}

export function addEventLog(state: RelayState, message: string): RelayState {
  return addLog(state, message);
}
