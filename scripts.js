/* ─────────────────────────────────────────────────
   STARK — Improved Scripts
   - Modular structure with clear separation of concerns
   - No inline event handlers (onclick="")
   - Proper event delegation
   - Timer persists across stop/resume
   - Keyboard shortcuts (Enter on modals, Escape to close)
   - Toast notification system
   - Safe localStorage with error recovery
   - Snowflakes only in Christmas mode
───────────────────────────────────────────────── */

// ── STATE ──────────────────────────────────────
const state = {
  notes: [],
  todos: [],
  timerLogs: [],
  seconds: 0,
  timerInterval: null,
  isRunning: false,
  isDarkMode: false,
  isChristmasMode: false,
  currentNoteIndex: null,
  noteToDelete: null,
  snowflakes: [],
};

// ── LOCAL STORAGE HELPERS ──────────────────────
function lsGet(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { localStorage.removeItem(key); return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── DOM HELPERS ───────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const pad = (n) => String(n).padStart(2, '0');

function formatDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${pad(m)}m ${pad(s)}s`;
}

// ── TOAST ────────────────────────────────────
let _toastTimer;
function showToast(msg, duration = 2600) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── MODAL SYSTEM ─────────────────────────────
function openModal(id) {
  const m = $(`#${id}`);
  if (m) m.classList.add('show');
  $('#overlay')?.classList.add('active');
}
function closeModal(id) {
  const m = $(`#${id}`);
  if (m) m.classList.remove('show');
  // Only remove overlay if no other modal is open
  if (!$$('.modal.show').length) {
    $('#overlay')?.classList.remove('active');
  }
}
function closeAllModals() {
  $$('.modal').forEach(m => m.classList.remove('show'));
  $('#overlay')?.classList.remove('active');
}

// ── MOTIVATION ───────────────────────────────
function initMotivation() {
  const toggle   = $('#thought-toggle');
  const dropdown = $('#thought-dropdown');
  const display  = $('#current-thought');

  const saved = lsGet('motivation');
  if (saved) display.textContent = saved;

  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.motivation-bar')) {
      dropdown?.classList.remove('show');
    }
  });

  $$('.thought-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (opt.id === 'custom-thought') {
        openModal('custom-thought-popup');
        setTimeout(() => $('#custom-thought-input')?.focus(), 50);
      } else {
        const thought = opt.dataset.thought;
        display.textContent = thought;
        lsSet('motivation', thought);
        dropdown.classList.remove('show');
      }
    });
  });

  $('#save-custom-thought-btn')?.addEventListener('click', () => {
    const val = $('#custom-thought-input')?.value.trim();
    if (val) {
      display.textContent = val;
      lsSet('motivation', val);
      $('#custom-thought-input').value = '';
      closeModal('custom-thought-popup');
      dropdown?.classList.remove('show');
    }
  });

  $('#cancel-custom-thought-btn')?.addEventListener('click', () => closeModal('custom-thought-popup'));

  $('#custom-thought-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#save-custom-thought-btn')?.click();
  });
}

// ── NOTES ────────────────────────────────────
function renderNotes() {
  const container = $('#notes-container');
  if (!container) return;
  container.innerHTML = '';

  if (!state.notes.length) {
    container.innerHTML = '<div class="empty-state">No notes yet — add your first one!</div>';
    return;
  }

  state.notes.forEach((note, idx) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <h3>${escapeHTML(note.title)}</h3>
      <div class="note-preview">${escapeHTML(note.content)}</div>
      <div class="note-timestamp">${note.timestamp || ''}</div>
      <div class="note-actions">
        <button class="edit-btn" data-idx="${idx}" title="Edit">✏️</button>
        <button class="delete-btn" data-idx="${idx}" title="Delete">🗑️</button>
      </div>`;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.edit-btn, .delete-btn')) openViewPopup(idx);
    });
    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openAddEditPopup(true, idx);
    });
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      state.noteToDelete = idx;
      $('#delete-msg').textContent = state.isChristmasMode
        ? 'Ho Ho Ho! Should we remove this from the naughty list?'
        : 'This action cannot be undone.';
      openModal('delete-confirm-popup');
    });
    container.appendChild(card);
  });
}

function openAddEditPopup(isEdit = false, idx = null) {
  state.currentNoteIndex = isEdit ? idx : null;
  const header = $('#popup-header');
  if (header) header.textContent = isEdit ? 'Edit Note' : 'New Note';

  const titleInput   = $('#note-title-input');
  const contentInput = $('#note-content-input');

  if (isEdit && idx !== null && state.notes[idx]) {
    if (titleInput)   titleInput.value   = state.notes[idx].title;
    if (contentInput) contentInput.value = state.notes[idx].content;
  } else {
    if (titleInput)   titleInput.value   = '';
    if (contentInput) contentInput.value = '';
  }

  updateCharCount();
  openModal('add-edit-popup');
  setTimeout(() => titleInput?.focus(), 60);
}

function closeAddEditPopup() {
  closeModal('add-edit-popup');
  $('#note-title-input').value   = '';
  $('#note-content-input').value = '';
  state.currentNoteIndex = null;
}

function saveNote() {
  const title   = $('#note-title-input')?.value.trim();
  const content = $('#note-content-input')?.value.trim();
  if (!title) { showToast('Please enter a title.'); return; }
  if (!content) { showToast('Please enter some content.'); return; }

  const note = { title, content, timestamp: new Date().toLocaleString() };
  if (state.currentNoteIndex !== null) {
    state.notes[state.currentNoteIndex] = note;
    showToast('Note updated ✓');
  } else {
    state.notes.unshift(note);
    showToast('Note saved ✓');
  }

  lsSet('notes', state.notes);
  closeAddEditPopup();
  renderNotes();
}

function openViewPopup(idx) {
  const note = state.notes[idx];
  if (!note) return;
  state.currentNoteIndex = idx;
  $('#view-popup-title').textContent   = note.title;
  $('#view-popup-content').value       = note.content;
  $('#view-popup-timestamp').textContent = note.timestamp || '';
  openModal('view-popup');
}

function updateCharCount() {
  const len = ($('#note-content-input')?.value || '').length;
  const el  = $('#content-char-count');
  if (el) el.textContent = len;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function initNotes() {
  $('#add-note-btn')?.addEventListener('click', () => openAddEditPopup(false));
  $('#save-note-btn')?.addEventListener('click', saveNote);
  $('#cancel-add-btn')?.addEventListener('click', closeAddEditPopup);
  $('#close-view-popup-btn')?.addEventListener('click', () => closeModal('view-popup'));

  $('#edit-from-view-btn')?.addEventListener('click', () => {
    const idx = state.currentNoteIndex;
    closeModal('view-popup');
    openAddEditPopup(true, idx);
  });

  $('#confirm-delete-btn')?.addEventListener('click', () => {
    if (state.noteToDelete !== null) {
      state.notes.splice(state.noteToDelete, 1);
      lsSet('notes', state.notes);
      state.noteToDelete = null;
      closeModal('delete-confirm-popup');
      renderNotes();
      showToast('Note deleted');
    }
  });

  $('#cancel-delete-btn')?.addEventListener('click', () => closeModal('delete-confirm-popup'));

  $('#note-content-input')?.addEventListener('input', updateCharCount);

  // Enter to save in add/edit modal (Ctrl+Enter)
  $('#note-content-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) saveNote();
  });

  renderNotes();
}

// ── TO-DO ────────────────────────────────────
function displayTodos() {
  const list = $('#todo-list');
  if (!list) return;
  list.innerHTML = '';

  const sorted = [...state.todos].map((t, i) => ({ ...t, _i: i }))
    .sort((a, b) => a.completed - b.completed);

  sorted.forEach(({ name, completed, _i: idx }) => {
    const li = document.createElement('li');
    if (completed) li.classList.add('completed');
    li.innerHTML = `<span class="task-name">${escapeHTML(name)}</span>
      <div class="task-controls">
        <button class="tick-button${completed ? ' undo' : ''}" data-idx="${idx}" title="${completed ? 'Undo' : 'Complete'}">${completed ? '↩' : '✓'}</button>
        <button class="delete-button" data-idx="${idx}" title="Delete">✕</button>
      </div>`;
    li.querySelector('.tick-button').addEventListener('click', () => {
      state.todos[idx].completed = !state.todos[idx].completed;
      lsSet('todos', state.todos);
      updateProgress();
      displayTodos();
      if (state.todos[idx].completed) {
        showToast(state.isChristmasMode ? '🎁 Ho Ho Ho! Task complete!' : '🎉 Task completed!');
      }
    });
    li.querySelector('.delete-button').addEventListener('click', () => {
      state.todos.splice(idx, 1);
      lsSet('todos', state.todos);
      displayTodos();
      updateProgress();
    });
    list.appendChild(li);
  });

  updateProgress();
}

function updateProgress() {
  const total = state.todos.length;
  const done  = state.todos.filter(t => t.completed).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const bar   = $('#todo-progress');
  const label = $('#progress-label');
  const badge = $('#todo-counter');
  if (bar)   bar.style.width   = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
  if (badge) badge.textContent = `${done} / ${total}`;
}

function initTodos() {
  const form  = $('#todo-form');
  const input = $('#todo-input');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const task = input?.value.trim();
    if (!task) return;
    state.todos.push({ name: task, completed: false });
    lsSet('todos', state.todos);
    displayTodos();
    input.value = '';
    input.focus();
  });

  displayTodos();
}

// ── TIMER ─────────────────────────────────────
function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.isRunning = true;
  const display  = $('#timer-display');
  const startBtn = $('#start-timer');
  if (display) display.classList.add('running');
  if (startBtn) { startBtn.textContent = '⏹ Stop'; startBtn.classList.add('stop'); }

  state.timerInterval = setInterval(() => {
    state.seconds++;
    if (display) display.textContent = `${pad(Math.floor(state.seconds / 60))}:${pad(state.seconds % 60)}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.isRunning = false;
  const display  = $('#timer-display');
  const startBtn = $('#start-timer');
  if (display) { display.classList.remove('running'); display.classList.add('stopped'); }
  if (startBtn) { startBtn.textContent = '▶ Start'; startBtn.classList.remove('stop'); }

  if (state.seconds >= 5) {
    $('#session-popup-title').textContent = state.isChristmasMode ? '🎁 Session complete!' : '⏱ Session Complete';
    $('#session-duration-display').textContent = `Duration: ${formatDuration(state.seconds)}`;
    $('#session-task-name').value = '';
    openModal('session-popup');
    setTimeout(() => $('#session-task-name')?.focus(), 60);
  }
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.isRunning = false;
  state.seconds   = 0;
  const display  = $('#timer-display');
  const startBtn = $('#start-timer');
  if (display) { display.textContent = '00:00'; display.classList.remove('running', 'stopped'); }
  if (startBtn) { startBtn.textContent = '▶ Start'; startBtn.classList.remove('stop'); }
}

function displayTimerLogs() {
  const container = $('#timer-logs');
  if (!container) return;
  container.innerHTML = '';
  if (!state.timerLogs.length) {
    container.innerHTML = '<div class="empty-state" style="padding:14px;font-size:.82rem;">No sessions logged yet.</div>';
    return;
  }
  [...state.timerLogs].reverse().forEach((log, rIdx) => {
    const idx = state.timerLogs.length - 1 - rIdx;
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<div><strong>${escapeHTML(log.task)}</strong><br><span>${log.duration} &mdash; ${log.timestamp}</span></div>
      <button class="log-delete" data-idx="${idx}" title="Delete log">🗑</button>`;
    div.querySelector('.log-delete').addEventListener('click', () => {
      state.timerLogs.splice(idx, 1);
      lsSet('timerLogs', state.timerLogs);
      displayTimerLogs();
    });
    container.appendChild(div);
  });
}

function initTimer() {
  $('#start-timer')?.addEventListener('click', () => {
    state.isRunning ? stopTimer() : startTimer();
  });

  $('#reset-timer')?.addEventListener('click', resetTimer);

  $('#save-session-btn')?.addEventListener('click', () => {
    const name = $('#session-task-name')?.value.trim();
    if (!name) { showToast('Please enter a task name.'); return; }
    state.timerLogs.push({ task: name, duration: formatDuration(state.seconds), timestamp: new Date().toLocaleString() });
    lsSet('timerLogs', state.timerLogs);
    closeModal('session-popup');
    resetTimer();
    displayTimerLogs();
    showToast('Session saved ✓');
  });

  $('#discard-session-btn')?.addEventListener('click', () => {
    closeModal('session-popup');
    resetTimer();
  });

  $('#session-task-name')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#save-session-btn')?.click();
  });

  displayTimerLogs();
}

// ── CALCULATOR ────────────────────────────────
function initCalculator() {
  let expr = '';

  const display = $('#calc-display');
  const exprEl  = $('#calc-expr');

  function updateDisplay(val) {
    if (display) display.textContent = val.length > 14 ? val.slice(-14) : val;
    if (exprEl)  exprEl.textContent  = expr.length > 24 ? '…' + expr.slice(-24) : expr;
  }

  function calculate() {
    try {
      if (!expr) return;
      const safe = expr.replace(/[^0-9+\-*/.()^]/g, '').replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + safe + ')')();
      if (!isFinite(result)) throw new Error('Not finite');
      const formatted = parseFloat(result.toFixed(10)).toString();
      expr = formatted;
      updateDisplay(formatted);
    } catch {
      updateDisplay('Error');
      setTimeout(() => { expr = ''; updateDisplay('0'); }, 1500);
    }
  }

  function handleKey(action, value) {
    switch (action) {
      case 'clear':   expr = ''; updateDisplay('0'); break;
      case 'equals':  calculate(); break;
      default:
        if (expr === '0' && /[0-9]/.test(value)) expr = value;
        else expr += value;
        updateDisplay(expr);
    }
  }

  // Mouse clicks
  $('.calculator-keys')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.calc-key');
    if (!btn) return;
    handleKey(btn.dataset.action || '', btn.dataset.value || '');
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if ($('.modal.show')) return; // Don't intercept when modal is open
    const map = { Enter: ['equals', ''], Backspace: ['back', ''], Escape: ['clear', ''] };
    if (map[e.key]) { handleKey(...map[e.key]); return; }
    if (/[0-9+\-*/.()^]/.test(e.key)) handleKey('', e.key);
  });

  // Backspace
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !$('.modal.show')) {
      expr = expr.slice(0, -1) || '';
      updateDisplay(expr || '0');
    }
  });
}

// ── THEME ────────────────────────────────────
function updateTheme() {
  const body = document.body;
  body.classList.toggle('dark-mode',      state.isDarkMode && !state.isChristmasMode);
  body.classList.toggle('christmas-mode', state.isChristmasMode);

  const themeBtn = $('#theme-toggle');
  const xmasBtn  = $('#christmas-theme-toggle');

  if (themeBtn) themeBtn.title = state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  if (themeBtn) themeBtn.textContent = state.isDarkMode && !state.isChristmasMode ? '☀️' : '🌙';
  if (xmasBtn)  xmasBtn.textContent  = state.isChristmasMode ? '🎄✓' : '🎄';

  manageSnowflakes();
}

let snowflakeInterval = null;
function manageSnowflakes() {
  if (state.isChristmasMode) {
    if (snowflakeInterval) return;
    // Remove existing
    $$('.snowflake').forEach(s => s.remove());
    // Create snowflakes
    const flakes = ['❄', '❅', '❆', '✦', '✧'];
    function spawnFlake() {
      const el = document.createElement('span');
      el.className = 'snowflake';
      el.textContent = flakes[Math.floor(Math.random() * flakes.length)];
      el.style.left   = `${Math.random() * 100}vw`;
      el.style.fontSize = `${.6 + Math.random() * .8}em`;
      el.style.animationDuration  = `${5 + Math.random() * 8}s`;
      el.style.animationDelay     = `${Math.random() * 2}s`;
      el.style.opacity = .5 + Math.random() * .5;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 14000);
    }
    spawnFlake();
    snowflakeInterval = setInterval(spawnFlake, 600);
  } else {
    clearInterval(snowflakeInterval);
    snowflakeInterval = null;
    $$('.snowflake').forEach(s => s.remove());
  }
}

function initTheme() {
  state.isDarkMode      = lsGet('darkMode', false);
  state.isChristmasMode = lsGet('christmasMode', false);
  updateTheme();

  $('#theme-toggle')?.addEventListener('click', () => {
    state.isChristmasMode = false;
    state.isDarkMode = !state.isDarkMode;
    lsSet('darkMode', state.isDarkMode);
    lsSet('christmasMode', false);
    updateTheme();
  });

  $('#christmas-theme-toggle')?.addEventListener('click', () => {
    state.isDarkMode = false;
    state.isChristmasMode = !state.isChristmasMode;
    lsSet('darkMode', false);
    lsSet('christmasMode', state.isChristmasMode);
    updateTheme();
    showToast(state.isChristmasMode ? '🎄 Ho Ho Ho! Christmas mode on!' : 'Christmas mode off');
  });
}

// ── GLOBAL KEYBOARD ──────────────────────────
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Overlay click closes modals
  $('#overlay')?.addEventListener('click', closeAllModals);
}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Load state from localStorage
  state.notes      = lsGet('notes', []);
  state.todos      = lsGet('todos', []);
  state.timerLogs  = lsGet('timerLogs', []);

  // Boot
  initTheme();
  initKeyboard();
  initMotivation();
  initNotes();
  initTodos();
  initTimer();
  initCalculator();
});
