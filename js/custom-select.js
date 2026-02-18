const instances = new Map();

function buildCustomSelect(nativeSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cs-wrapper';
  // Preserve any classes on the parent .form-group for narrow selects
  if (nativeSelect.closest('.form-group-narrow')) {
    wrapper.classList.add('cs-narrow');
  }

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const valueSpan = document.createElement('span');
  valueSpan.className = 'cs-value';

  const arrowSvg = `<svg class="cs-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  trigger.appendChild(valueSpan);
  trigger.insertAdjacentHTML('beforeend', arrowSvg);

  const dropdown = document.createElement('div');
  dropdown.className = 'cs-dropdown';
  dropdown.setAttribute('role', 'listbox');

  function buildOptions() {
    dropdown.innerHTML = '';
    Array.from(nativeSelect.options).forEach((opt) => {
      const item = document.createElement('div');
      item.className = 'cs-option';
      item.setAttribute('role', 'option');
      item.dataset.value = opt.value;
      item.textContent = opt.text;
      if (opt.selected) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        valueSpan.textContent = opt.text;
      }
      dropdown.appendChild(item);
    });
  }
  buildOptions();

  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);

  // Insert wrapper before the native select, then move native inside wrapper
  nativeSelect.parentNode.insertBefore(wrapper, nativeSelect);
  wrapper.appendChild(nativeSelect);

  let open = false;

  function close() {
    if (!open) return;
    open = false;
    dropdown.classList.remove('cs-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function show() {
    // Close all other open custom selects
    instances.forEach((inst) => inst.close());
    open = true;
    dropdown.classList.add('cs-open');
    trigger.setAttribute('aria-expanded', 'true');
    // Scroll selected option into view
    const sel = dropdown.querySelector('.cs-option.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function sync() {
    const selOpt = nativeSelect.options[nativeSelect.selectedIndex];
    if (!selOpt) return;
    valueSpan.textContent = selOpt.text;
    dropdown.querySelectorAll('.cs-option').forEach((item) => {
      const isSelected = item.dataset.value === nativeSelect.value;
      item.classList.toggle('selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    });
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    open ? close() : show();
  });

  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.cs-option');
    if (!item) return;
    nativeSelect.value = item.dataset.value;
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    sync();
    close();
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open ? close() : show();
    }
    if (e.key === 'Escape') { close(); trigger.focus(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) show();
      const items = [...dropdown.querySelectorAll('.cs-option')];
      const curr = items.findIndex((i) => i.classList.contains('selected'));
      const next = e.key === 'ArrowDown'
        ? Math.min(curr + 1, items.length - 1)
        : Math.max(curr - 1, 0);
      if (items[next]) items[next].click();
    }
    if (e.key === 'Tab') close();
  });

  const instance = { close, sync };
  instances.set(nativeSelect, instance);
  return instance;
}

export function initCustomSelects(root = document) {
  root.querySelectorAll('select').forEach((sel) => {
    if (!instances.has(sel)) buildCustomSelect(sel);
  });
}

export function syncCustomSelect(nativeSelect) {
  instances.get(nativeSelect)?.sync();
}

export function syncAllCustomSelects() {
  instances.forEach((inst) => inst.sync());
}

// Close dropdowns on outside click
document.addEventListener('click', () => {
  instances.forEach((inst) => inst.close());
});
