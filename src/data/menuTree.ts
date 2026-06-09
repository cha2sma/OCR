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
      { key: 'iocrPickup',  label: 'IOCR PICKUP',  min: 0.1, max: 20.0, step: 0.1,  unit: 'A'  },
      { key: 'tocrPickup',  label: 'TOCR PICKUP',  min: 0.1, max: 20.0, step: 0.1,  unit: 'A'  },
      { key: 'iocgrPickup', label: 'IOCGR PICKUP', min: 0.1, max: 10.0, step: 0.1,  unit: 'A'  },
      { key: 'tocgrPickup', label: 'TOCGR PICKUP', min: 0.1, max: 10.0, step: 0.1,  unit: 'A'  },
      { key: 'ubocrPickup', label: 'UBOCR PICKUP', min: 0.1, max: 10.0, step: 0.01, unit: 'A'  },
    ],
  },
  {
    id: 'CONTACT_TEST',
    label: 'CONTACT TEST',
    children: [],
  },
];
