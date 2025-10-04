// Global variables
let currentNoteIndex = null;
let noteToDelete = null;
let notes = [];
let todos = [];
let timerLogs = [];
let seconds = 0;
let timerInterval;
let isRunning = false;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let isChristmasMode = localStorage.getItem('christmasMode') === 'true';

// Expose helper functions globally
window.saveCustomThought = function () {
    const customInput = document.getElementById('custom-thought-input');
    if (customInput.value.trim()) {
        document.getElementById('current-thought').textContent = customInput.value;
        closePopup();
        if (thoughtDropdown) {
            thoughtDropdown.classList.remove('show');
        }
    }
};

window.closePopup = function () {
    const popup = document.querySelector('.popup');
    if (popup) popup.remove();
};

window.editNote = function (index) {
    currentNoteIndex = index;
    openAddEditPopup(true);
};

window.deleteNote = function (index) {
    noteToDelete = index;
    const deletePopup = document.getElementById('delete-confirm-popup');
    const msg = isChristmasMode
        ? 'Ho Ho Ho! Should we delete this naughty list?'
        : 'Are you sure you want to delete this note?';
    deletePopup.querySelector('p').textContent = msg;
    deletePopup.classList.add('show');
    document.querySelector('.overlay').classList.add('active');
};

window.closeDeletePopup = function () {
    document.getElementById('delete-confirm-popup').classList.remove('show');
    document.querySelector('.overlay').classList.remove('active');
    noteToDelete = null;
};

window.saveSessionLog = function () {
    const taskName = document.getElementById('session-task-name').value.trim();
    if (taskName) {
        timerLogs.push({
            task: taskName,
            duration: formatDuration(seconds),
            timestamp: new Date().toLocaleString(),
        });
        localStorage.setItem('timerLogs', JSON.stringify(timerLogs));
        displayTimerLogs();
    }
    closePopup();
    resetTimer();
};

window.closeCongratsPopup = function () {
    const popup = document.querySelector('.popup');
    if (popup) popup.remove();
};

// Helper utilities
const pad = (n) => (n < 10 ? '0' + n : n);
function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${pad(m)} min ${pad(s)} sec`;
}
function resetTimer() {
    seconds = 0;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = '00:00';
    isRunning = false;
    const btn = document.getElementById('start-timer');
    if (btn) {
        btn.textContent = 'Start Timer';
        btn.classList.remove('stop');
    }
}

function openAddEditPopup(isEdit = false) {
  const header = document.getElementById('popup-header');
    const popup = document.getElementById('add-edit-popup');
    const overlay = document.querySelector('.overlay');
    if (popup) popup.classList.add('show');
    if (overlay) overlay.classList.add('active');

    if (isEdit && currentNoteIndex !== null) {
        header.textContent = 'Edit Note';
        document.getElementById('note-title-input').value =
            notes[currentNoteIndex].title;
        document.getElementById('note-content-input').value =
            notes[currentNoteIndex].content;
    } else {
        header.textContent = 'Add Note';
        document.getElementById('note-title-input').value = '';
        document.getElementById('note-content-input').value = '';
    }
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Load persisted data
    try {
        notes = JSON.parse(localStorage.getItem('notes')) || [];
    } catch {
        notes = [];
        localStorage.removeItem('notes');
    }
    try {
        todos = JSON.parse(localStorage.getItem('todos')) || [];
    } catch {
        todos = [];
        localStorage.removeItem('todos');
    }
    try {
        timerLogs = JSON.parse(localStorage.getItem('timerLogs')) || [];
    } catch {
        timerLogs = [];
        localStorage.removeItem('timerLogs');
    }

    // Cache DOM nodes
    const thoughtContainer = document.querySelector('.thought-container');
    const currentThought = document.getElementById('current-thought');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const thoughtDropdown = document.querySelector('.thought-dropdown');
    const notesContainer = document.getElementById('notes-container');
    const addNoteBtn = document.getElementById('add-note-btn');
    const addEditPopup = document.getElementById('add-edit-popup');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentInput = document.getElementById('note-content-input');
    const viewPopup = document.getElementById('view-popup');
    const viewPopupTitle = document.getElementById('view-popup-title');
    const viewPopupContent = document.getElementById('view-popup-content');
    const closeViewBtn = document.getElementById('close-view-popup-btn');
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerBtn = document.getElementById('start-timer');
    const logsContainer = document.getElementById('timer-logs');
    const themeToggle = document.getElementById('theme-toggle');
    const xmasToggle = document.getElementById('christmas-theme-toggle');

    // Overlay helper
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
    }

    // Motivation dropdown
    if (dropdownArrow) {
        dropdownArrow.addEventListener('click', () =>
            thoughtDropdown.classList.toggle('show')
        );
    }
    document.addEventListener('click', (e) => {
        if (thoughtContainer && !thoughtContainer.contains(e.target)) {
            thoughtDropdown.classList.remove('show');
        }
    });
    document.querySelectorAll('.thought-option').forEach((opt) => {
        opt.addEventListener('click', () => {
            if (opt.id === 'custom-thought') {
                showCustomThoughtPopup();
            } else {
                currentThought.textContent = opt.dataset.thought;
                thoughtDropdown.classList.remove('show');
            }
        });
    });

    function showCustomThoughtPopup() {
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.innerHTML = `
        <div class="popup-content">
          <h2>Custom Thought</h2>
          <p>Enter your motivational thought:</p>
          <input id="custom-thought-input" maxlength="40" placeholder="Enter your thought">
          <button onclick="saveCustomThought()">Save</button>
          <button onclick="closePopup()">Cancel</button>
        </div>`;
        document.body.appendChild(popup);
    }

    // Notes
    function renderNotes() {
        if (!notesContainer) return;
        notesContainer.innerHTML = '';
        if (!notes.length) {
            notesContainer.innerHTML =
                '<div class="no-notes">No notes yet. Click "Add Note" to create one.</div>';
            return;
        }
        notes.forEach((note, idx) => {
            const card = document.createElement('div');
            card.className = 'note-card';
            const title =
                note.title.length > 30
                    ? note.title.substring(0, 30) + '…'
                    : note.title;
            card.innerHTML = `
            <h3>${title}</h3>
            <div class="note-actions">
              <button class="edit-btn" onclick="editNote(${idx})">✏️</button>
              <button class="delete-btn" onclick="deleteNote(${idx})">🗑️</button>
            </div>`;
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.edit-btn, .delete-btn'))
                    openViewPopup(idx);
            });
            notesContainer.appendChild(card);
        });
    }
    if (addNoteBtn)
        addNoteBtn.addEventListener('click', () => {
            currentNoteIndex = null;
            openAddEditPopup(false);
        });
    function closeAddEditPopup() {
        addEditPopup?.classList.remove('show');
        overlay?.classList.remove('active');
        if (noteTitleInput) noteTitleInput.value = '';
        if (noteContentInput) noteContentInput.value = '';
    }
    function saveNote() {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        if (title && content) {
            const note = { title, content, timestamp: new Date().toLocaleString() };
            if (currentNoteIndex !== null) {
                notes[currentNoteIndex] = note;
            } else {
                notes.push(note);
            }
            localStorage.setItem('notes', JSON.stringify(notes));
            closeAddEditPopup();
            renderNotes();
        }
    }
    function openViewPopup(idx) {
        if (!viewPopup || !viewPopupTitle || !viewPopupContent) return;
        currentNoteIndex = idx;
        viewPopup.classList.add('show');
        overlay.classList.add('active');
        viewPopupTitle.textContent = notes[idx].title;
        viewPopupContent.value = notes[idx].content;
        const ts = document.getElementById('view-popup-timestamp');
        if (ts) ts.textContent = notes[idx].timestamp || 'No timestamp';
    }
    function closeViewPopup() {
        viewPopup?.classList.remove('show');
        overlay?.classList.remove('active');
    }

    // To-Dos
    function displayTodos() {
        if (!todoList) return;
        todoList.innerHTML = '';
        todos.forEach((todo, idx) => {
            const li = document.createElement('li');
            li.textContent = todo.name;
            if (todo.completed) li.classList.add('completed');
            const controls = document.createElement('div');
            controls.className = 'task-controls';
            const tick = document.createElement('button');
            tick.textContent = todo.completed ? '✗' : '✓';
            tick.className = todo.completed ? 'delete-button' : 'tick-button';
            tick.addEventListener('click', () => {
                todo.completed = !todo.completed;
                localStorage.setItem('todos', JSON.stringify(todos));
                displayTodos();
                updateProgress();
                if (todo.completed) showCongratsPopup();
            });
            const del = document.createElement('button');
            del.textContent = '🗑';
            del.className = 'delete-button';
            del.addEventListener('click', () => {
                todos.splice(idx, 1);
                localStorage.setItem('todos', JSON.stringify(todos));
                displayTodos();
                updateProgress();
            });
            controls.append(tick, del);
            li.appendChild(controls);
            todoList.prepend(li);
        });
        updateProgress();
    }
    if (todoForm) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const task = todoInput.value.trim();
            if (task) {
                todos.push({ name: task, completed: false });
                localStorage.setItem('todos', JSON.stringify(todos));
                displayTodos();
                todoInput.value = '';
                updateProgress();
            }
        });
    }
    function updateProgress() {
        const bar = document.getElementById('todo-progress');
        if (!bar) return;
        const total = todos.length;
        const done = todos.filter((t) => t.completed).length;
        bar.style.width = total ? `${(done / total) * 100}%` : '0%';
    }
    function showCongratsPopup() {
        const popup = document.createElement('div');
        popup.className = 'popup';
        const msg = isChristmasMode
            ? 'Ho Ho Ho! You deserve presents now!'
            : 'Congratulations! You completed a task successfully!';
        popup.innerHTML = `<div class="popup-content"><h2>${msg}</h2><button onclick="closeCongratsPopup()">Close</button></div>`;
        document.body.appendChild(popup);
    }

    // Timer
    if (startTimerBtn) {
        startTimerBtn.addEventListener('click', () => {
            if (!isRunning) {
                isRunning = true;
                startTimerBtn.textContent = 'Stop Timer';
                startTimerBtn.classList.add('stop');
                startTimer();
            } else {
                isRunning = false;
                startTimerBtn.textContent = 'Start Timer';
                startTimerBtn.classList.remove('stop');
                stopTimer();
            }
        });
    }
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        seconds = 0;
        if (timerDisplay) timerDisplay.textContent = '00:00';
        timerInterval = setInterval(() => {
            seconds++;
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            if (timerDisplay) timerDisplay.textContent = `${pad(m)}:${pad(s)}`;
        }, 1000);
    }
    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
        if (timerDisplay) timerDisplay.textContent = '00:00';
        if (seconds >= 5) showSessionPopup();
    }
    function showSessionPopup() {
        const popup = document.createElement('div');
        popup.className = 'popup';
        const msg = isChristmasMode
            ? 'Ho Ho Ho! Which gift you packed now?'
            : 'Which task does this session belong to?';
        popup.innerHTML = `
        <div class="popup-content">
          <h2>Session Log</h2>
          <p>${msg}</p>
          <input id="session-task-name" maxlength="30" placeholder="Enter task name">
          <button onclick="saveSessionLog()">Save</button>
          <button onclick="closePopup()">Close</button>
        </div>`;
        document.body.appendChild(popup);
    }
    function displayTimerLogs() {
        if (!logsContainer) return;
        logsContainer.innerHTML = '';
        timerLogs.forEach((log, idx) => {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.innerHTML = `<span>[${log.timestamp}] Task: ${log.task} | ${log.duration}</span>
            <button class="log-delete" data-idx="${idx}">🗑</button>`;
            div
                .querySelector('.log-delete')
                .addEventListener('click', (e) => {
                    timerLogs.splice(e.target.dataset.idx, 1);
                    localStorage.setItem('timerLogs', JSON.stringify(timerLogs));
                    displayTimerLogs();
                });
            logsContainer.prepend(div);
        });
    }

    // Calculator
    const calc = { displayValue: '0', expression: '' };
    const keys = document.querySelector('.calculator-keys');
    if (keys) {
        keys.addEventListener('click', (e) => {
            const t = e.target;
            if (!t.matches('button')) return;
            if (t.classList.contains('equal-sign')) return calculate();
            if (t.classList.contains('operator')) return pushOp(t.value);
            if (t.classList.contains('decimal')) return pushDecimal();
            if (t.classList.contains('all-clear')) return clearCalc();
            pushDigit(t.value);
        });
    }
    function updateCalcDisplay() {
        const scr = document.querySelector('.calculator-screen');
        if (scr) scr.value = calc.displayValue;
    }
    function pushDigit(d) {
        calc.displayValue = calc.displayValue === '0' ? d : calc.displayValue + d;
        calc.expression = calc.expression === '0' ? d : calc.expression + d;
        updateCalcDisplay();
    }
    function pushOp(op) {
        calc.displayValue += op;
        calc.expression += op;
        updateCalcDisplay();
    }
    function pushDecimal() {
        if (!calc.displayValue.includes('.')) {
            calc.displayValue += '.';
            calc.expression += '.';
            updateCalcDisplay();
        }
    }
    function clearCalc() {
        calc.displayValue = '0';
        calc.expression = '';
        updateCalcDisplay();
    }
    function validate(expr) {
        return !/[^0-9+\-*/.()^]/.test(expr);
    }
    function calculate() {
        try {
            if (!validate(calc.expression)) throw 'Invalid';
            const expr = calc.expression.replace(/\^/g, '**');
            const res = eval(expr);
            calc.displayValue = String(res);
            calc.expression = String(res);
        } catch {
            calc.displayValue = 'Error';
            setTimeout(clearCalc, 2000);
        }
        updateCalcDisplay();
    }

    // Theme toggles
    function updateTheme() {
        const xmasSheet = document.querySelector('link[href="christmas-styles.css"]');
        if (isChristmasMode) {
            if (xmasSheet) xmasSheet.disabled = false;
            document.body.classList.add('christmas-mode');
            document.body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.textContent = '🌙 Dark Mode';
            if (xmasToggle) xmasToggle.textContent = '🎄 Christmas Mode On';
        } else {
            if (xmasSheet) xmasSheet.disabled = true;
            document.body.classList.remove('christmas-mode');
            document.body.classList.toggle('dark-mode', isDarkMode);
            if (themeToggle)
                themeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
            if (xmasToggle) xmasToggle.textContent = '🎄 Christmas Mode Off';
        }
    }
    if (themeToggle)
        themeToggle.addEventListener('click', () => {
            isChristmasMode = false;
            isDarkMode = !isDarkMode;
            localStorage.setItem('darkMode', isDarkMode);
            localStorage.setItem('christmasMode', isChristmasMode);
            updateTheme();
        });
    if (xmasToggle)
        xmasToggle.addEventListener('click', () => {
            isDarkMode = false;
            isChristmasMode = !isChristmasMode;
            localStorage.setItem('darkMode', isDarkMode);
            localStorage.setItem('christmasMode', isChristmasMode);
            updateTheme();
        });

    // Event wiring
    saveNoteBtn?.addEventListener('click', saveNote);
    cancelAddBtn?.addEventListener('click', closeAddEditPopup);
    closeViewBtn?.addEventListener('click', closeViewPopup);
    overlay?.addEventListener('click', () => {
        closeAddEditPopup();
        closeViewPopup();
        closeDeletePopup();
    });
    document
        .getElementById('confirm-delete-btn')
        ?.addEventListener('click', () => {
            if (noteToDelete !== null) {
                notes.splice(noteToDelete, 1);
                localStorage.setItem('notes', JSON.stringify(notes));
                closeDeletePopup();
                renderNotes();
            }
        });
    document
        .getElementById('cancel-delete-btn')
        ?.addEventListener('click', closeDeletePopup);

    // Initial render
    renderNotes();
    displayTodos();
    displayTimerLogs();
    updateCalcDisplay();
    updateTheme();
});
