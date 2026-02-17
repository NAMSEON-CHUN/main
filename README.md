# Global Stock Market Heat Map

A lightweight single-page app that visualizes intraday market direction by country using ETF proxies. It is inspired by Finviz-style heat maps and is designed for quick daily trend scanning.

## Features

- Color-coded heat map tiles using open-vs-last percentage change.
- Region coverage across the US, Europe, Asia, and emerging markets.
- Auto-refresh interval selector.
- Uses Stooq quote feed through an open CORS proxy for browser compatibility.

## Run locally

Because this app uses ES modules, serve it with any static web server:

```bash
python3 -m http.server 4173
```

Then open:

`http://localhost:4173`

## Notes

- Data symbols are ETF proxies, not full country exchange composites.
- You can edit the `MARKETS` array in `app.js` to tune coverage or weights.
