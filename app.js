const MARKETS = [
  { symbol: 'spy.us', name: 'S&P 500 ETF', country: 'United States', weight: 5 },
  { symbol: 'dia.us', name: 'Dow Jones ETF', country: 'United States', weight: 3 },
  { symbol: 'qqq.us', name: 'Nasdaq 100 ETF', country: 'United States', weight: 4 },
  { symbol: 'ewj.us', name: 'Japan ETF', country: 'Japan', weight: 3 },
  { symbol: 'ewu.us', name: 'United Kingdom ETF', country: 'United Kingdom', weight: 2 },
  { symbol: 'ewg.us', name: 'Germany ETF', country: 'Germany', weight: 2 },
  { symbol: 'ewq.us', name: 'France ETF', country: 'France', weight: 2 },
  { symbol: 'ewc.us', name: 'Canada ETF', country: 'Canada', weight: 2 },
  { symbol: 'ewz.us', name: 'Brazil ETF', country: 'Brazil', weight: 2 },
  { symbol: 'mchi.us', name: 'China ETF', country: 'China', weight: 3 },
  { symbol: 'inda.us', name: 'India ETF', country: 'India', weight: 3 },
  { symbol: 'eza.us', name: 'South Africa ETF', country: 'South Africa', weight: 1 }
];

const statusEl = document.querySelector('#status');
const heatmapEl = document.querySelector('#heatmap');
const tileTemplate = document.querySelector('#tileTemplate');
const refreshBtn = document.querySelector('#refreshNow');
const refreshIntervalEl = document.querySelector('#refreshInterval');

let timer;

function tone(changePct) {
  if (changePct <= -2) return '#7f1d1d';
  if (changePct < -0.5) return '#dc2626';
  if (changePct < 0.5) return '#475569';
  if (changePct < 2) return '#16a34a';
  return '#166534';
}

function parseCsv(text) {
  const [headerLine, ...rows] = text.trim().split('\n');
  const headers = headerLine.split(',');

  return rows
    .map((line) => {
      const values = line.split(',');
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
      const close = Number.parseFloat(row.Close);
      const open = Number.parseFloat(row.Open);

      if (Number.isNaN(close) || Number.isNaN(open) || open === 0) return null;

      return {
        symbol: row.Symbol,
        close,
        open,
        timestamp: `${row.Date} ${row.Time}`
      };
    })
    .filter(Boolean);
}

async function fetchQuotes() {
  const joined = MARKETS.map((m) => m.symbol).join(',');
  const endpoint = `https://stooq.com/q/l/?s=${encodeURIComponent(joined)}&f=sd2t2ohlcv&h&e=csv`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(endpoint)}`;

  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error('Could not load market data.');
  return parseCsv(await response.text());
}

function render(quotes) {
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol.toLowerCase(), quote]));
  const snapshot = MARKETS.map((market) => {
    const quote = bySymbol.get(market.symbol);
    if (!quote) return null;
    const changePct = ((quote.close - quote.open) / quote.open) * 100;
    return { ...market, ...quote, changePct };
  })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight);

  heatmapEl.innerHTML = '';

  snapshot.forEach((item) => {
    const node = tileTemplate.content.firstElementChild.cloneNode(true);
    node.style.backgroundColor = tone(item.changePct);
    node.style.gridRow = `span ${Math.max(1, Math.round(item.weight / 2))}`;

    node.querySelector('.symbol').textContent = item.symbol.toUpperCase();
    node.querySelector('.country').textContent = item.country;
    node.querySelector('.name').textContent = item.name;
    node.querySelector('.value').textContent = `Last: ${item.close.toFixed(2)}`;

    const sign = item.changePct > 0 ? '+' : '';
    node.querySelector('.change').textContent = `${sign}${item.changePct.toFixed(2)}% vs open`;

    heatmapEl.appendChild(node);
  });

  const timestamps = snapshot.map((s) => s.timestamp).filter(Boolean);
  const latest = timestamps.sort().pop();
  statusEl.textContent = `Updated ${new Date().toLocaleTimeString()}${latest ? ` • Source timestamp: ${latest}` : ''}`;
}

async function loadData() {
  statusEl.textContent = 'Loading market data...';
  try {
    const quotes = await fetchQuotes();
    render(quotes);
  } catch (error) {
    statusEl.textContent = `Failed to load live quotes (${error.message}).`;
    heatmapEl.innerHTML = '';
  }
}

function configureAutoRefresh() {
  if (timer) clearInterval(timer);
  const minutes = Number.parseInt(refreshIntervalEl.value, 10);
  if (!minutes) return;

  timer = setInterval(loadData, minutes * 60_000);
}

refreshBtn.addEventListener('click', loadData);
refreshIntervalEl.addEventListener('change', configureAutoRefresh);

loadData();
configureAutoRefresh();
