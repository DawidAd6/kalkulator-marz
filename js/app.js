import { PLATFORM_DEFAULTS, calculate, calculateBreakEven, getProfitTier, getInterpretationText } from './calculator.js';
import { validateForm, isFormFilled } from './validation.js';
import { saveEntry, deleteEntry, clearHistory, renderHistory, exportHistoryCSV, getHistoryStats } from './history.js';
import { initCustomSelects, syncCustomSelect, syncAllCustomSelects } from './custom-select.js';

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM references ──
  const form = document.getElementById('calc-form');
  const calcBtn = document.getElementById('calc-btn');
  const resetBtn = document.getElementById('reset-btn');

  const productNameInput = document.getElementById('product-name');
  const purchasePriceInput = document.getElementById('purchase-price');
  const purchaseCurrencySelect = document.getElementById('purchase-currency');
  const shippingCostInput = document.getElementById('shipping-cost');
  const sellingPriceInput = document.getElementById('selling-price');
  const platformSelect = document.getElementById('platform');
  const commissionRateInput = document.getElementById('commission-rate');
  const adsCostInput = document.getElementById('ads-cost');
  const packagingCostInput = document.getElementById('packaging-cost');
  const returnRateInput = document.getElementById('return-rate');
  const quantityInput = document.getElementById('quantity');
  const vatRateSelect = document.getElementById('vat-rate');
  const includeVatCheckbox = document.getElementById('include-vat');
  const foreignCheckbox = document.getElementById('foreign-dropshipping');
  const deliveryTimeGroup = document.getElementById('delivery-time-group');
  const deliveryTimeInput = document.getElementById('delivery-time');

  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsContent = document.getElementById('results-content');
  const resultProfit = document.getElementById('result-profit');
  const resultMargin = document.getElementById('result-margin');
  const resultBatch = document.getElementById('result-batch');
  const batchValue = document.getElementById('batch-value');
  const resultBreakdown = document.getElementById('result-breakdown');
  const resultBreakeven = document.getElementById('result-breakeven');
  const resultInterpretation = document.getElementById('result-interpretation');
  const donutCanvas = document.getElementById('donut-chart');
  const chartLegend = document.getElementById('chart-legend');
  const shareBtn = document.getElementById('share-btn');

  const desiredProfitInput = document.getElementById('desired-profit');
  const breakevenResult = document.getElementById('breakeven-result');

  const statsSection = document.getElementById('stats-section');
  const statCount = document.getElementById('stat-count');
  const statAvgProfit = document.getElementById('stat-avg-profit');
  const statAvgMargin = document.getElementById('stat-avg-margin');
  const statBest = document.getElementById('stat-best');

  const historyBody = document.getElementById('history-body');
  const historyEmpty = document.getElementById('history-empty');
  const historyTable = document.getElementById('history-table');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const historySearch = document.getElementById('history-search');
  const historyFilterPlatform = document.getElementById('history-filter-platform');

  const themeToggle = document.getElementById('theme-toggle');
  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmCancel = document.getElementById('confirm-cancel');
  const toastContainer = document.getElementById('toast-container');

  const allInputs = [productNameInput, purchasePriceInput, shippingCostInput, sellingPriceInput, commissionRateInput, adsCostInput, packagingCostInput, returnRateInput, quantityInput];

  // ── State ──
  let historySort = { key: 'timestamp', dir: 'desc' };

  // ── Helpers ──
  function num(input) {
    return input.value !== '' ? parseFloat(input.value) : null;
  }

  function getFormData() {
    return {
      productName: productNameInput.value,
      purchasePrice: num(purchasePriceInput),
      purchaseCurrency: purchaseCurrencySelect.value,
      shippingCost: num(shippingCostInput),
      sellingPrice: num(sellingPriceInput),
      platform: platformSelect.value,
      commissionRate: num(commissionRateInput),
      adsCostPerItem: num(adsCostInput) || 0,
      packagingCost: num(packagingCostInput) || 0,
      returnRate: num(returnRateInput) || 0,
      quantity: parseInt(quantityInput.value, 10) || 1,
      vatRate: parseInt(vatRateSelect.value, 10),
      includeVat: includeVatCheckbox.checked,
      foreignDropshipping: foreignCheckbox.checked,
      deliveryTime: deliveryTimeInput.value,
    };
  }

  // ── Toast ──
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      const fallback = setTimeout(() => toast.remove(), 500);
      toast.addEventListener('transitionend', () => { clearTimeout(fallback); toast.remove(); });
    }, 2500);
  }

  // ── Confirm dialog ──
  function showConfirm(message) {
    return new Promise((resolve) => {
      confirmMessage.textContent = message;
      confirmOverlay.classList.add('visible');
      const onOk = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      const cleanup = () => {
        confirmOverlay.classList.remove('visible');
        confirmOk.removeEventListener('click', onOk);
        confirmCancel.removeEventListener('click', onCancel);
      };
      confirmOk.addEventListener('click', onOk);
      confirmCancel.addEventListener('click', onCancel);
    });
  }

  // ── Theme toggle ──
  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // ── Platform change ──
  platformSelect.addEventListener('change', () => {
    const defaultRate = PLATFORM_DEFAULTS[platformSelect.value];
    if (defaultRate !== undefined) {
      commissionRateInput.value = defaultRate;
      updateButtonState();
    }
    // Auto-select currency for foreign platforms
    if (platformSelect.value === 'aliexpress') {
      purchaseCurrencySelect.value = 'USD';
    } else if (platformSelect.value === 'temu') {
      purchaseCurrencySelect.value = 'USD';
    } else {
      purchaseCurrencySelect.value = 'PLN';
    }
    syncCustomSelect(purchaseCurrencySelect);
  });

  // ── Foreign toggle ──
  foreignCheckbox.addEventListener('change', () => {
    deliveryTimeGroup.hidden = !foreignCheckbox.checked;
    if (!foreignCheckbox.checked) deliveryTimeInput.value = '';
  });

  // ── Button state ──
  function updateButtonState() {
    const data = getFormData();
    calcBtn.disabled = !isFormFilled(data);
  }

  for (const input of allInputs) {
    input.addEventListener('input', () => {
      clearFieldError(input);
      updateButtonState();
      updateLivePreview();
      updateBreakeven();
    });
  }

  // Also listen on selects/checkboxes for live preview
  [platformSelect, vatRateSelect, purchaseCurrencySelect, includeVatCheckbox].forEach((el) => {
    el.addEventListener('change', () => { updateLivePreview(); updateBreakeven(); });
  });

  // ── Live preview (debounced) ──
  let previewTimeout;
  function updateLivePreview() {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
      const data = getFormData();
      if (!isFormFilled(data)) return;

      const result = calculate({
        purchasePrice: data.purchasePrice,
        shippingCost: data.shippingCost,
        sellingPrice: data.sellingPrice,
        commissionRate: data.commissionRate,
        adsCostPerItem: data.adsCostPerItem,
        packagingCost: data.packagingCost,
        returnRate: data.returnRate,
        vatRate: data.vatRate,
        includeVat: data.includeVat,
        purchaseCurrency: data.purchaseCurrency,
        quantity: data.quantity,
      });

      displayResults(result, data, false);
    }, 300);
  }

  // ── Break-even ──
  function updateBreakeven() {
    const data = getFormData();
    const desiredProfit = parseFloat(desiredProfitInput.value) || 0;

    if (data.purchasePrice === null || data.purchasePrice <= 0) {
      breakevenResult.textContent = '—';
      return;
    }

    const price = calculateBreakEven({
      purchasePrice: data.purchasePrice,
      shippingCost: data.shippingCost || 0,
      commissionRate: data.commissionRate || 0,
      adsCostPerItem: data.adsCostPerItem,
      packagingCost: data.packagingCost,
      returnRate: data.returnRate,
      desiredProfit,
      purchaseCurrency: data.purchaseCurrency,
      vatRate: data.vatRate,
      includeVat: data.includeVat,
    });

    if (price === null) {
      breakevenResult.textContent = 'Błąd: prowizja + zwroty ≥ 100%';
    } else {
      breakevenResult.textContent = `${price.toFixed(2)} zł`;
    }
  }

  desiredProfitInput.addEventListener('input', updateBreakeven);

  // ── Validation error display ──
  function clearAllErrors() {
    form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
    form.querySelectorAll('.error-message').forEach((el) => el.remove());
  }

  function clearFieldError(inputEl) {
    inputEl.classList.remove('input-error');
    const existing = inputEl.parentElement.querySelector('.error-message');
    if (existing) existing.remove();
  }

  function showErrors(errors) {
    clearAllErrors();
    for (const err of errors) {
      const input = document.getElementById(err.field);
      if (!input) continue;
      input.classList.add('input-error');
      const span = document.createElement('span');
      span.className = 'error-message';
      span.textContent = err.message;
      input.parentElement.appendChild(span);
    }
    if (errors.length > 0) {
      const firstField = document.getElementById(errors[0].field);
      if (firstField) firstField.focus();
    }
  }

  // ── Donut chart ──
  function drawDonut(segments) {
    const ctx = donutCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 160;
    donutCanvas.width = size * dpr;
    donutCanvas.height = size * dpr;
    donutCanvas.style.width = size + 'px';
    donutCanvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 60;
    const lineWidth = 20;
    const total = segments.reduce((s, seg) => s + Math.abs(seg.value), 0);

    ctx.clearRect(0, 0, size, size);

    if (total === 0) return;

    let startAngle = -Math.PI / 2;
    for (const seg of segments) {
      const sliceAngle = (Math.abs(seg.value) / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'butt';
      ctx.stroke();
      startAngle += sliceAngle;
    }

    // Legend
    chartLegend.innerHTML = segments.map((s) =>
      `<div class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}: ${s.value.toFixed(2)} zł</div>`
    ).join('');
  }

  // ── Animated counter ──
  function animateValue(el, start, end, suffix = '', duration = 600) {
    const startTime = performance.now();
    const diff = end - start;

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      el.textContent = current.toFixed(2) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Display results ──
  function displayResults(result, formData, animate = true) {
    const tier = getProfitTier(result.profit);

    resultsPlaceholder.hidden = true;
    resultsContent.hidden = false;

    if (animate) {
      animateValue(resultProfit, 0, result.profit, ' zł');
    } else {
      resultProfit.textContent = `${result.profit.toFixed(2)} zł`;
    }
    resultProfit.className = `result-profit tier-${tier}`;
    resultMargin.textContent = `Marża: ${result.marginPercent.toFixed(1)}%`;

    // Batch
    if (formData.quantity > 1) {
      resultBatch.hidden = false;
      batchValue.textContent = `${result.totalProfit.toFixed(2)} zł (${result.quantity} szt.)`;
    } else {
      resultBatch.hidden = true;
    }

    // Breakdown
    const rows = [
      ['Cena sprzedaży', `${formData.sellingPrice.toFixed(2)} zł`],
      ['Cena zakupu', `-${result.purchasePLN.toFixed(2)} zł`],
      ['Dostawa od dostawcy', `-${result.shippingPLN.toFixed(2)} zł`],
      [`Prowizja platformy (${formData.commissionRate}%)`, `-${result.commission.toFixed(2)} zł`],
    ];

    if (result.adsCostPerItem > 0)
      rows.push(['Koszt reklamy', `-${result.adsCostPerItem.toFixed(2)} zł`]);
    if (result.packagingCost > 0)
      rows.push(['Koszt pakowania', `-${result.packagingCost.toFixed(2)} zł`]);
    if (result.returnCost > 0)
      rows.push([`Koszt zwrotów (${formData.returnRate}%)`, `-${result.returnCost.toFixed(2)} zł`]);
    if (result.vatAmount > 0)
      rows.push([`VAT (${formData.vatRate}%)`, `-${result.vatAmount.toFixed(2)} zł`]);

    rows.push(['Całkowity koszt', `${result.totalCost.toFixed(2)} zł`, true]);

    resultBreakdown.innerHTML = rows.map(([label, value, isTotal]) =>
      `<div class="breakdown-row${isTotal ? ' total' : ''}"><span>${label}</span><span>${value}</span></div>`
    ).join('');

    // Break-even line
    resultBreakeven.innerHTML = `<div class="breakeven-line">Próg rentowności: <strong>${result.breakEvenPrice.toFixed(2)} zł</strong></div>`;

    // Donut chart
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    drawDonut([
      { label: 'Zakup', value: result.purchasePLN, color: isLight ? '#6366f1' : '#818cf8' },
      { label: 'Dostawa', value: result.shippingPLN, color: isLight ? '#8b5cf6' : '#a78bfa' },
      { label: 'Prowizja', value: result.commission, color: isLight ? '#ec4899' : '#f472b6' },
      { label: 'Inne koszty', value: result.adsCostPerItem + result.packagingCost + result.returnCost + result.vatAmount, color: isLight ? '#f59e0b' : '#fbbf24' },
      { label: 'Zysk', value: Math.max(result.profit, 0), color: isLight ? '#10b981' : '#34d399' },
    ].filter((s) => s.value > 0));

    // Interpretation
    const interpretationText = getInterpretationText(result.profit);
    resultInterpretation.textContent = interpretationText;
    resultInterpretation.className = `result-interpretation tier-${tier}`;
  }

  // ── Form submit ──
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors();

    const data = getFormData();
    const errors = validateForm(data);

    if (errors.length > 0) {
      showErrors(errors);
      return;
    }

    const result = calculate({
      purchasePrice: data.purchasePrice,
      shippingCost: data.shippingCost,
      sellingPrice: data.sellingPrice,
      commissionRate: data.commissionRate,
      adsCostPerItem: data.adsCostPerItem,
      packagingCost: data.packagingCost,
      returnRate: data.returnRate,
      vatRate: data.vatRate,
      includeVat: data.includeVat,
      purchaseCurrency: data.purchaseCurrency,
      quantity: data.quantity,
    });

    displayResults(result, data, true);

    saveEntry({
      timestamp: new Date().toISOString(),
      productName: data.productName.trim(),
      platform: data.platform,
      sellingPrice: data.sellingPrice,
      purchasePrice: data.purchasePrice,
      shippingCost: data.shippingCost,
      commissionRate: data.commissionRate,
      vatRate: data.vatRate,
      profit: result.profit,
      marginPercent: result.marginPercent,
    });

    refreshHistory();
    refreshStats();
    showToast('Obliczenie zapisane w historii');
    updateUrlState(data);
  });

  // ── Reset form ──
  resetBtn.addEventListener('click', () => {
    form.reset();
    commissionRateInput.value = PLATFORM_DEFAULTS.allegro;
    purchaseCurrencySelect.value = 'PLN';
    quantityInput.value = 1;
    adsCostInput.value = 0;
    packagingCostInput.value = 0;
    returnRateInput.value = 0;
    deliveryTimeGroup.hidden = true;
    resultsPlaceholder.hidden = false;
    resultsContent.hidden = true;
    clearAllErrors();
    updateButtonState();
    syncAllCustomSelects();
    history.replaceState(null, '', window.location.pathname);
    showToast('Formularz wyczyszczony', 'info');
  });

  // ── Presets ──
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const presets = {
        aliexpress: { name: 'Produkt z AliExpress', purchase: 15, shipping: 0, selling: 59.99, platform: 'aliexpress', commission: 8, currency: 'USD', foreign: true, delivery: '14-30 dni' },
        allegro: { name: 'Produkt z hurtowni PL', purchase: 25, shipping: 8, selling: 79.99, platform: 'allegro', commission: 12, currency: 'PLN', foreign: false, delivery: '' },
        temu: { name: 'Produkt z Temu', purchase: 10, shipping: 0, selling: 45.99, platform: 'temu', commission: 5, currency: 'USD', foreign: true, delivery: '7-14 dni' },
      };
      const p = presets[preset];
      if (!p) return;

      productNameInput.value = p.name;
      purchasePriceInput.value = p.purchase;
      shippingCostInput.value = p.shipping;
      sellingPriceInput.value = p.selling;
      platformSelect.value = p.platform;
      commissionRateInput.value = p.commission;
      purchaseCurrencySelect.value = p.currency;
      foreignCheckbox.checked = p.foreign;
      deliveryTimeGroup.hidden = !p.foreign;
      deliveryTimeInput.value = p.delivery;
      adsCostInput.value = 0;
      packagingCostInput.value = 0;
      returnRateInput.value = 0;
      quantityInput.value = 1;

      updateButtonState();
      updateLivePreview();
      updateBreakeven();
      syncAllCustomSelects();
      showToast(`Szablon "${preset}" załadowany`, 'info');
    });
  });

  // ── History ──
  function refreshHistory() {
    renderHistory(historyBody, historyEmpty, historyTable, {
      sortKey: historySort.key,
      sortDir: historySort.dir,
      filterPlatform: historyFilterPlatform.value,
      searchQuery: historySearch.value,
    });
  }

  function refreshStats() {
    const stats = getHistoryStats();
    if (stats.count === 0) {
      statsSection.hidden = true;
      return;
    }
    statsSection.hidden = false;
    statCount.textContent = stats.count;
    statAvgProfit.textContent = `${stats.avgProfit.toFixed(2)} zł`;
    statAvgMargin.textContent = `${stats.avgMargin.toFixed(1)}%`;
    statBest.textContent = stats.bestProduct || '—';
  }

  // Sort
  document.querySelectorAll('.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (historySort.key === key) {
        historySort.dir = historySort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        historySort.key = key;
        historySort.dir = 'desc';
      }
      // Update sort icons
      document.querySelectorAll('.sortable').forEach((el) => {
        el.querySelector('.sort-icon').textContent = '↕';
        el.classList.remove('sort-active');
      });
      th.classList.add('sort-active');
      th.querySelector('.sort-icon').textContent = historySort.dir === 'asc' ? '↑' : '↓';
      refreshHistory();
    });
  });

  // Filter & search
  historySearch.addEventListener('input', refreshHistory);
  historyFilterPlatform.addEventListener('change', refreshHistory);

  // Delete row
  historyBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete-row');
    if (!btn) return;
    const id = btn.dataset.id;
    deleteEntry(id);
    refreshHistory();
    refreshStats();
    showToast('Wpis usunięty', 'info');
  });

  // Clear all
  clearHistoryBtn.addEventListener('click', async () => {
    const ok = await showConfirm('Czy na pewno chcesz wyczyścić całą historię?');
    if (!ok) return;
    clearHistory();
    refreshHistory();
    refreshStats();
    showToast('Historia wyczyszczona');
  });

  // CSV export
  exportCsvBtn.addEventListener('click', () => {
    const result = exportHistoryCSV();
    if (result === null) {
      showToast('Brak danych do eksportu', 'error');
    } else {
      showToast('Plik CSV pobrany');
    }
  });

  // ── Share / URL state ──
  function updateUrlState(data) {
    const params = new URLSearchParams();
    params.set('name', data.productName);
    params.set('buy', data.purchasePrice);
    params.set('ship', data.shippingCost);
    params.set('sell', data.sellingPrice);
    params.set('plat', data.platform);
    params.set('comm', data.commissionRate);
    params.set('cur', data.purchaseCurrency);
    if (data.adsCostPerItem > 0) params.set('ads', data.adsCostPerItem);
    if (data.packagingCost > 0) params.set('pack', data.packagingCost);
    if (data.returnRate > 0) params.set('ret', data.returnRate);
    if (data.quantity > 1) params.set('qty', data.quantity);
    if (data.includeVat) params.set('vat', data.vatRate);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }

  function loadUrlState() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('name')) return false;

    productNameInput.value = params.get('name') || '';
    purchasePriceInput.value = params.get('buy') || '';
    shippingCostInput.value = params.get('ship') || '';
    sellingPriceInput.value = params.get('sell') || '';
    platformSelect.value = params.get('plat') || 'allegro';
    commissionRateInput.value = params.get('comm') || PLATFORM_DEFAULTS[platformSelect.value];
    purchaseCurrencySelect.value = params.get('cur') || 'PLN';
    if (params.has('ads')) adsCostInput.value = params.get('ads');
    if (params.has('pack')) packagingCostInput.value = params.get('pack');
    if (params.has('ret')) returnRateInput.value = params.get('ret');
    if (params.has('qty')) quantityInput.value = params.get('qty');
    if (params.has('vat')) {
      vatRateSelect.value = params.get('vat');
      includeVatCheckbox.checked = true;
    }

    return true;
  }

  shareBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link skopiowany do schowka');
    }).catch(() => {
      showToast('Nie udało się skopiować linku', 'error');
    });
  });

  // ── Init ──
  initTheme();
  refreshHistory();
  refreshStats();
  updateButtonState();

  const loaded = loadUrlState();
  if (loaded) {
    updateButtonState();
    updateLivePreview();
    updateBreakeven();
    syncAllCustomSelects();
  }

  // Custom selects
  initCustomSelects();

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
