export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Point {
  left: number;
  top: number;
}

export interface RelayLayout {
  panelWidth: number;
  lcd: Rect;
  buttons: Record<string, Rect>;
  leds: Record<string, Point>;
}

// Coordinates derived from the SVG placeholder (520×700 px).
// All values are in CSS pixels and match the SVG element positions exactly.

export const relayLayout: RelayLayout = {
  panelWidth: 520,

  // SVG LCD glass: x=148, y=108, w=227, h=78
  lcd: {
    left:  148,
    top:   108,
    width: 227,
    height: 78,
  },

  buttons: {
    DIS:   { left: 103, top: 442, width:  42, height: 39 },
    SET:   { left: 103, top: 515, width:  42, height: 39 },
    UP:    { left: 232, top: 442, width:  44, height: 38 },
    DOWN:  { left: 232, top: 544, width:  44, height: 38 },
    LEFT:  { left: 183, top: 493, width:  43, height: 39 },
    RIGHT: { left: 285, top: 493, width:  43, height: 39 },
    ENT:   { left: 370, top: 515, width:  43, height: 39 },
    RESET: { left: 334, top: 424, width:  56, height: 58 },
  },

  leds: {
    PWR:            { left:  91, top: 306 },
    RUN:            { left:  91, top: 356 },
    ERR:            { left:  91, top: 405 },
    PICKUP_50_51_N: { left: 190, top: 337 },
    PICKUP_50B_46:  { left: 190, top: 387 },
    TRIP_INST_A:    { left: 277, top: 311 },
    TRIP_INST_B:    { left: 277, top: 338 },
    TRIP_INST_C:    { left: 277, top: 365 },
    TRIP_INST_N:    { left: 277, top: 392 },
    TRIP_TIMED_A:   { left: 326, top: 311 },
    TRIP_TIMED_B:   { left: 326, top: 338 },
    TRIP_TIMED_C:   { left: 326, top: 365 },
    TRIP_TIMED_N:   { left: 326, top: 392 },
    TRIP_50B:       { left: 377, top: 310 },
    UBOCR:          { left: 377, top: 392 },
  },
};
