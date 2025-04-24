// Define global functions that are called from HTML
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

// Make functions globally accessible
window.saveCustomThought = function() {
    const customInput = document.getElementById('custom-thought-input');
    if (customInput.value.trim()) {
        document.getElementById('current-thought').textContent = customInput.value;
        closePopup();
        document.querySelector('.thought-dropdown').classList.remove('show');
    }
};

window.closePopup = function() {
    const popup = document.querySelector(".popup");
    if (popup) {
        popup.remove();
    }
};

window.editNote = function(index) {
    currentNoteIndex = index;
    openAddEditPopup(true);
};

window.deleteNote = function(index) {
    noteToDelete = index;
    const deletePopup = document.getElementById('delete-confirm-popup');
    const deleteMessage = isChristmasMode ? "Ho Ho Ho! Should we delete this naughty list?" : "Are you sure you want to delete this note?";
    deletePopup.querySelector('p').textContent = deleteMessage;
    deletePopup.classList.add('show');
    document.querySelector('.overlay').classList.add('active');
};

window.closeDeletePopup = function() {
    const deletePopup = document.getElementById('delete-confirm-popup');
    deletePopup.classList.remove('show');
    document.querySelector('.overlay').classList.remove('active');
    noteToDelete = null;
};

window.saveSessionLog = function() {
    const taskName = document.getElementById("session-task-name").value.trim();
    if (taskName) {
        const log = {
            task: taskName,
            duration: formatDuration(seconds),
            timestamp: new Date().toLocaleString(),
        };
        timerLogs.push(log);
        localStorage.setItem("timerLogs", JSON.stringify(timerLogs));
        displayTimerLogs();
    }
    closePopup();
    resetTimer();
};

window.closeCongratsPopup = function() {
    const congratsPopup = document.querySelector(".popup");
    if (congratsPopup) {
        congratsPopup.remove();
    }
};

// Helper functions
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${pad(minutes)} min ${pad(remainingSeconds)} sec`;
}

function pad(num) {
    return num < 10 ? `0${num}` : num;
}

function resetTimer() {
    seconds = 0;
    const timerDisplay = document.getElementById("timer-display");
    if (timerDisplay) {
        timerDisplay.textContent = "00:00";
    }
    isRunning = false;
    const startTimerButton = document.getElementById("start-timer");
    if (startTimerButton) {
        startTimerButton.textContent = "Start Timer";
        startTimerButton.classList.remove('stop');
    }
}

function openAddEditPopup(isEdit = false) {
    const popupHeader = document.getElementById("popup-header");
    const addEditPopup = document.getElementById("add-edit-popup");
    const overlay = document.querySelector(".overlay");
    
    if (addEditPopup) addEditPopup.classList.add("show");
    if (overlay) overlay.classList.add("active");

    if (isEdit && currentNoteIndex !== null) {
        popupHeader.textContent = "Edit Note";
        document.getElementById("note-title-input").value = notes[currentNoteIndex].title;
        document.getElementById("note-content-input").value = notes[currentNoteIndex].content;
    } else {
        popupHeader.textContent = "Add Note";
        document.getElementById("note-title-input").value = "";
        document.getElementById("note-content-input").value = "";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Load data from localStorage with error handling
    try {
        notes = JSON.parse(localStorage.getItem("notes")) || [];
    } catch (e) {
        notes = [];
        localStorage.removeItem("notes");
    }

    try {
        todos = JSON.parse(localStorage.getItem("todos")) || [];
    } catch (e) {
        todos = [];
        localStorage.removeItem("todos");
    }

    try {
        timerLogs = JSON.parse(localStorage.getItem("timerLogs")) || [];
    } catch (e) {
        timerLogs = [];
        localStorage.removeItem("timerLogs");
    }

    // DOM Elements
    const thoughtContainer = document.querySelector('.thought-container');
    const currentThought = document.getElementById('current-thought');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const thoughtDropdown = document.querySelector('.thought-dropdown');
    const thoughtOptions = document.querySelectorAll('.thought-option');
    const notesContainer = document.getElementById("notes-container");
    const addNoteBtn = document.getElementById("add-note-btn");
    const addEditPopup = document.getElementById("add-edit-popup");
    const saveNoteBtn = document.getElementById("save-note-btn");
    const cancelAddBtn = document.getElementById("cancel-add-btn");
    const noteTitleInput = document.getElementById("note-title-input");
    const noteContentInput = document.getElementById("note-content-input");
    const viewPopup = document.getElementById("view-popup");
    const viewPopupTitle = document.getElementById("view-popup-title");
    const viewPopupContent = document.getElementById("view-popup-content");
    const closeViewPopupBtn = document.getElementById("close-view-popup-btn");
    const todoForm = document.getElementById("todo-form");
    const todoInput = document.getElementById("todo-input");
    const todoList = document.getElementById("todo-list");
    const timerDisplay = document.getElementById("timer-display");
    const startTimerButton = document.getElementById("start-timer");
    const logsContainer = document.getElementById("timer-logs");
    const themeToggle = document.getElementById('theme-toggle');
    const christmasThemeToggle = document.getElementById('christmas-theme-toggle');
    
    // Create background overlay for popups if not exists
    let overlay = document.querySelector(".overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.classList.add("overlay");
        document.body.appendChild(overlay);
    }

    // Toggle dropdown
    if (dropdownArrow) {
        dropdownArrow.addEventListener('click', () => {
            thoughtDropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (thoughtContainer && !thoughtContainer.contains(e.target)) {
            if (thoughtDropdown) {
                thoughtDropdown.classList.remove('show');
            }
        }
    });

    // Handle thought selection
    if (thoughtOptions) {
        thoughtOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (option.id === 'custom-thought') {
                    showCustomThoughtPopup();
                } else {
                    if (currentThought) {
                        currentThought.textContent = option.getAttribute('data-thought');
                    }
                    if (thoughtDropdown) {
                        thoughtDropdown.classList.remove('show');
                    }
                }
            });
        });
    }

    function showCustomThoughtPopup() {
        const popup = document.createElement("div");
        popup.classList.add("popup");
        popup.innerHTML = `
            <div class="popup-content">
                <h2>Custom Thought</h2>
                <p>Enter your motivational thought:</p>
                <input type="text" id="custom-thought-input" maxlength="40" placeholder="Enter your thought">
                <button onclick="saveCustomThought()">Save</button>
                <button onclick="closePopup()">Cancel</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    function renderNotes() {
        if (!notesContainer) return;
        
        notesContainer.innerHTML = "";
        if (notes.length === 0) {
            notesContainer.innerHTML = '<div class="no-notes">No notes yet. Click "Add Note" to create one.</div>';
            return;
        }

        notes.forEach((note, index) => {
            const noteCard = document.createElement("div");
            noteCard.classList.add("note-card");

            const displayTitle = note.title.length > 30 ?
                note.title.substring(0, 30) + '...' :
                note.title;

            noteCard.innerHTML = `
                <h3>${displayTitle}</h3>
                <div class="note-actions">
                    <button class="edit-btn" onclick="editNote(${index})">✏️</button>
                    <button class="delete-btn" onclick="deleteNote(${index})">🗑️</button>
                </div>
            `;

            noteCard.addEventListener("click", (e) => {
                if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
                    openViewPopup(index);
                }
            });

            notesContainer.appendChild(noteCard);
        });
    }

    if (addNoteBtn) {
        addNoteBtn.addEventListener("click", () => {
            currentNoteIndex = null;
            openAddEditPopup(false);
        });
    }

    function closeAddEditPopup() {
        if (addEditPopup) addEditPopup.classList.remove("show");
        if (overlay) overlay.classList.remove("active");
        if (noteTitleInput && noteContentInput) {
            noteTitleInput.value = "";
            noteContentInput.value = "";
        }
    }

    function saveNote() {
        if (!noteTitleInput || !noteContentInput) return;
        
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();

        if (title && content) {
            const note = {
                title,
                content,
                timestamp: new Date().toLocaleString()
            };

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

    function openViewPopup(index) {
        if (!viewPopup || !viewPopupTitle || !viewPopupContent) return;
        
        currentNoteIndex = index;
        viewPopup.classList.add("show");
        if (overlay) overlay.classList.add("active");
        viewPopupTitle.textContent = notes[index].title;
        viewPopupContent.textContent = notes[index].content;
        const timestampElement = document.getElementById("view-popup-timestamp");
        if (timestampElement) {
            timestampElement.textContent = notes[index].timestamp || 'No timestamp available';
        }
    }

    function closeViewPopup() {
        if (viewPopup) viewPopup.classList.remove("show");
        if (overlay) overlay.classList.remove("active");
    }

    // Todo functionality
    function displayTodos() {
        if (!todoList) return;
        
        todoList.innerHTML = "";
        todos.forEach((todo, index) => {
            const li = document.createElement("li");
            li.textContent = todo.name;

            if (todo.completed) {
                li.classList.add("completed");
            }

            const controls = document.createElement("div");
            controls.classList.add("task-controls");

            const tickButton = document.createElement("button");
            tickButton.textContent = todo.completed ? "✗" : "✓";
            tickButton.classList.add(todo.completed ? "delete-button" : "tick-button");
            tickButton.addEventListener("click", () => {
                todo.completed = !todo.completed;
                localStorage.setItem("todos", JSON.stringify(todos));
                displayTodos();
                updateProgress();
                if (todo.completed) {
                    showCongratsPopup();
                }
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "🗑";
            deleteButton.classList.add("delete-button");
            deleteButton.addEventListener("click", () => {
                todos.splice(index, 1);
                localStorage.setItem("todos", JSON.stringify(todos));
                displayTodos();
                updateProgress();
            });

            controls.appendChild(tickButton);
            controls.appendChild(deleteButton);
            li.appendChild(controls);
            todoList.prepend(li);
        });
        updateProgress();
    }

    if (todoForm) {
        todoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const newTask = todoInput.value.trim();
            if (newTask) {
                todos.push({ name: newTask, completed: false });
                localStorage.setItem("todos", JSON.stringify(todos));
                displayTodos();
                todoInput.value = "";
                updateProgress();
            }
        });
    }

    function updateProgress() {
        const progressBar = document.getElementById('todo-progress');
        if (!progressBar) return;
        
        const totalTasks = todos.length;
        const completedTasks = todos.filter(todo => todo.completed).length;
        const progressPercent = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }

    function showCongratsPopup() {
        const congratsPopup = document.createElement("div");
        congratsPopup.classList.add("popup");
        const congratsMessage = isChristmasMode ? "Ho Ho Ho! You deserve presents now!" : "Congratulations! You completed a task successfully!";
        congratsPopup.innerHTML = `
            <div class="popup-content">
                <h2>${congratsMessage}</h2>
                <button onclick="closeCongratsPopup()">Close</button>
            </div>
        `;
        document.body.appendChild(congratsPopup);
    }

    // Timer functionality
    if (startTimerButton) {
        startTimerButton.addEventListener("click", function () {
            if (!isRunning) {
                isRunning = true;
                startTimerButton.textContent = "Stop Timer";
                startTimerButton.classList.add('stop');
                startTimer();
            } else {
                isRunning = false;
                startTimerButton.textContent = "Start Timer";
                startTimerButton.classList.remove('stop');
                stopTimer();
            }
        });
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        seconds = 0;
        if (timerDisplay) timerDisplay.textContent = "00:00";
        timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            if (timerDisplay) {
                timerDisplay.textContent = `${pad(minutes)}:${pad(displaySeconds)}`;
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (timerDisplay) timerDisplay.textContent = "00:00";
        if (seconds >= 5) {
            showSessionPopup();
        }
    }

    function showSessionPopup() {
        const popup = document.createElement("div");
        popup.classList.add("popup");
        const sessionMessage = isChristmasMode ? "Ho Ho Ho! Which gift you packed now?" : "Which task does this session belong to?";
        popup.innerHTML = `
            <div class="popup-content">
                <h2>Session Log</h2>
                <p>${sessionMessage}</p>
                <input type="text" id="session-task-name" maxlength="30" placeholder="Enter task name">
                <button onclick="saveSessionLog()">Save</button>
                <button onclick="closePopup()">Close</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    function displayTimerLogs() {
        if (!logsContainer) return;
        
        logsContainer.innerHTML = "";
        timerLogs.forEach((log, index) => {
            const logEntry = document.createElement("div");
            logEntry.classList.add("log-entry");

            const logText = document.createElement("span");
            logText.textContent = `[${log.timestamp}] Task: ${log.task} | ${log.duration}`;
            logEntry.appendChild(logText);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "🗑";
            deleteButton.classList.add("log-delete");
            deleteButton.addEventListener("click", () => {
                timerLogs.splice(index, 1);
                localStorage.setItem("timerLogs", JSON.stringify(timerLogs));
                displayTimerLogs();
            });

            logEntry.appendChild(deleteButton);
            logsContainer.prepend(logEntry);
        });
    }

    // Calculator functionality
    const calculator = {
        displayValue: '0',
        expression: ''
    };

    const calculatorKeys = document.querySelector('.calculator-keys');
    if (calculatorKeys) {
        calculatorKeys.addEventListener('click', (event) => {
            const { target } = event;
            if (!target.matches('button')) return;

            if (target.classList.contains('equal-sign')) {
                calculateResult();
                updateDisplay();
                return;
            }

            if (target.classList.contains('operator')) {
                inputOperator(target.value);
                updateDisplay();
                return;
            }

            if (target.classList.contains('decimal')) {
                inputDecimal();
                updateDisplay();
                return;
            }

            if (target.classList.contains('all-clear')) {
                clearCalculator();
                updateDisplay();
                return;
            }

            inputDigit(target.value);
            updateDisplay();
        });
    }

    function updateDisplay() {
        const display = document.querySelector('.calculator-screen');
        if (display) {
            display.value = calculator.displayValue;
        }
    }

    function inputDigit(digit) {
        calculator.displayValue = calculator.displayValue === '0' ? digit : calculator.displayValue + digit;
        calculator.expression = calculator.expression === '0' ? digit : calculator.expression + digit;
    }

    function inputOperator(operator) {
        calculator.displayValue += operator;
        calculator.expression += operator;
    }

    function inputDecimal() {
        if (!calculator.displayValue.includes('.')) {
            calculator.displayValue += '.';
            calculator.expression += '.';
        }
    }

    function clearCalculator() {
        calculator.displayValue = '0';
        calculator.expression = '';
    }

    function validateExpression(expr) {
        try {
            expr = expr.replace(/\^/g, '**');
            if (/[^0-9+\-*/.()^]/.test(expr)) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    function calculateResult() {
        try {
            if (!validateExpression(calculator.expression)) {
                throw new Error('Invalid Expression');
            }
            const expr = calculator.expression.replace(/\^/g, '**');
            const result = eval(expr);
            calculator.displayValue = String(result);
            calculator.expression = String(result);
        } catch (e) {
            calculator.displayValue = 'Error';
            setTimeout(() => {
                clearCalculator();
                updateDisplay();
            }, 2000);
        }
    }

    // Theme Toggle Functionality
    function updateTheme() {
        const elements = {
            body: document.body,
            header: document.querySelector('header'),
            sections: document.querySelectorAll('.section'),
            inputs: document.querySelectorAll('input, textarea'),
            buttons: document.querySelectorAll('button'),
            noteCards: document.querySelectorAll('.note-card'),
            popups: document.querySelectorAll('.popup-content'),
            calculator: document.querySelector('.calculator'),
            calculatorScreen: document.querySelector('.calculator-screen'),
            calculatorButtons: document.querySelectorAll('.calculator-keys button'),
            thoughtContainer: document.querySelector('.thought-container'),
            todoSection: document.getElementById('todo-section'),
            todoList: document.querySelectorAll('li'),
            notesSection: document.getElementById('notes-section'),
            motivationSection: document.querySelector('.thought-container'),
            dropdownContent: document.querySelector('.thought-dropdown'),
            currentThought: document.getElementById('current-thought'),
            logEntries: document.querySelectorAll('.log-entry'),
            timerSection: document.getElementById('timer-section'),
            timerLogs: document.getElementById('timer-logs'),
            thoughtOptions: document.querySelectorAll('.thought-option')
        };

        const christmasStylesheet = document.querySelector('link[href="christmas-styles.css"]');
        
        if (isChristmasMode) {
            if (themeToggle) themeToggle.textContent = '🌙 Dark Mode';
            if (christmasThemeToggle) christmasThemeToggle.textContent = '🎄 Christmas Mode On';
            
            Object.values(elements).forEach(elementOrNodeList => {
                if (!elementOrNodeList) return;
                if (elementOrNodeList instanceof NodeList) {
                    elementOrNodeList.forEach(el => el && el.classList.remove('dark-mode'));
                } else {
                    elementOrNodeList.classList.remove('dark-mode');
                }
            });
            
            if (christmasStylesheet) christmasStylesheet.disabled = false;
            document.body.classList.add('christmas-mode');
        } else {
            if (christmasStylesheet) christmasStylesheet.disabled = true;
            if (christmasThemeToggle) christmasThemeToggle.textContent = '🎄 Christmas Mode Off';
            document.body.classList.remove('christmas-mode');

            if (isDarkMode) {
                if (themeToggle) themeToggle.textContent = '☀️ Light Mode';
                Object.values(elements).forEach(elementOrNodeList => {
                    if (!elementOrNodeList) return;
                    if (elementOrNodeList instanceof NodeList) {
                        elementOrNodeList.forEach(el => el && el.classList.add('dark-mode'));
                    } else {
                        elementOrNodeList.classList.add('dark-mode');
                    }
                });
            } else {
                if (themeToggle) themeToggle.textContent = '🌙 Dark Mode';
                Object.values(elements).forEach(elementOrNodeList => {
                    if (!elementOrNodeList) return;
                    if (elementOrNodeList instanceof NodeList) {
                        elementOrNodeList.forEach(el => el && el.classList.remove('dark-mode'));
                    } else {
                        elementOrNodeList.classList.remove('dark-mode');
                    }
                });
            }
        }
    }

    // Event listeners for theme toggles
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (isChristmasMode) {
                isChristmasMode = false;
                localStorage.setItem('christmasMode', isChristmasMode);
            }
            isDarkMode = !isDarkMode;
            localStorage.setItem('darkMode', isDarkMode);
            updateTheme();
        });
    }

    if (christmasThemeToggle) {
        christmasThemeToggle.addEventListener('click', () => {
            if (isDarkMode) {
                isDarkMode = false;
                localStorage.setItem('darkMode', isDarkMode);
            }
            isChristmasMode = !isChristmasMode;
            localStorage.setItem('christmasMode', isChristmasMode);
            updateTheme();
        });
    }

    // Event listeners for notes
    if (saveNoteBtn) saveNoteBtn.addEventListener("click", saveNote);
    if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeAddEditPopup);
    if (closeViewPopupBtn) closeViewPopupBtn.addEventListener("click", closeViewPopup);

    // Close popups when clicking overlay
    if (overlay) overlay.addEventListener("click", () => {
        closeAddEditPopup();
        closeViewPopup();
        closeDeletePopup();
    });

    // Auto-resize textarea
    if (noteContentInput) noteContentInput.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });

    // Confirm delete event listeners
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => {
        if (noteToDelete !== null) {
            notes.splice(noteToDelete, 1);
            localStorage.setItem('notes', JSON.stringify(notes));
            closeDeletePopup();
            renderNotes();
        }
    });

    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeletePopup);

    // Initialize everything
    renderNotes();
    displayTodos();
    displayTimerLogs();
    updateDisplay();
    updateTheme();

    // MutationObserver (temporary for initial setup)
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
});