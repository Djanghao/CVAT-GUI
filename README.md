# FastCVAT

FastCVAT is a CVAT fork focused on fast and precise bounding-box annotation with automatic snapping and streamlined assists.

## Feature Highlights
- Crosshair overlap and edge-alignment guides when drawing.
- Smart snapping while drawing or dragging rectangles with configurable tolerance.
- Equal-spacing hints that preserve grid layouts during starts and drags.
- Auto rectangle mode after switching labels via shortcut.

## Install & Run
Follow the official CVAT installation steps. Clone this fork instead of the upstream repo and launch with the usual commands:

```bash
git clone https://github.com/<your-org>/fastcvat.git
cd fastcvat
docker compose up -d
```

The web UI remains at `http://localhost:8080` by default and stays API-compatible with CVAT.

## Development Notes
- `docker-compose.dev.yml` contains the development-only service configuration used while running the stack locally.

## Using the Assists
- Configure toggles and tolerances under **Settings → FastCVAT Features**.
- Assist modifier defaults to `Ctrl`; equal-spacing modifier defaults to `Alt`.
- The **Shortcuts** tab exposes an "Auto rectangle after switching label" toggle so users can opt out.

## Changelog
### 0.1.0 — 2025-09-22
- Added crosshair alignment and snapping visuals for rectangles (e820a7b, 9cc06b0).
- Implemented equal-spacing hints/snaps during rectangle create and drag (9147c70).
- Introduced FastCVAT settings tab with modifier customization (417b891, 9147c70, c618c56).
- Enabled auto rectangle after label switch via feature toggle (43b66ec).
- Forced final rectangle coordinates to snap exactly on completion (6e891a4).
- Updated dev Redis port mapping to 16666 to prevent conflicts (5ac9716).

## License
MIT License, identical to upstream CVAT. See `LICENSE`.
