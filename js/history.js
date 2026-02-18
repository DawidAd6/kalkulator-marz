const STORAGE_KEY = 'dropship-calc-history';
const MAX_ENTRIES = 100;

export function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function saveEntry(entry) {
  const history = loadHistory();
  entry.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }
  saveHistory(history);
}

export function deleteEntry(id) {
  const history = loadHistory().filter((e) => e.id !== id);
  saveHistory(history);
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getHistoryStats() {
  const history = loadHistory();
  if (history.length === 0) {
    return { count: 0, avgProfit: 0, avgMargin: 0, bestProduct: null, totalProfit: 0 };
  }

  let totalProfit = 0;
  let totalMargin = 0;
  let best = history[0];

  for (const entry of history) {
    totalProfit += entry.profit;
    totalMargin += entry.marginPercent;
    if (entry.profit > best.profit) best = entry;
  }

  return {
    count: history.length,
    avgProfit: Math.round((totalProfit / history.length) * 100) / 100,
    avgMargin: Math.round((totalMargin / history.length) * 10) / 10,
    bestProduct: best.productName,
    totalProfit: Math.round(totalProfit * 100) / 100,
  };
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PLATFORM_LABELS = {
  allegro: 'Allegro',
  temu: 'Temu',
  aliexpress: 'AliExpress',
  other: 'Inna',
};

export function renderHistory(tbody, emptyMsg, table, { sortKey = 'timestamp', sortDir = 'desc', filterPlatform = 'all', searchQuery = '' } = {}) {
  let history = loadHistory();

  // Filter by platform
  if (filterPlatform !== 'all') {
    history = history.filter((e) => e.platform === filterPlatform);
  }

  // Search by product name
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    history = history.filter((e) => e.productName.toLowerCase().includes(q));
  }

  // Sort
  history.sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = '';

  if (history.length === 0) {
    table.hidden = true;
    emptyMsg.hidden = false;
    return;
  }

  table.hidden = false;
  emptyMsg.hidden = true;

  for (const entry of history) {
    const tr = document.createElement('tr');
    const tierClass = entry.profit < 5 ? 'tier-bad' : entry.profit <= 15 ? 'tier-mid' : 'tier-good';

    tr.innerHTML = `
      <td>${formatDate(entry.timestamp)}</td>
      <td>${escapeHtml(entry.productName)}</td>
      <td>
        <span class="platform-badge platform-${entry.platform}">
          ${PLATFORM_LABELS[entry.platform] || entry.platform}
        </span>
      </td>
      <td class="profit-cell ${tierClass}">${entry.profit.toFixed(2)} zł</td>
      <td>${entry.marginPercent.toFixed(1)}%</td>
      <td>
        <button class="btn-delete-row" data-id="${entry.id}" title="Usuń">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

export function exportHistoryCSV() {
  const history = loadHistory();
  if (history.length === 0) return null;

  const headers = ['Data', 'Produkt', 'Platforma', 'Cena sprzedaży', 'Cena zakupu', 'Dostawa', 'Prowizja %', 'VAT %', 'Zysk', 'Marża %'];
  const dec = (n) => String(n).replace('.', ',');
  const rows = history.map((e) => [
    formatDate(e.timestamp),
    `"${e.productName.replace(/"/g, '""')}"`,
    PLATFORM_LABELS[e.platform] || e.platform,
    dec(e.sellingPrice),
    dec(e.purchasePrice),
    dec(e.shippingCost),
    dec(e.commissionRate),
    e.vatRate || 0,
    dec(e.profit.toFixed(2)),
    dec(e.marginPercent.toFixed(1)),
  ]);

  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `kalkulator-marzy-historia-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
