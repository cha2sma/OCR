import type { RelayState, RelayButton, RelaySettingNavigation, TsConType } from './relayState';
import { SETTING_MENU_TREE } from '../data/menuTree';
import type { SettingMenuNode } from '../data/menuTree';

// ─── Option arrays ───────────────────────────────────────────────────────────

export const TS_CON_OPTIONS: TsConType[] = [
  'OFF','PROT_OR','IOCR_OR','IOCR_A','IOCR_B','IOCR_C',
  'TOCR_OR','TOCR_A','TOCR_B','TOCR_C','IOCGR','TOCGR',
  'OCR_A_OR','OCR_B_OR','OCR_C_OR','IOCR+TOCR','IOCR+IOCGR',
  'IOCR+TOCGR','TOCR+IOCGR','TOCR+TOCGR','IOCGR+TOCGR',
  '50B_OR','50B_A','50B_B','50B_C','UBOCR',
];
const FUNC_OPT  = ['Enabled', 'Disabled'] as const;
const MODE_OPT  = ['Inst', 'DT'] as const;
const CURVE_OPT = ['NI','VI','EI','LI','DT','KNI','KDNI','KVI'] as const;
const BLOCK_OPT = ['No', 'Yes'] as const;
const UBOCR_MODE_OPT = ['3I0', '3I2'] as const;
const FREQ_OPT  = ['50Hz', '60Hz'] as const;
const WF_TYPE_OPT = ['150cycle', '300cycle'] as const;
const TSRC_OPT = ['PKP','TRIP','PKP+TRIP','EXT_L_H','EXT_H_L','TRIP+EXT'] as const;
const BPS_OPT  = [9600, 19200, 38400] as const;
const RST_OPT  = ['Self', 'Manual'] as const;

function clamp(v: number, mn: number, mx: number) { return Math.max(mn, Math.min(mx, v)); }
function step3(v: number) { return +v.toFixed(3); }

// ─── Tree helpers ────────────────────────────────────────────────────────────

function getSettingNode(menuPath: string[]): SettingMenuNode | null {
  let nodes: SettingMenuNode[] = SETTING_MENU_TREE;
  let found: SettingMenuNode | null = null;
  for (const id of menuPath) {
    found = nodes.find(n => n.id === id) ?? null;
    if (!found) return null;
    nodes = found.children ?? [];
  }
  return found;
}

function settingMenuLines(header: string, items: SettingMenuNode[], sel: number): string[] {
  const count = items.length;
  const start = count <= 3 ? 0 : Math.max(0, Math.min(sel - 1, count - 3));
  const vis = items.slice(start, start + 3);
  const lines = [p20(header)];
  for (let i = 0; i < 3; i++) {
    const it = vis[i];
    if (!it) { lines.push(p20('')); continue; }
    lines.push(p20(`${(start + i) === sel ? '>' : ' '} ${it.label}`));
  }
  return lines;
}

// ─── LCD helpers ─────────────────────────────────────────────────────────────

function p20(s: string) { return s.padEnd(20).slice(0, 20); }

function fieldLine(label: string, value: string, selected: boolean, editing: boolean): string {
  const pref = selected ? '>' : ' ';
  const v    = editing ? `[${value}]` : value;
  return p20(`${pref}${label}:${v}`);
}

/** Show 3 fields from a list, scrolled to keep selectedIndex visible. */
function fieldPage(
  header: string,
  fields: { label: string; value: string }[],
  selectedIndex: number,
  editMode: boolean,
): string[] {
  const pageStart = Math.floor(selectedIndex / 3) * 3;
  const lines = [p20(header)];
  for (let i = 0; i < 3; i++) {
    const f = fields[pageStart + i];
    if (!f) { lines.push(p20('')); continue; }
    const fi = pageStart + i;
    lines.push(fieldLine(f.label, f.value, fi === selectedIndex, editMode && fi === selectedIndex));
  }
  return lines;
}

// ─── LCD generators ───────────────────────────────────────────────────────────

function genPowerSystemLines(state: RelayState): string[] {
  const { freq, pCtRat, gCtRat } = state.systemSettings;
  const { selectedIndex: si, editMode, editValue } = state.settingNav;
  const fields = [
    { label: 'FREQ',  value: editMode && si === 0 ? FREQ_OPT[editValue] ?? freq : freq },
    { label: 'P_CT',  value: `${editMode && si === 1 ? editValue : pCtRat}/5` },
    { label: 'G_CT',  value: `${editMode && si === 2 ? editValue : gCtRat}/5` },
  ];
  return fieldPage('POWER SYSTEM', fields, si, editMode);
}

function genTsListLines(state: RelayState): string[] {
  const { selectedIndex: si } = state.settingNav;
  const start = si <= 2 ? 0 : Math.max(0, Math.min(si - 1, 8));
  const lines = [p20('T/S SETTING')];
  for (let i = 0; i < 3; i++) {
    const idx = start + i;
    if (idx >= 11) { lines.push(p20('')); continue; }
    const ts = state.tsSettings[idx];
    lines.push(p20(`${idx === si ? '>' : ' '} T/S${String(idx+1).padStart(2,'0')}:${ts.con.slice(0,6)}`));
  }
  return lines;
}

function genTsDetailLines(state: RelayState, tsIdx: number): string[] {
  const ts = state.tsSettings[tsIdx];
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  const fields = [
    { label: 'CON', value: editMode && si === 0 ? TS_CON_OPTIONS[ev] ?? ts.con : ts.con },
    { label: 'RST', value: editMode && si === 1 ? RST_OPT[ev]           ?? ts.rst : ts.rst },
    { label: 'DLY', value: `${editMode && si === 2 ? ev.toFixed(2) : ts.dly.toFixed(2)}s` },
  ];
  return fieldPage(`T/S${String(tsIdx+1).padStart(2,'0')} SETTING`, fields, si, editMode);
}

function genRtcLines(state: RelayState): string[] {
  const rtc = state.systemSettings.rtc;
  const parts = rtc.split(/[/ :]/).map(Number); // YYYY,MM,DD,HH,MI,SS
  const labels = ['YYYY','MM','DD','HH','MI','SS'];
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  const cur = [...parts];
  if (editMode) cur[si] = ev;
  const date = `${String(cur[0]).padStart(4,'0')}/${String(cur[1]).padStart(2,'0')}/${String(cur[2]).padStart(2,'0')}`;
  const time = `${String(cur[3]).padStart(2,'0')}:${String(cur[4]).padStart(2,'0')}:${String(cur[5]).padStart(2,'0')}`;
  const lbl = labels[si];
  return [
    p20('RTC SETTING'),
    p20(date),
    p20(time),
    p20(`FIELD:${lbl} UP/DN:CHG`),
  ];
}

function genWaveformSetLines(state: RelayState): string[] {
  const { waveformType, tpos, tsrc } = state.systemSettings;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  const fields = [
    { label: 'TYPE', value: editMode && si === 0 ? WF_TYPE_OPT[ev] ?? waveformType : waveformType },
    { label: 'TPOS', value: `${editMode && si === 1 ? ev : tpos}%` },
    { label: 'TSRC', value: editMode && si === 2 ? TSRC_OPT[ev] ?? tsrc : tsrc },
  ];
  return fieldPage('WAVEFORM SET', fields, si, editMode);
}

function genComLines(state: RelayState): string[] {
  const { slvAddr, bps, protocol } = state.systemSettings;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  const fields = [
    { label: 'ADDR', value: `${editMode && si === 0 ? ev : slvAddr}` },
    { label: 'BPS',  value: `${editMode && si === 1 ? BPS_OPT[ev] ?? bps : bps}` },
    { label: 'PROT', value: protocol },
  ];
  return fieldPage('COM SETTING', fields, si, editMode);
}

function genPasswordSetLines(state: RelayState): string[] {
  const { editMode, editValue: ev } = state.settingNav;
  const pw = editMode ? String(Math.floor(ev)).padStart(4, '0') : '****';
  return [
    p20('PASSWORD SET'),
    p20(`NEW PASS:${pw}`),
    p20('USE ARROW KEYS'),
    p20('ENT:SAVE LEFT:BACK'),
  ];
}

function genProtFieldPage(header: string, state: RelayState, fields: { label: string; value: string }[]): string[] {
  const { selectedIndex: si, editMode } = state.settingNav;
  return fieldPage(header, fields, si, editMode);
}

function genIocrLines(state: RelayState): string[] {
  const p = state.protectionSettings.iocr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return genProtFieldPage('IOCR SETTING', state, [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev] ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? MODE_OPT[ev] ?? p.mode : p.mode },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ]);
}

function genTocrLines(state: RelayState): string[] {
  const p = state.protectionSettings.tocr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return genProtFieldPage('TOCR SETTING', state, [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]  ?? p.function : p.function },
    { label: 'CURVE',  value: editMode && si === 1 ? CURVE_OPT[ev] ?? p.curve    : p.curve    },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'T_DIAL', value: `${editMode && si === 3 ? ev.toFixed(2) : p.tDial.toFixed(2)}`  },
    { label: 'DT',     value: `${editMode && si === 4 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 5 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ]);
}

function genIocgrLines(state: RelayState): string[] {
  const p = state.protectionSettings.iocgr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return genProtFieldPage('IOCGR SETTING', state, [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev] ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? MODE_OPT[ev] ?? p.mode     : p.mode     },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ]);
}

function genTocgrLines(state: RelayState): string[] {
  const p = state.protectionSettings.tocgr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return genProtFieldPage('TOCGR SETTING', state, [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]  ?? p.function : p.function },
    { label: 'CURVE',  value: editMode && si === 1 ? CURVE_OPT[ev] ?? p.curve    : p.curve    },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'T_DIAL', value: `${editMode && si === 3 ? ev.toFixed(2) : p.tDial.toFixed(2)}`  },
    { label: 'DT',     value: `${editMode && si === 4 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 5 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ]);
}

function gen50bLines(state: RelayState): string[] {
  const p = state.protectionSettings.fiftyB;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return genProtFieldPage('50B(OLTC) SET', state, [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev] ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? MODE_OPT[ev] ?? p.mode     : p.mode     },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ]);
}

function genUbocrLines(state: RelayState): string[] {
  const p = state.protectionSettings.ubocr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return genProtFieldPage('UBOCR SETTING', state, [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]      ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? UBOCR_MODE_OPT[ev]?? p.mode     : p.mode     },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ]);
}

function genEventClearLines(state: RelayState): string[] {
  const { selectedIndex: si } = state.settingNav;
  return [
    p20('EVENT CLEAR'),
    p20('CLEAR ALL EVENT?'),
    p20(`${si === 0 ? '>' : ' '} NO`),
    p20(`${si === 1 ? '>' : ' '} YES`),
  ];
}

function genWaveformClearLines(state: RelayState): string[] {
  const { selectedIndex: si } = state.settingNav;
  return [
    p20('WAVEFORM CLEAR'),
    p20('CLEAR ALL WAVE?'),
    p20(`${si === 0 ? '>' : ' '} NO`),
    p20(`${si === 1 ? '>' : ' '} YES`),
  ];
}

function genContactTestLines(state: RelayState): string[] {
  const { selectedIndex: si } = state.settingNav;
  const start = si <= 1 ? 0 : Math.max(0, Math.min(si - 1, 8));
  const lines = [p20('CONTACT OUT TEST')];
  for (let i = 0; i < 3; i++) {
    const idx = start + i;
    if (idx >= 11) { lines.push(p20('')); continue; }
    const key = `ts${idx + 1}` as keyof typeof state.testContacts;
    const val = state.testContacts[key] ? 'Ene' : 'DeE';
    lines.push(p20(`${idx === si ? '>' : ' '} T/S${String(idx+1).padStart(2,'0')}: ${val}`));
  }
  return lines;
}

function genPanelTestLines(state: RelayState): string[] {
  return [
    p20('PANEL TEST'),
    p20(`MODE:${state.panelTestMode ? 'ON' : 'OFF'}`),
    p20('ENT:TOGGLE'),
    p20('LEFT:BACK'),
  ];
}

function genReclLines(_state: RelayState): string[] {
  return [
    p20('RECL. SEQUENCE'),
    p20('SIMULATION ONLY'),
    p20('NO REAL OUTPUT'),
    p20('ENT:SIM RESET:EXIT'),
  ];
}

// ─── Main LCD dispatcher ─────────────────────────────────────────────────────

export function generateSettingLcdLines(state: RelayState): string[] {
  const { menuPath, selectedIndex } = state.settingNav;

  if (menuPath.length === 0) {
    return settingMenuLines('SETTING MENU', SETTING_MENU_TREE, selectedIndex);
  }

  const node = getSettingNode(menuPath);

  // Sub-menu with children
  if (node?.children && node.children.length > 0) {
    const hdr = node.id === 'system'     ? 'SYSTEM MENU'    :
                node.id === 'protection' ? 'PROTECTION MENU':
                node.id === 'command'    ? 'COMMAND MENU'   :
                `${node.label} MENU`;
    return settingMenuLines(hdr, node.children, selectedIndex);
  }

  // Leaf nodes
  const leafId = menuPath[menuPath.length - 1];

  // T/S detail: path = ['system','ts','N']
  if (menuPath[1] === 'ts' && menuPath.length === 3) {
    return genTsDetailLines(state, parseInt(menuPath[2]));
  }

  switch (leafId) {
    case 'power-system':   return genPowerSystemLines(state);
    case 'ts':             return genTsListLines(state);
    case 'rtc':            return genRtcLines(state);
    case 'waveform-set':   return genWaveformSetLines(state);
    case 'com':            return genComLines(state);
    case 'password':       return genPasswordSetLines(state);
    case 'iocr':           return genIocrLines(state);
    case 'tocr':           return genTocrLines(state);
    case 'iocgr':          return genIocgrLines(state);
    case 'tocgr':          return genTocgrLines(state);
    case '50b':            return gen50bLines(state);
    case 'ubocr':          return genUbocrLines(state);
    case 'event-clear':    return genEventClearLines(state);
    case 'waveform-clear': return genWaveformClearLines(state);
    case 'contact-test':   return genContactTestLines(state);
    case 'panel-test':     return genPanelTestLines(state);
    case 'recl':           return genReclLines(state);
    default: return [p20(leafId), p20(''), p20(''), p20('')];
  }
}

// ─── Field count per leaf ─────────────────────────────────────────────────────

function maxFieldIdx(leafId: string, menuPath: string[]): number {
  if (menuPath[1] === 'ts' && menuPath.length === 3) return 2; // CON/RST/DLY
  switch (leafId) {
    case 'power-system': return 2;
    case 'rtc':          return 5;
    case 'waveform-set': return 2;
    case 'com':          return 1; // PROT is fixed, only ADDR+BPS editable
    case 'password':     return 0;
    case 'iocr':  case 'iocgr': case '50b': case 'ubocr': return 4;
    case 'tocr':  case 'tocgr': return 5;
    case 'event-clear':    case 'waveform-clear': return 1; // NO/YES
    case 'ts':             return 10; // T/S01~11 list
    case 'contact-test':   return 10;
    default: return 0;
  }
}

// ─── Edit-mode start: compute initial editValue from current state ─────────────

function getEditValue(state: RelayState, menuPath: string[], si: number): number {
  const leafId = menuPath[menuPath.length - 1];

  if (menuPath[1] === 'ts' && menuPath.length === 3) {
    const ts = state.tsSettings[parseInt(menuPath[2])];
    if (si === 0) return TS_CON_OPTIONS.indexOf(ts.con);
    if (si === 1) return RST_OPT.indexOf(ts.rst);
    return ts.dly;
  }

  switch (leafId) {
    case 'power-system':
      if (si === 0) return FREQ_OPT.indexOf(state.systemSettings.freq);
      if (si === 1) return state.systemSettings.pCtRat;
      return state.systemSettings.gCtRat;
    case 'rtc': {
      const parts = state.systemSettings.rtc.split(/[/ :]/);
      return parseInt(parts[si] ?? '0');
    }
    case 'waveform-set':
      if (si === 0) return WF_TYPE_OPT.indexOf(state.systemSettings.waveformType);
      if (si === 1) return state.systemSettings.tpos;
      return TSRC_OPT.indexOf(state.systemSettings.tsrc);
    case 'com':
      if (si === 0) return state.systemSettings.slvAddr;
      return BPS_OPT.indexOf(state.systemSettings.bps);
    case 'password': return parseInt(state.systemSettings.password);
    case 'iocr': {
      const p = state.protectionSettings.iocr;
      return [FUNC_OPT.indexOf(p.function), MODE_OPT.indexOf(p.mode), p.pickup, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'tocr': {
      const p = state.protectionSettings.tocr;
      return [FUNC_OPT.indexOf(p.function), CURVE_OPT.indexOf(p.curve), p.pickup, p.tDial, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'iocgr': {
      const p = state.protectionSettings.iocgr;
      return [FUNC_OPT.indexOf(p.function), MODE_OPT.indexOf(p.mode), p.pickup, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'tocgr': {
      const p = state.protectionSettings.tocgr;
      return [FUNC_OPT.indexOf(p.function), CURVE_OPT.indexOf(p.curve), p.pickup, p.tDial, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case '50b': {
      const p = state.protectionSettings.fiftyB;
      return [FUNC_OPT.indexOf(p.function), MODE_OPT.indexOf(p.mode), p.pickup, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'ubocr': {
      const p = state.protectionSettings.ubocr;
      return [FUNC_OPT.indexOf(p.function), UBOCR_MODE_OPT.indexOf(p.mode), p.pickup, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    default: return 0;
  }
}

// ─── Adjust editValue on UP/DOWN ─────────────────────────────────────────────

function adjustEditValue(ev: number, dir: 1 | -1, menuPath: string[], si: number): number {
  const leafId = menuPath[menuPath.length - 1];

  if (menuPath[1] === 'ts' && menuPath.length === 3) {
    if (si === 0) return clamp(ev + dir, 0, TS_CON_OPTIONS.length - 1);
    if (si === 1) return clamp(ev + dir, 0, RST_OPT.length - 1);
    return clamp(step3(ev + dir * 0.01), 0, 200);
  }

  switch (leafId) {
    case 'power-system':
      if (si === 0) return clamp(ev + dir, 0, FREQ_OPT.length - 1);
      return clamp(ev + dir * 5, 5, 30000);
    case 'rtc': {
      const maxes = [9999, 12, 31, 23, 59, 59];
      const mins  = [2000,  1,  1,  0,  0,  0];
      return clamp(ev + dir, mins[si] ?? 0, maxes[si] ?? 99);
    }
    case 'waveform-set':
      if (si === 0) return clamp(ev + dir, 0, WF_TYPE_OPT.length - 1);
      if (si === 1) return clamp(ev + dir, 0, 99);
      return clamp(ev + dir, 0, TSRC_OPT.length - 1);
    case 'com':
      if (si === 0) return clamp(ev + dir, 1, 254);
      return clamp(ev + dir, 0, BPS_OPT.length - 1);
    case 'password': return clamp(ev + dir, 0, 9999);
    case 'iocr':
      if (si === 0) return clamp(ev + dir, 0, 1);
      if (si === 1) return clamp(ev + dir, 0, 1);
      if (si === 2) return clamp(step3(ev + dir * 0.5), 1, 100);
      if (si === 3) return clamp(step3(ev + dir * 0.01), 0.04, 60);
      return clamp(ev + dir, 0, 1);
    case 'tocr':
      if (si === 0) return clamp(ev + dir, 0, 1);
      if (si === 1) return clamp(ev + dir, 0, CURVE_OPT.length - 1);
      if (si === 2) return clamp(step3(ev + dir * 0.1), 0.2, 12.5);
      if (si === 3) return clamp(step3(ev + dir * 0.05), 0.1, 10);
      if (si === 4) return clamp(step3(ev + dir * 0.01), 0.04, 60);
      return clamp(ev + dir, 0, 1);
    case 'iocgr':
      if (si === 0) return clamp(ev + dir, 0, 1);
      if (si === 1) return clamp(ev + dir, 0, 1);
      if (si === 2) return clamp(step3(ev + dir * 0.1), 0.5, 50);
      if (si === 3) return clamp(step3(ev + dir * 0.01), 0.04, 60);
      return clamp(ev + dir, 0, 1);
    case 'tocgr':
      if (si === 0) return clamp(ev + dir, 0, 1);
      if (si === 1) return clamp(ev + dir, 0, CURVE_OPT.length - 1);
      if (si === 2) return clamp(step3(ev + dir * 0.1), 0.1, 12.5);
      if (si === 3) return clamp(step3(ev + dir * 0.05), 0.1, 10);
      if (si === 4) return clamp(step3(ev + dir * 0.01), 0.04, 60);
      return clamp(ev + dir, 0, 1);
    case '50b':
      if (si === 0) return clamp(ev + dir, 0, 1);
      if (si === 1) return clamp(ev + dir, 0, 1);
      if (si === 2) return clamp(step3(ev + dir * 0.1), 0.2, 100);
      if (si === 3) return clamp(step3(ev + dir * 0.01), 0.04, 60);
      return clamp(ev + dir, 0, 1);
    case 'ubocr':
      if (si === 0) return clamp(ev + dir, 0, 1);
      if (si === 1) return clamp(ev + dir, 0, 1);
      if (si === 2) return clamp(step3(ev + dir * 0.1), 0.1, 15);
      if (si === 3) return clamp(step3(ev + dir * 0.01), 0.04, 60);
      return clamp(ev + dir, 0, 1);
    default: return ev + dir;
  }
}

// ─── Apply saved edit value to state ─────────────────────────────────────────

function applyEditValue(state: RelayState, menuPath: string[], si: number, ev: number): RelayState {
  const leafId = menuPath[menuPath.length - 1];

  if (menuPath[1] === 'ts' && menuPath.length === 3) {
    const tsIdx = parseInt(menuPath[2]);
    const ts = { ...state.tsSettings[tsIdx] };
    if (si === 0) ts.con = TS_CON_OPTIONS[ev] ?? ts.con;
    else if (si === 1) ts.rst = RST_OPT[ev] ?? ts.rst;
    else ts.dly = ev;
    const newTs = [...state.tsSettings];
    newTs[tsIdx] = ts;
    return { ...state, tsSettings: newTs };
  }

  switch (leafId) {
    case 'power-system': {
      const s = { ...state.systemSettings };
      if (si === 0) s.freq = FREQ_OPT[ev] ?? s.freq;
      else if (si === 1) s.pCtRat = ev;
      else s.gCtRat = ev;
      return { ...state, systemSettings: s };
    }
    case 'rtc': {
      const parts = state.systemSettings.rtc.split(/[/ :]/);
      parts[si] = si === 0 ? String(ev).padStart(4,'0') : String(ev).padStart(2,'0');
      const rtc = `${parts[0]}/${parts[1]}/${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
      return { ...state, systemSettings: { ...state.systemSettings, rtc } };
    }
    case 'waveform-set': {
      const s = { ...state.systemSettings };
      if (si === 0) s.waveformType = WF_TYPE_OPT[ev] ?? s.waveformType;
      else if (si === 1) s.tpos = ev;
      else s.tsrc = TSRC_OPT[ev] ?? s.tsrc;
      return { ...state, systemSettings: s };
    }
    case 'com': {
      const s = { ...state.systemSettings };
      if (si === 0) s.slvAddr = ev;
      else s.bps = BPS_OPT[ev] ?? s.bps;
      return { ...state, systemSettings: s };
    }
    case 'password': {
      const pw = String(Math.floor(ev)).padStart(4, '0');
      return { ...state, systemSettings: { ...state.systemSettings, password: pw } };
    }
    case 'iocr': {
      const p = { ...state.protectionSettings.iocr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = MODE_OPT[ev] ?? p.mode;
      else if (si === 2) { p.pickup = ev; }
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      const settings = si === 2 ? { ...state.settings, iocrPickup: ev } : state.settings;
      return { ...state, protectionSettings: { ...state.protectionSettings, iocr: p }, settings };
    }
    case 'tocr': {
      const p = { ...state.protectionSettings.tocr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.curve = CURVE_OPT[ev] ?? p.curve;
      else if (si === 2) { p.pickup = ev; }
      else if (si === 3) p.tDial = ev;
      else if (si === 4) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      const settings = si === 2 ? { ...state.settings, tocrPickup: ev } : state.settings;
      return { ...state, protectionSettings: { ...state.protectionSettings, tocr: p }, settings };
    }
    case 'iocgr': {
      const p = { ...state.protectionSettings.iocgr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = MODE_OPT[ev] ?? p.mode;
      else if (si === 2) { p.pickup = ev; }
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      const settings = si === 2 ? { ...state.settings, iocgrPickup: ev } : state.settings;
      return { ...state, protectionSettings: { ...state.protectionSettings, iocgr: p }, settings };
    }
    case 'tocgr': {
      const p = { ...state.protectionSettings.tocgr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.curve = CURVE_OPT[ev] ?? p.curve;
      else if (si === 2) { p.pickup = ev; }
      else if (si === 3) p.tDial = ev;
      else if (si === 4) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      const settings = si === 2 ? { ...state.settings, tocgrPickup: ev } : state.settings;
      return { ...state, protectionSettings: { ...state.protectionSettings, tocgr: p }, settings };
    }
    case '50b': {
      const p = { ...state.protectionSettings.fiftyB };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = MODE_OPT[ev] ?? p.mode;
      else if (si === 2) p.pickup = ev;
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      return { ...state, protectionSettings: { ...state.protectionSettings, fiftyB: p } };
    }
    case 'ubocr': {
      const p = { ...state.protectionSettings.ubocr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = UBOCR_MODE_OPT[ev] ?? p.mode;
      else if (si === 2) { p.pickup = ev; }
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      const settings = si === 2 ? { ...state.settings, ubocrPickup: ev } : state.settings;
      return { ...state, protectionSettings: { ...state.protectionSettings, ubocr: p }, settings };
    }
    default: return state;
  }
}

// ─── Main button handler ──────────────────────────────────────────────────────

export function handleSettingButton(
  state: RelayState,
  button: RelayButton,
  generateLcd: (s: RelayState) => string[],
): RelayState {
  const nav = state.settingNav;
  const { menuPath, selectedIndex: si, editMode, editValue: ev } = nav;

  function upd(next: RelayState): RelayState {
    return { ...next, lcdLines: generateLcd(next) };
  }
  function setNav(partial: Partial<RelaySettingNavigation>): RelayState {
    return upd({ ...state, settingNav: { ...nav, ...partial } });
  }

  // SET button: go back to setting root (from any depth)
  if (button === 'SET') {
    return upd({ ...state, settingNav: { menuPath: [], selectedIndex: 0, pageIndex: 0, editMode: false, editValue: 0 } });
  }

  const node = menuPath.length > 0 ? getSettingNode(menuPath) : null;
  const isLeaf = menuPath.length > 0 && (!node?.children || node.children.length === 0)
               && !(menuPath.length === 2 && menuPath[1] === 'ts'); // T/S list is not a leaf
  const currentChildren = menuPath.length === 0 ? SETTING_MENU_TREE : (node?.children ?? []);

  // ── Edit mode ───────────────────────────────────────────────────────────────
  if (editMode) {
    if (button === 'UP') return setNav({ editValue: adjustEditValue(ev, 1, menuPath, si) });
    if (button === 'DOWN') return setNav({ editValue: adjustEditValue(ev, -1, menuPath, si) });
    if (button === 'ENT') {
      let next = applyEditValue(state, menuPath, si, ev);
      next = { ...next, settingNav: { ...nav, editMode: false } };
      return upd(next);
    }
    if (button === 'LEFT') return setNav({ editMode: false }); // cancel
    return state;
  }

  // ── Menu or leaf navigation ─────────────────────────────────────────────────

  if (button === 'LEFT') {
    if (menuPath.length === 0) {
      // back to NORMAL
      const next: RelayState = { ...state, mode: 'NORMAL' };
      return upd(next);
    }
    const newPath = menuPath.slice(0, -1);
    return setNav({ menuPath: newPath, selectedIndex: 0, editMode: false });
  }

  // Command confirm screens (Event/Waveform Clear) use selectedIndex as YES/NO
  const leafId = menuPath[menuPath.length - 1];

  if (leafId === 'event-clear' && isLeaf) {
    if (button === 'UP'   || button === 'DOWN') return setNav({ selectedIndex: si === 0 ? 1 : 0 });
    if (button === 'ENT') {
      if (si === 1) { // YES
        const next: RelayState = { ...state, eventLog: ['Event log cleared'] };
        return upd({ ...next, settingNav: { ...nav, selectedIndex: 0 } });
      }
      return setNav({ menuPath: menuPath.slice(0, -1), selectedIndex: 0 });
    }
    return state;
  }

  if (leafId === 'waveform-clear' && isLeaf) {
    if (button === 'UP'   || button === 'DOWN') return setNav({ selectedIndex: si === 0 ? 1 : 0 });
    if (button === 'ENT') {
      if (si === 1) { // YES
        const next: RelayState = { ...state, waveformRecords: [] };
        return upd({ ...next, settingNav: { ...nav, selectedIndex: 0 } });
      }
      return setNav({ menuPath: menuPath.slice(0, -1), selectedIndex: 0 });
    }
    return state;
  }

  if (leafId === 'contact-test' && isLeaf) {
    if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, 10) });
    if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, 10) });
    if (button === 'ENT' || button === 'RIGHT') {
      const key = `ts${si + 1}` as keyof typeof state.testContacts;
      const tc = { ...state.testContacts, [key]: !state.testContacts[key] };
      return upd({ ...state, testContacts: tc });
    }
    return state;
  }

  if (leafId === 'panel-test' && isLeaf) {
    if (button === 'ENT') return upd({ ...state, panelTestMode: !state.panelTestMode });
    return state;
  }

  if (leafId === 'recl' && isLeaf) {
    // No real action, just show static info
    return state;
  }

  // T/S list navigation
  if (menuPath.length === 2 && menuPath[1] === 'ts') {
    if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, 10) });
    if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, 10) });
    if (button === 'ENT' || button === 'RIGHT') {
      return setNav({ menuPath: [...menuPath, String(si)], selectedIndex: 0, editMode: false });
    }
    return state;
  }

  // Standard leaf: field navigation
  if (isLeaf) {
    const maxIdx = maxFieldIdx(leafId, menuPath);
    if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, maxIdx) });
    if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, maxIdx) });
    if (button === 'ENT' || button === 'RIGHT') {
      const initVal = getEditValue(state, menuPath, si);
      return setNav({ editMode: true, editValue: initVal });
    }
    return state;
  }

  // Menu navigation (non-leaf)
  if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, currentChildren.length - 1) });
  if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, currentChildren.length - 1) });
  if (button === 'ENT' || button === 'RIGHT') {
    const selected = currentChildren[si];
    if (!selected) return state;
    return setNav({ menuPath: [...menuPath, selected.id], selectedIndex: 0, editMode: false });
  }

  return state;
}
