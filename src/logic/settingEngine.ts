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
const FUNC_OPT       = ['Enabled', 'Disabled'] as const;
const MODE_OPT       = ['Inst', 'DT'] as const;
const CURVE_OPT      = ['NI','VI','EI','LI','DT','KNI','KDNI','KVI'] as const;
const BLOCK_OPT      = ['No', 'Yes'] as const;
const UBOCR_MODE_OPT = ['3I0', '3I2'] as const;
const FREQ_OPT       = ['50Hz', '60Hz'] as const;
const WF_TYPE_OPT    = ['150cycle', '300cycle'] as const;
const TSRC_OPT       = ['PKP','TRIP','PKP+TRIP','EXT_L_H','EXT_H_L','TRIP+EXT'] as const;
const BPS_OPT        = [9600, 19200, 38400] as const;
const RST_OPT        = ['Self', 'Manual'] as const;

function clamp(v: number, mn: number, mx: number) { return Math.max(mn, Math.min(mx, v)); }
function step3(v: number) { return +v.toFixed(3); }

// ─── Draft helpers ────────────────────────────────────────────────────────────

function draftState(state: RelayState): RelayState {
  return {
    ...state,
    systemSettings:     state.settingDraft.systemSettings,
    tsSettings:         state.settingDraft.tsSettings,
    protectionSettings: state.settingDraft.protectionSettings,
  };
}

export function isSaveablePath(path: string[]): boolean {
  if (path[1] === 'ts' && path.length === 3) return true;
  const leafId = path[path.length - 1];
  return ['power-system','rtc','waveform-set','com','password',
          'iocr','tocr','iocgr','tocgr','50b','ubocr'].includes(leafId);
}

export function commitDraft(state: RelayState): RelayState {
  const d = state.settingDraft;
  const settings = {
    ...state.settings,
    iocrPickup:  d.protectionSettings.iocr.pickup,
    tocrPickup:  d.protectionSettings.tocr.pickup,
    iocgrPickup: d.protectionSettings.iocgr.pickup,
    tocgrPickup: d.protectionSettings.tocgr.pickup,
    ubocrPickup: d.protectionSettings.ubocr.pickup,
  };
  return {
    ...state,
    systemSettings:           d.systemSettings,
    tsSettings:               d.tsSettings,
    protectionSettings:       d.protectionSettings,
    settings,
    hasUnsavedSettingChanges: false,
  };
}

export function discardDraft(state: RelayState): RelayState {
  return {
    ...state,
    settingDraft: {
      systemSettings:     state.systemSettings,
      tsSettings:         state.tsSettings,
      protectionSettings: state.protectionSettings,
    },
    hasUnsavedSettingChanges: false,
    saveConfirm: { active: false, choice: 'YES' as const, pendingPath: [] },
  };
}

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

// ─── LCD generators (all accept draft-overlaid state) ────────────────────────

function genPowerSystemLines(state: RelayState): string[] {
  const { freq, pCtRat, gCtRat } = state.systemSettings;
  const { selectedIndex: si, editMode, editValue } = state.settingNav;
  return fieldPage('POWER SYSTEM', [
    { label: 'FREQ', value: editMode && si === 0 ? FREQ_OPT[editValue] ?? freq : freq },
    { label: 'P_CT', value: `${editMode && si === 1 ? editValue : pCtRat}/5` },
    { label: 'G_CT', value: `${editMode && si === 2 ? editValue : gCtRat}/5` },
  ], si, editMode);
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
  return fieldPage(`T/S${String(tsIdx+1).padStart(2,'0')} SETTING`, [
    { label: 'CON', value: editMode && si === 0 ? TS_CON_OPTIONS[ev] ?? ts.con : ts.con },
    { label: 'RST', value: editMode && si === 1 ? RST_OPT[ev] ?? ts.rst : ts.rst },
    { label: 'DLY', value: `${editMode && si === 2 ? ev.toFixed(2) : ts.dly.toFixed(2)}s` },
  ], si, editMode);
}

function genRtcLines(state: RelayState): string[] {
  const parts = state.systemSettings.rtc.split(/[/ :]/).map(Number);
  const labels = ['YYYY','MM','DD','HH','MI','SS'];
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  const cur = [...parts];
  if (editMode) cur[si] = ev;
  const date = `${String(cur[0]).padStart(4,'0')}/${String(cur[1]).padStart(2,'0')}/${String(cur[2]).padStart(2,'0')}`;
  const time = `${String(cur[3]).padStart(2,'0')}:${String(cur[4]).padStart(2,'0')}:${String(cur[5]).padStart(2,'0')}`;
  return [p20('RTC SETTING'), p20(date), p20(time), p20(`FIELD:${labels[si]} UP/DN:CHG`)];
}

function genWaveformSetLines(state: RelayState): string[] {
  const { waveformType, tpos, tsrc } = state.systemSettings;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('WAVEFORM SET', [
    { label: 'TYPE', value: editMode && si === 0 ? WF_TYPE_OPT[ev] ?? waveformType : waveformType },
    { label: 'TPOS', value: `${editMode && si === 1 ? ev : tpos}%` },
    { label: 'TSRC', value: editMode && si === 2 ? TSRC_OPT[ev] ?? tsrc : tsrc },
  ], si, editMode);
}

function genComLines(state: RelayState): string[] {
  const { slvAddr, bps, protocol } = state.systemSettings;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('COM SETTING', [
    { label: 'ADDR', value: `${editMode && si === 0 ? ev : slvAddr}` },
    { label: 'BPS',  value: `${editMode && si === 1 ? BPS_OPT[ev] ?? bps : bps}` },
    { label: 'PROT', value: protocol },
  ], si, editMode);
}

function genPasswordSetLines(state: RelayState): string[] {
  const { editMode, editValue: ev } = state.settingNav;
  const pw = editMode ? String(Math.floor(ev)).padStart(4, '0') : '****';
  return [p20('PASSWORD SET'), p20(`NEW PASS:${pw}`), p20('USE ARROW KEYS'), p20('ENT:SAVE LEFT:BACK')];
}

function genIocrLines(state: RelayState): string[] {
  const p = state.protectionSettings.iocr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('IOCR SETTING', [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]  ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? MODE_OPT[ev]  ?? p.mode     : p.mode     },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ], si, editMode);
}

function genTocrLines(state: RelayState): string[] {
  const p = state.protectionSettings.tocr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('TOCR SETTING', [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]  ?? p.function : p.function },
    { label: 'CURVE',  value: editMode && si === 1 ? CURVE_OPT[ev] ?? p.curve    : p.curve    },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'T_DIAL', value: `${editMode && si === 3 ? ev.toFixed(2) : p.tDial.toFixed(2)}`  },
    { label: 'DT',     value: `${editMode && si === 4 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 5 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ], si, editMode);
}

function genIocgrLines(state: RelayState): string[] {
  const p = state.protectionSettings.iocgr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('IOCGR SETTING', [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]  ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? MODE_OPT[ev]  ?? p.mode     : p.mode     },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ], si, editMode);
}

function genTocgrLines(state: RelayState): string[] {
  const p = state.protectionSettings.tocgr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('TOCGR SETTING', [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]  ?? p.function : p.function },
    { label: 'CURVE',  value: editMode && si === 1 ? CURVE_OPT[ev] ?? p.curve    : p.curve    },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'T_DIAL', value: `${editMode && si === 3 ? ev.toFixed(2) : p.tDial.toFixed(2)}`  },
    { label: 'DT',     value: `${editMode && si === 4 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 5 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ], si, editMode);
}

function gen50bLines(state: RelayState): string[] {
  const p = state.protectionSettings.fiftyB;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('50B(OLTC) SET', [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]  ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? MODE_OPT[ev]  ?? p.mode     : p.mode     },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ], si, editMode);
}

function genUbocrLines(state: RelayState): string[] {
  const p = state.protectionSettings.ubocr;
  const { selectedIndex: si, editMode, editValue: ev } = state.settingNav;
  return fieldPage('UBOCR SETTING', [
    { label: 'FUNC',   value: editMode && si === 0 ? FUNC_OPT[ev]       ?? p.function : p.function },
    { label: 'MODE',   value: editMode && si === 1 ? UBOCR_MODE_OPT[ev] ?? p.mode     : p.mode     },
    { label: 'PICKUP', value: `${editMode && si === 2 ? ev.toFixed(1) : p.pickup.toFixed(1)}A` },
    { label: 'DT',     value: `${editMode && si === 3 ? ev.toFixed(2) : p.dtTime.toFixed(2)}s` },
    { label: 'BLOCK',  value: editMode && si === 4 ? BLOCK_OPT[ev] ?? p.block : p.block },
  ], si, editMode);
}

function genEventClearLines(state: RelayState): string[] {
  const { selectedIndex: si } = state.settingNav;
  return [p20('EVENT CLEAR'), p20('CLEAR ALL EVENT?'), p20(`${si === 0 ? '>' : ' '} NO`), p20(`${si === 1 ? '>' : ' '} YES`)];
}

function genWaveformClearLines(state: RelayState): string[] {
  const { selectedIndex: si } = state.settingNav;
  return [p20('WAVEFORM CLEAR'), p20('CLEAR ALL WAVE?'), p20(`${si === 0 ? '>' : ' '} NO`), p20(`${si === 1 ? '>' : ' '} YES`)];
}

function genContactTestLines(state: RelayState): string[] {
  const { selectedIndex: si } = state.settingNav;
  const start = si <= 1 ? 0 : Math.max(0, Math.min(si - 1, 8));
  const lines = [p20('CONTACT OUT TEST')];
  for (let i = 0; i < 3; i++) {
    const idx = start + i;
    if (idx >= 11) { lines.push(p20('')); continue; }
    const key = `ts${idx + 1}` as keyof typeof state.testContacts;
    lines.push(p20(`${idx === si ? '>' : ' '} T/S${String(idx+1).padStart(2,'0')}: ${state.testContacts[key] ? 'Ene' : 'DeE'}`));
  }
  return lines;
}

function genPanelTestLines(state: RelayState): string[] {
  return [p20('PANEL TEST'), p20(`MODE:${state.panelTestMode ? 'ON' : 'OFF'}`), p20('ENT:TOGGLE'), p20('LEFT:BACK')];
}

function genReclLines(_state: RelayState): string[] {
  return [p20('RECL. SEQUENCE'), p20('SIMULATION ONLY'), p20('NO REAL OUTPUT'), p20('ENT:SIM RESET:EXIT')];
}

function generateSaveConfirmLines(state: RelayState): string[] {
  const { choice } = state.saveConfirm;
  return [
    p20('SETTING CHANGED'),
    p20('SAVE CHANGES?'),
    p20(`${choice === 'YES' ? '>' : ' '} YES`),
    p20(`${choice === 'NO'  ? '>' : ' '} NO`),
  ];
}

// ─── Main LCD dispatcher ─────────────────────────────────────────────────────

export function generateSettingLcdLines(state: RelayState): string[] {
  if (state.saveConfirm.active) return generateSaveConfirmLines(state);

  const { menuPath, selectedIndex } = state.settingNav;
  const ds = draftState(state);

  if (menuPath.length === 0) return settingMenuLines('SETTING MENU', SETTING_MENU_TREE, selectedIndex);

  const node = getSettingNode(menuPath);
  if (node?.children && node.children.length > 0) {
    const hdr = node.id === 'system'     ? 'SYSTEM MENU'     :
                node.id === 'protection' ? 'PROTECTION MENU' :
                node.id === 'command'    ? 'COMMAND MENU'    :
                `${node.label} MENU`;
    return settingMenuLines(hdr, node.children, selectedIndex);
  }

  const leafId = menuPath[menuPath.length - 1];

  if (menuPath[1] === 'ts' && menuPath.length === 3) return genTsDetailLines(ds, parseInt(menuPath[2]));

  switch (leafId) {
    case 'power-system':   return genPowerSystemLines(ds);
    case 'ts':             return genTsListLines(ds);
    case 'rtc':            return genRtcLines(ds);
    case 'waveform-set':   return genWaveformSetLines(ds);
    case 'com':            return genComLines(ds);
    case 'password':       return genPasswordSetLines(ds);
    case 'iocr':           return genIocrLines(ds);
    case 'tocr':           return genTocrLines(ds);
    case 'iocgr':          return genIocgrLines(ds);
    case 'tocgr':          return genTocgrLines(ds);
    case '50b':            return gen50bLines(ds);
    case 'ubocr':          return genUbocrLines(ds);
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
  if (menuPath[1] === 'ts' && menuPath.length === 3) return 2;
  switch (leafId) {
    case 'power-system': return 2;
    case 'rtc':          return 5;
    case 'waveform-set': return 2;
    case 'com':          return 1;
    case 'password':     return 0;
    case 'iocr': case 'iocgr': case '50b': case 'ubocr': return 4;
    case 'tocr': case 'tocgr': return 5;
    case 'event-clear': case 'waveform-clear': return 1;
    case 'ts':           return 10;
    case 'contact-test': return 10;
    default: return 0;
  }
}

// ─── Edit-mode: get initial value from draft ──────────────────────────────────

function getEditValue(state: RelayState, menuPath: string[], si: number): number {
  const ds = draftState(state);
  const leafId = menuPath[menuPath.length - 1];

  if (menuPath[1] === 'ts' && menuPath.length === 3) {
    const ts = ds.tsSettings[parseInt(menuPath[2])];
    if (si === 0) return TS_CON_OPTIONS.indexOf(ts.con);
    if (si === 1) return RST_OPT.indexOf(ts.rst);
    return ts.dly;
  }

  switch (leafId) {
    case 'power-system':
      if (si === 0) return FREQ_OPT.indexOf(ds.systemSettings.freq);
      if (si === 1) return ds.systemSettings.pCtRat;
      return ds.systemSettings.gCtRat;
    case 'rtc': {
      const parts = ds.systemSettings.rtc.split(/[/ :]/);
      return parseInt(parts[si] ?? '0');
    }
    case 'waveform-set':
      if (si === 0) return WF_TYPE_OPT.indexOf(ds.systemSettings.waveformType);
      if (si === 1) return ds.systemSettings.tpos;
      return TSRC_OPT.indexOf(ds.systemSettings.tsrc);
    case 'com':
      if (si === 0) return ds.systemSettings.slvAddr;
      return BPS_OPT.indexOf(ds.systemSettings.bps);
    case 'password': return parseInt(ds.systemSettings.password);
    case 'iocr': {
      const p = ds.protectionSettings.iocr;
      return [FUNC_OPT.indexOf(p.function), MODE_OPT.indexOf(p.mode), p.pickup, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'tocr': {
      const p = ds.protectionSettings.tocr;
      return [FUNC_OPT.indexOf(p.function), CURVE_OPT.indexOf(p.curve), p.pickup, p.tDial, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'iocgr': {
      const p = ds.protectionSettings.iocgr;
      return [FUNC_OPT.indexOf(p.function), MODE_OPT.indexOf(p.mode), p.pickup, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'tocgr': {
      const p = ds.protectionSettings.tocgr;
      return [FUNC_OPT.indexOf(p.function), CURVE_OPT.indexOf(p.curve), p.pickup, p.tDial, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case '50b': {
      const p = ds.protectionSettings.fiftyB;
      return [FUNC_OPT.indexOf(p.function), MODE_OPT.indexOf(p.mode), p.pickup, p.dtTime, BLOCK_OPT.indexOf(p.block)][si] ?? 0;
    }
    case 'ubocr': {
      const p = ds.protectionSettings.ubocr;
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

// ─── Apply edit value to draft (not real state) ───────────────────────────────

function applyDraftValue(state: RelayState, menuPath: string[], si: number, ev: number): RelayState {
  const leafId = menuPath[menuPath.length - 1];
  const d = state.settingDraft;

  if (menuPath[1] === 'ts' && menuPath.length === 3) {
    const tsIdx = parseInt(menuPath[2]);
    const ts = { ...d.tsSettings[tsIdx] };
    if (si === 0) ts.con = TS_CON_OPTIONS[ev] ?? ts.con;
    else if (si === 1) ts.rst = RST_OPT[ev] ?? ts.rst;
    else ts.dly = ev;
    const newTs = [...d.tsSettings];
    newTs[tsIdx] = ts;
    return { ...state, settingDraft: { ...d, tsSettings: newTs }, hasUnsavedSettingChanges: true };
  }

  switch (leafId) {
    case 'power-system': {
      const s = { ...d.systemSettings };
      if (si === 0) s.freq = FREQ_OPT[ev] ?? s.freq;
      else if (si === 1) s.pCtRat = ev;
      else s.gCtRat = ev;
      return { ...state, settingDraft: { ...d, systemSettings: s }, hasUnsavedSettingChanges: true };
    }
    case 'rtc': {
      const parts = d.systemSettings.rtc.split(/[/ :]/);
      parts[si] = si === 0 ? String(ev).padStart(4,'0') : String(ev).padStart(2,'0');
      const rtc = `${parts[0]}/${parts[1]}/${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
      return { ...state, settingDraft: { ...d, systemSettings: { ...d.systemSettings, rtc } }, hasUnsavedSettingChanges: true };
    }
    case 'waveform-set': {
      const s = { ...d.systemSettings };
      if (si === 0) s.waveformType = WF_TYPE_OPT[ev] ?? s.waveformType;
      else if (si === 1) s.tpos = ev;
      else s.tsrc = TSRC_OPT[ev] ?? s.tsrc;
      return { ...state, settingDraft: { ...d, systemSettings: s }, hasUnsavedSettingChanges: true };
    }
    case 'com': {
      const s = { ...d.systemSettings };
      if (si === 0) s.slvAddr = ev;
      else s.bps = BPS_OPT[ev] ?? s.bps;
      return { ...state, settingDraft: { ...d, systemSettings: s }, hasUnsavedSettingChanges: true };
    }
    case 'password': {
      const pw = String(Math.floor(ev)).padStart(4, '0');
      return { ...state, settingDraft: { ...d, systemSettings: { ...d.systemSettings, password: pw } }, hasUnsavedSettingChanges: true };
    }
    case 'iocr': {
      const p = { ...d.protectionSettings.iocr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = MODE_OPT[ev] ?? p.mode;
      else if (si === 2) p.pickup = ev;
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      return { ...state, settingDraft: { ...d, protectionSettings: { ...d.protectionSettings, iocr: p } }, hasUnsavedSettingChanges: true };
    }
    case 'tocr': {
      const p = { ...d.protectionSettings.tocr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.curve = CURVE_OPT[ev] ?? p.curve;
      else if (si === 2) p.pickup = ev;
      else if (si === 3) p.tDial = ev;
      else if (si === 4) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      return { ...state, settingDraft: { ...d, protectionSettings: { ...d.protectionSettings, tocr: p } }, hasUnsavedSettingChanges: true };
    }
    case 'iocgr': {
      const p = { ...d.protectionSettings.iocgr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = MODE_OPT[ev] ?? p.mode;
      else if (si === 2) p.pickup = ev;
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      return { ...state, settingDraft: { ...d, protectionSettings: { ...d.protectionSettings, iocgr: p } }, hasUnsavedSettingChanges: true };
    }
    case 'tocgr': {
      const p = { ...d.protectionSettings.tocgr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.curve = CURVE_OPT[ev] ?? p.curve;
      else if (si === 2) p.pickup = ev;
      else if (si === 3) p.tDial = ev;
      else if (si === 4) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      return { ...state, settingDraft: { ...d, protectionSettings: { ...d.protectionSettings, tocgr: p } }, hasUnsavedSettingChanges: true };
    }
    case '50b': {
      const p = { ...d.protectionSettings.fiftyB };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = MODE_OPT[ev] ?? p.mode;
      else if (si === 2) p.pickup = ev;
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      return { ...state, settingDraft: { ...d, protectionSettings: { ...d.protectionSettings, fiftyB: p } }, hasUnsavedSettingChanges: true };
    }
    case 'ubocr': {
      const p = { ...d.protectionSettings.ubocr };
      if (si === 0) p.function = FUNC_OPT[ev] ?? p.function;
      else if (si === 1) p.mode = UBOCR_MODE_OPT[ev] ?? p.mode;
      else if (si === 2) p.pickup = ev;
      else if (si === 3) p.dtTime = ev;
      else p.block = BLOCK_OPT[ev] ?? p.block;
      return { ...state, settingDraft: { ...d, protectionSettings: { ...d.protectionSettings, ubocr: p } }, hasUnsavedSettingChanges: true };
    }
    default: return state;
  }
}

// ─── Save confirm button handler ──────────────────────────────────────────────

function handleSaveConfirmButton(
  state: RelayState,
  button: RelayButton,
  generateLcd: (s: RelayState) => string[],
): RelayState {
  const { saveConfirm } = state;
  function upd(next: RelayState): RelayState { return { ...next, lcdLines: generateLcd(next) }; }
  const closed = { active: false, choice: 'YES' as const, pendingPath: [] as string[] };

  if (button === 'UP' || button === 'DOWN') {
    return upd({ ...state, saveConfirm: { ...saveConfirm, choice: saveConfirm.choice === 'YES' ? 'NO' : 'YES' } });
  }

  if (button === 'ENT') {
    if (saveConfirm.choice === 'YES') {
      let next = commitDraft(state);
      next = { ...next, saveConfirm: closed,
        settingNav: { ...next.settingNav, menuPath: saveConfirm.pendingPath, selectedIndex: 0, editMode: false },
        eventLog: ['Setting saved', ...next.eventLog].slice(0, 100) };
      return upd(next);
    } else {
      let next = discardDraft(state);
      next = { ...next, saveConfirm: closed,
        settingNav: { ...next.settingNav, menuPath: saveConfirm.pendingPath, selectedIndex: 0, editMode: false },
        eventLog: ['Setting canceled', ...next.eventLog].slice(0, 100) };
      return upd(next);
    }
  }

  if (button === 'LEFT') {
    return upd({ ...state, saveConfirm: { ...saveConfirm, active: false } });
  }

  return state;
}

// ─── Main button handler ──────────────────────────────────────────────────────

export function handleSettingButton(
  state: RelayState,
  button: RelayButton,
  generateLcd: (s: RelayState) => string[],
): RelayState {
  if (state.saveConfirm.active) return handleSaveConfirmButton(state, button, generateLcd);

  const nav = state.settingNav;
  const { menuPath, selectedIndex: si, editMode, editValue: ev } = nav;

  function upd(next: RelayState): RelayState { return { ...next, lcdLines: generateLcd(next) }; }
  function setNav(partial: Partial<RelaySettingNavigation>): RelayState {
    return upd({ ...state, settingNav: { ...nav, ...partial } });
  }

  if (button === 'SET') {
    return upd({ ...state, settingNav: { menuPath: [], selectedIndex: 0, pageIndex: 0, editMode: false, editValue: 0 } });
  }

  const node = menuPath.length > 0 ? getSettingNode(menuPath) : null;
  const isLeaf = menuPath.length > 0 && (!node?.children || node.children.length === 0)
               && !(menuPath.length === 2 && menuPath[1] === 'ts');
  const currentChildren = menuPath.length === 0 ? SETTING_MENU_TREE : (node?.children ?? []);

  // ── Edit mode ───────────────────────────────────────────────────────────────
  if (editMode) {
    if (button === 'UP')   return setNav({ editValue: adjustEditValue(ev, 1, menuPath, si) });
    if (button === 'DOWN') return setNav({ editValue: adjustEditValue(ev, -1, menuPath, si) });
    if (button === 'ENT') {
      let next = applyDraftValue(state, menuPath, si, ev);
      next = { ...next, settingNav: { ...nav, editMode: false } };
      return upd(next);
    }
    if (button === 'LEFT') return setNav({ editMode: false });
    return state;
  }

  // ── Menu or leaf navigation ─────────────────────────────────────────────────

  if (button === 'LEFT') {
    if (menuPath.length === 0) return upd({ ...state, mode: 'NORMAL' });
    if (isSaveablePath(menuPath) && state.hasUnsavedSettingChanges) {
      return upd({ ...state, saveConfirm: { active: true, choice: 'YES', pendingPath: menuPath.slice(0, -1) } });
    }
    return setNav({ menuPath: menuPath.slice(0, -1), selectedIndex: 0, editMode: false });
  }

  const leafId = menuPath[menuPath.length - 1];

  if (leafId === 'event-clear' && isLeaf) {
    if (button === 'UP' || button === 'DOWN') return setNav({ selectedIndex: si === 0 ? 1 : 0 });
    if (button === 'ENT') {
      if (si === 1) return upd({ ...state, eventLog: ['Event log cleared'], settingNav: { ...nav, selectedIndex: 0 } });
      return setNav({ menuPath: menuPath.slice(0, -1), selectedIndex: 0 });
    }
    return state;
  }

  if (leafId === 'waveform-clear' && isLeaf) {
    if (button === 'UP' || button === 'DOWN') return setNav({ selectedIndex: si === 0 ? 1 : 0 });
    if (button === 'ENT') {
      if (si === 1) return upd({ ...state, waveformRecords: [], settingNav: { ...nav, selectedIndex: 0 } });
      return setNav({ menuPath: menuPath.slice(0, -1), selectedIndex: 0 });
    }
    return state;
  }

  if (leafId === 'contact-test' && isLeaf) {
    if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, 10) });
    if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, 10) });
    if (button === 'ENT' || button === 'RIGHT') {
      const key = `ts${si + 1}` as keyof typeof state.testContacts;
      return upd({ ...state, testContacts: { ...state.testContacts, [key]: !state.testContacts[key] } });
    }
    return state;
  }

  if (leafId === 'panel-test' && isLeaf) {
    if (button === 'ENT') return upd({ ...state, panelTestMode: !state.panelTestMode });
    return state;
  }

  if (leafId === 'recl' && isLeaf) return state;

  if (menuPath.length === 2 && menuPath[1] === 'ts') {
    if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, 10) });
    if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, 10) });
    if (button === 'ENT' || button === 'RIGHT') {
      return setNav({ menuPath: [...menuPath, String(si)], selectedIndex: 0, editMode: false });
    }
    return state;
  }

  if (isLeaf) {
    const maxIdx = maxFieldIdx(leafId, menuPath);
    if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, maxIdx) });
    if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, maxIdx) });
    if (button === 'ENT' || button === 'RIGHT') {
      return setNav({ editMode: true, editValue: getEditValue(state, menuPath, si) });
    }
    return state;
  }

  if (button === 'UP')   return setNav({ selectedIndex: clamp(si - 1, 0, currentChildren.length - 1) });
  if (button === 'DOWN') return setNav({ selectedIndex: clamp(si + 1, 0, currentChildren.length - 1) });
  if (button === 'ENT' || button === 'RIGHT') {
    const selected = currentChildren[si];
    if (!selected) return state;
    return setNav({ menuPath: [...menuPath, selected.id], selectedIndex: 0, editMode: false });
  }

  return state;
}
