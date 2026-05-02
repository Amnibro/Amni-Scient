# Amni-Life

**A memory map for the fragments of a life.**

Open the page. See your life as a constellation. Click any fragment — a person, place, event, work, idea, or era — to read it and trace its connections. Switch between five views: Timeline, Constellation, Spiral, Cluster, Radial. Edit in-browser. Export your map as JSON. Nothing leaves your computer.

## Run locally

```bash
cd Amni-Life
python server.py            # starts http://localhost:8765
# or: python -m http.server 8765
```

Open `http://localhost:8765/`.

## Build the WASM crate (only after editing `rust/`)

```bash
cd Amni-Life/rust
wasm-pack build --target web --out-dir ../pkg
```

## Stack

- **Three.js** (importmap → unpkg)
- **Rust → WASM** (`wasm-pack`) for layout math
- **Vanilla** HTML/CSS/JS — no build step for the UI

Mirrors the **amni-prayer** pattern.

## Data shape

```json
{
  "fragments": [
    {
      "id": "f001",
      "title": "First memory of the ocean",
      "kind": "event",
      "year": 1998,
      "summary": "Salt air, sand, my grandmother's hand.",
      "tags": ["family", "coast", "early"],
      "connections": [{"to": "f014", "type": "with"}]
    }
  ]
}
```

Six `kind` values: `person`, `place`, `event`, `work`, `idea`, `era`.
Edge `type`s: `with`, `at`, `inspired-by`, `part-of`.

## Import / Export

In-browser. Top-bar buttons. JSON in, JSON out.

## License

MIT. Built by Amnibro as part of the Amni-Scient ecosystem.
