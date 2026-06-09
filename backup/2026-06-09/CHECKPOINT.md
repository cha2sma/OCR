# Backup Checkpoint — 2026-06-09

## State at this point

- SVG placeholder (`gd31-ab17.svg`): authentic first-build, 520×700px
- `relayLayout.ts`: all coordinates match SVG element positions exactly
  - LCD: left=148, top=108, width=227, height=78
  - Buttons: DIS/SET/UP/DOWN/LEFT/RIGHT/ENT/RESET — aligned to SVG rects
  - LEDs: PWR/RUN/ERR + 12 trip/pickup LEDs — aligned to SVG circles
- `LcdDisplay.tsx`: padding=0 (fills edge-to-edge), paddingLeft=3px on text lines
- Build: passing (`tsc -b && vite build`)
- No external API dependencies (react + react-dom only)
