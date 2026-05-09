/* ═══════════════════════════════════════════
   TableDesk PWA — app.js
   ═══════════════════════════════════════════ */

// ── CONFIG ──────────────────────────────────
const TOTAL_TABLES = 12;
const STORAGE_KEY  = 'tabledesk_orders_v2';

// ── STATE ───────────────────────────────────
let orders  = {};
let current = null;
let deferredInstallPrompt = null;

// ── SERVICE WORKER ───────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ── PWA INSTALL PROMPT ───────────────────────
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.getElementById('installBanner').classList.add('show');
});

window.addEventListener('appinstalled', () => {
  document.getElementById('installBanner').classList.remove('show');
  deferredInstallPrompt = null;
  showToast('✓ TableDesk installed successfully!');
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    document.getElementById('installBanner').classList.remove('show');
  }
  deferredInstallPrompt = null;
});

document.getElementById('installDismiss')?.addEventListener('click', () => {
  document.getElementById('installBanner').classList.remove('show');
});

// ── OFFLINE DETECTION ────────────────────────
function updateOnlineStatus() {
  const banner = document.getElementById('offlineBanner');
  if (!navigator.onLine) {
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ── PERSISTENCE ─────────────────────────────
function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    orders = raw ? JSON.parse(raw) : {};
  } catch {
    orders = {};
  }
}

function persistOrders() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    showToast('⚠ Storage full — clear some orders');
  }
}

// ── CLOCK ───────────────────────────────────
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
}

// ── STATS ───────────────────────────────────
function updateStats() {
  const activeList = Object.keys(orders).filter(k => orders[k]?.text?.trim());
  const active = activeList.length;
  const free   = TOTAL_TABLES - active;
  const items  = Object.values(orders)
    .reduce((s, o) => s + countLines(o?.text || ''), 0);

  setNum('stat-active', active);
  setNum('stat-free',   free);
  setNum('stat-items',  items);
}

function countLines(text) {
  return text.trim().split('\n').filter(l => l.trim()).length;
}

function setNum(id, val) {
  const el = document.getElementById(id);
  if (!el || el.textContent == val) return;
  el.style.transform = 'scale(1.25)';
  el.style.color = 'var(--accent)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.textContent = val;
    el.style.transform = '';
    el.style.color = '';
    el.style.transition = 'transform 0.3s, color 0.3s';
  }));
}

// ── TABLE GRID ──────────────────────────────
function buildGrid() {
  const grid = document.getElementById('tableGrid');
  grid.innerHTML = '';
  for (let i = 1; i <= TOTAL_TABLES; i++) {
    grid.appendChild(createCard(i));
  }
}

function createCard(num) {
  const id  = `table_${num}`;
  const ord = orders[id];
  const has = !!(ord?.text?.trim());

  const card = document.createElement('div');
  card.className = `table-card ${has ? 'has-order' : ''}`;
  card.id = `card_${id}`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Table ${num} ${has ? 'Active' : 'Free'}`);

  card.innerHTML = `
    <div class="card-number">Table</div>
    <div class="card-title">${num < 10 ? '0' + num : num}</div>
    <span class="card-status ${has ? 'active' : 'free'}">
      ${has ? '● Active' : '○ Free'}
    </span>
    ${has ? `<div class="card-preview">${escHtml(ord.text)}</div>` : ''}
    <span class="card-arrow">↗</span>
  `;

  // Touch & click
  card.addEventListener('click', () => openModal(num));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(num); }
  });

  return card;
}

function refreshCard(num) {
  const id  = `table_${num}`;
  const old = document.getElementById(`card_${id}`);
  if (old) old.replaceWith(createCard(num));
}

// ── MODAL ───────────────────────────────────
function openModal(num) {
  current = `table_${num}`;
  const ord = orders[current];

  document.getElementById('modalBadge').textContent    = `T${num}`;
  document.getElementById('modalTitle').textContent    = `Table ${num}`;
  document.getElementById('modalSubtitle').textContent =
    ord?.text?.trim() ? `Saved at ${ord.savedAt}` : 'No orders yet';

  const ta = document.getElementById('orderTextarea');
  ta.value = ord?.text || '';
  updateCharCount();
  renderPreview(ord);

  document.getElementById('overlay').classList.add('active');
  document.getElementById('modal').classList.add('active');
  document.getElementById('overlay').onclick = closeModal;
  document.body.style.overflow = 'hidden';

  // Focus textarea after animation
  setTimeout(() => ta.focus(), 320);
}

function closeModal() {
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('modal').classList.remove('active');
  document.body.style.overflow = '';
  current = null;
}

// ── SAVE / CLEAR ────────────────────────────
function saveOrder() {
  if (!current) return;
  const ta   = document.getElementById('orderTextarea');
  const text = ta.value.trim();
  const num  = extractNum(current);

  if (!text) {
    delete orders[current];
    persistOrders();
    refreshCard(num);
    updateStats();
    renderPreview(null);
    document.getElementById('modalSubtitle').textContent = 'No orders yet';
    showToast(`Table ${num} cleared`);
    return;
  }

  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  orders[current] = { text, savedAt: now };
  persistOrders();
  refreshCard(num);
  updateStats();
  renderPreview(orders[current]);
  document.getElementById('modalSubtitle').textContent = `Saved at ${now}`;

  // Haptic feedback on supported devices
  if (navigator.vibrate) navigator.vibrate(50);

  showToast(`✓ Order saved — Table ${num}`);
}

function clearOrder() {
  const ta = document.getElementById('orderTextarea');
  ta.value = '';
  ta.focus();
  updateCharCount();
}

// ── PREVIEW ─────────────────────────────────
function renderPreview(ord) {
  const box = document.getElementById('savedPreview');
  if (ord?.text?.trim()) {
    document.getElementById('previewContent').textContent = ord.text;
    document.getElementById('previewTime').textContent    = ord.savedAt || '';
    box.classList.add('visible');
  } else {
    box.classList.remove('visible');
  }
}

// ── CHAR COUNT ──────────────────────────────
function updateCharCount() {
  const ta = document.getElementById('orderTextarea');
  document.getElementById('charCount').textContent = ta.value.length;
}

document.getElementById('orderTextarea')
  .addEventListener('input', updateCharCount);

// ── DRAG-TO-DISMISS (mobile) ─────────────────
(function initDragDismiss() {
  const handle = document.getElementById('dragHandle');
  const modal  = document.getElementById('modal');
  let startY = 0, currentY = 0, dragging = false;

  handle.addEventListener('touchstart', e => {
    startY   = e.touches[0].clientY;
    dragging = true;
    modal.style.transition = 'none';
  }, { passive: true });

  handle.addEventListener('touchmove', e => {
    if (!dragging) return;
    currentY = e.touches[0].clientY - startY;
    if (currentY < 0) return;
    modal.style.transform = `translateY(${currentY}px)`;
  }, { passive: true });

  handle.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    modal.style.transition = '';
    if (currentY > 100) {
      modal.style.transform = '';
      closeModal();
    } else {
      modal.style.transform = '';
    }
    currentY = 0;
  });
})();

// ── KEYBOARD ────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (current) saveOrder();
  }
});

// ── TOAST ───────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ── HELPERS ─────────────────────────────────
function extractNum(id) { return id.replace('table_', ''); }

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── INIT ────────────────────────────────────
(function init() {
  loadOrders();
  buildGrid();
  updateStats();
  updateClock();
  setInterval(updateClock, 30000);
})();
