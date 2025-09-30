// Define global variables
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

// Global function to safely get element
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

// Global function to save custom thought
window.saveCustomThought = function() {
    const customInput = safeGetElement('custom-thought-input');
    const currentThought = safeGetElement('current-thought');
    const thoughtDropdown = document.querySelector('.thought-dropdown');
    
    if (customInput && customInput.value.trim() && currentThought) {
        currentThought.textContent = customInput.value;
        closePopup();
        if (thoughtDropdown) {
            thoughtDropdown.classList.remove('show');
        }
    }
};

// Global function to close popup
window.closePopup = function() {
    const popup = document.querySelector(".popup");
    if (popup) {
        popup.remove();
    }
};

// Global function to edit note
window.editNote = function(index) {
    currentNoteIndex = index;
    openAddEditPopup(true);
};

// Global function to delete note
window.deleteNote = function(index) {
    noteToDelete = index;
    const deletePopup = safeGetElement('delete-confirm-popup');
    const overlay = document.querySelector('.overlay');
    
    if (deletePopup) {
        const deleteMessage = isChristmasMode ? 
            "Ho Ho Ho! Should we delete this naughty list?" : 
            "Are you sure you want to delete this note?";
        const messagePara = deletePopup.querySelector('p');
        if (messagePara) {
            messagePara.textContent = deleteMessage;
        }
        deletePopup.classList.add('show');
    }
    
    if (overlay) {
        overlay.classList.add('active');
    }
};

// Global function to close delete popup
window.closeDeletePopup = function() {
    const deletePopup = safeGetElement('delete-confirm-popup');
    const overlay = document.querySelector('.overlay');
    
    if (deletePopup) {
        deletePopup.classList.remove('show');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
    noteToDelete = null;
};

// Global function to save session log
window.saveSessionLog = function() {
    const taskNameInput = safeGetElement("session-task-name");
    if (!taskNameInput) return;
    
    const taskName = taskNameInput.value.trim();
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

// Global function to close congrats popup
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
    const timerDisplay = safeGetElement("timer-display");
    if (timerDisplay) {
        timerDisplay.textContent = "00:00";
    }
    isRunning = false;
    const startTimerButton = safeGetElement("start-timer");
    if (startTimerButton) {
        startTimerButton.textContent = "Start Timer";
        startTimerButton.classList.remove('stop');
    }
}

function openAddEditPopup(isEdit = false) {
    const popupHeader = safeGetElement("popup-header");
    const addEditPopup = safeGetElement("add-edit-popup");
    const overlay = document.querySelector(".overlay");
    const noteTitleInput = safeGetElement("note-title-input");
    const noteContentInput = safeGetElement("note-content-input");
    
    if (addEditPopup) addEditPopup.classList.add("show");
    if (overlay) overlay.classList.add("active");

    if (popupHeader) {
        popupHeader.textContent = isEdit ? "Edit Note" : "Add Note";
    }

    if (isEdit && currentNoteIndex !== null && notes[currentNoteIndex]) {
        if (noteTitleInput) noteTitleInput.value = notes[currentNoteIndex].title || "";
        if (noteContentInput) noteContentInput.value = notes[currentNoteIndex].content || "";
    } else {
        if (noteTitleInput) noteTitleInput.value = "";
        if (noteContentInput) noteContentInput.value = "";
    }
}

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Load data from localStorage with error handling
    try {
        notes = JSON.parse(localStorage.getItem("notes")) || [];
        if (!Array.isArray(notes)) notes = [];
    } catch (e) {
        console.error("Error loading notes:", e);
        notes = [];
        localStorage.removeItem("notes");
    }

    try {
        todos = JSON.parse(localStorage.getItem("todos")) || [];
        if (!Array.isArray(todos)) todos = [];
    } catch (e) {
        console.error("Error loading todos:", e);
        todos = [];
        localStorage.removeItem("todos");
    }

    try {
        timerLogs = JSON.parse(localStorage.getItem("timerLogs")) || [];
        if (!Array.isArray(timerLogs)) timerLogs = [];
    } catch (e) {
        console.error("Error loading timer logs:", e);
        timerLogs = [];
        localStorage.removeItem("timerLogs");
    }

    // Create overlay if it doesn't exist
    let overlay = document.querySelector(".overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.classList.add("overlay");
        document.body.appendChild(overlay);
    }

    // Cache DOM elements
    const thoughtContainer = document.querySelector('.thought-container');
    const currentThought = safeGetElement('current-thought');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const thoughtDropdown = document.querySelector('.thought-dropdown');
    const thoughtOptions = document.querySelectorAll('.thought-option');
    const notesContainer = safeGetElement("notes-container");
    const addNoteBtn = safeGetElement("add-note-btn");
    const addEditPopup = safeGetElement("add-edit-popup");
    const saveNoteBtn = safeGetElement("save-note-btn");
    const cancelAddBtn = safeGetElement("cancel-add-btn");
    const noteTitleInput = safeGetElement("note-title-input");
    const noteContentInput = safeGetElement("note-content-input");
    const viewPopup = safeGetElement("view-popup");
    const viewPopupTitle = safeGetElement("view-popup-title");
    const viewPopupContent = safeGetElement("view-popup-content");
    const closeViewPopupBtn = safeGetElement("close-view-popup-btn");
    const todoForm = safeGetElement("todo-form");
    const todoInput = safeGetElement("todo-input");
    const todoList = safeGetElement("todo-list");
    const timerDisplay = safeGetElement("timer-display");
    const startTimerButton = safeGetElement("start-timer");
    const logsContainer = safeGetElement("timer-logs");
    const themeToggle = safeGetElement('theme-toggle');
    const christmasThemeToggle = safeGetElement('christmas-theme-toggle');

    // Toggle dropdown
    if (dropdownArrow && thoughtDropdown) {
        dropdownArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            thoughtDropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (thoughtContainer && !thoughtContainer.contains(e.target) && thoughtDropdown) {
            thoughtDropdown.classList.remove('show');
        }
    });

    // Handle thought selection
    if (thoughtOptions && thoughtOptions.length > 0) {
        thoughtOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (option.id === 'custom-thought') {
                    showCustomThoughtPopup();
                } else {
                    const thought = option.getAttribute('data-thought');
                    if (currentThought && thought) {
                        currentThought.textContent = thought;
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
        if (!notes || notes.length === 0) {
            notesContainer.innerHTML = '<div class="no-notes">No notes yet. Click "Add Note" to create one.</div>';
            return;
        }

        notes.forEach((note, index) => {
            if (!note || !note.title) return;
            
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
        if (noteTitleInput) noteTitleInput.value = "";
        if (noteContentInput) noteContentInput.value = "";
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

            if (currentNoteIndex !== null && currentNoteIndex < notes.length) {
                notes[currentNoteIndex] = note;
            } else {
                notes.push(note);
            }

            try {
                localStorage.setItem('notes', JSON.stringify(notes));
            } catch (e) {
                console.error("Error saving notes:", e);
            }
            
            closeAddEditPopup();
            renderNotes();
        }
    }

    function openViewPopup(index) {
        if (!viewPopup || !notes[index]) return;
        
        currentNoteIndex = index;
        viewPopup.classList.add("show");
        if (overlay) overlay.classList.add("active");
        
        if (viewPopupTitle) viewPopupTitle.textContent = notes[index].title || "";
        if (viewPopupContent) viewPopupContent.textContent = notes[index].content || "";
        
        const timestampElement = safeGetElement("view-popup-timestamp");
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
        
        if (!todos || todos.length === 0) {
            updateProgress();
            return;
        }

        todos.forEach((todo, index) => {
            if (!todo || !todo.name) return;
            
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
                try {
                    localStorage.setItem("todos", JSON.stringify(todos));
                } catch (e) {
                    console.error("Error saving todos:", e);
                }
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
                try {
                    localStorage.setItem("todos", JSON.stringify(todos));
                } catch (e) {
                    console.error("Error saving todos:", e);
                }
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

    if (todoForm && todoInput) {
        todoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const newTask = todoInput.value.trim();
            if (newTask) {
                todos.push({ name: newTask, completed: false });
                try {
                    localStorage.setItem("todos", JSON.stringify(todos));
                } catch (e) {
                    console.error("Error saving todos:", e);
                }
                displayTodos();
                todoInput.value = "";
                updateProgress();
            }
        });
    }

    function updateProgress() {
        const progressBar = safeGetElement('todo-progress');
        if (!progressBar) return;
        
        const totalTasks = todos ? todos.length : 0;
        const completedTasks = todos ? todos.filter(todo => todo && todo.completed).length : 0;
        const progressPercent = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }

    function showCongratsPopup() {
        const congratsPopup = document.createElement("div");
        congratsPopup.classList.add("popup");
        const congratsMessage = isChristmasMode ? 
            "Ho Ho Ho! You deserve presents now!" : 
            "Congratulations! You completed a task successfully!";
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
        } else {
            resetTimer();
        }
    }

    function showSessionPopup() {
        const popup = document.createElement("div");
        popup.classList.add("popup");
        const sessionMessage = isChristmasMode ? 
            "Ho Ho Ho! Which gift you packed now?" : 
            "Which task does this session belong to?";
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
        
        if (!timerLogs || timerLogs.length === 0) return;

        timerLogs.forEach((log, index) => {
            if (!log) return;
            
            const logEntry = document.createElement("div");
            logEntry.classList.add("log-entry");

            const logText = document.createElement("span");
            logText.textContent = `[${log.timestamp || 'N/A'}] Task: ${log.task || 'Unnamed'} | ${log.duration || '0 min 0 sec'}`;
            logEntry.appendChild(logText);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "🗑";
            deleteButton.classList.add("log-delete");
            deleteButton.addEventListener("click", () => {
                timerLogs.splice(index, 1);
                try {
                    localStorage.setItem("timerLogs", JSON.stringify(timerLogs));
                } catch (e) {
                    console.error("Error saving timer logs:", e);
                }
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
        const christmasStylesheet = document.querySelector('link[href="christmas-styles.css"]');
        
        // Get all elements that need theme updates
        const elementsToTheme = [
            document.body,
            document.querySelector('header'),
            ...document.querySelectorAll('.section'),
            ...document.querySelectorAll('input, textarea'),
            ...document.querySelectorAll('button'),
            ...document.querySelectorAll('.note-card'),
            ...document.querySelectorAll('.popup-content'),
            document.querySelector('.calculator'),
            document.querySelector('.calculator-screen'),
            ...document.querySelectorAll('.calculator-keys button'),
            document.querySelector('.thought-container'),
            ...document.querySelectorAll('li'),
            document.querySelector('.thought-dropdown'),
            ...document.querySelectorAll('.log-entry'),
            ...document.querySelectorAll('.thought-option')
        ].filter(el => el !== null);

        if (isChristmasMode) {
            if (themeToggle) themeToggle.textContent = '🌙 Dark Mode';
            if (christmasThemeToggle) christmasThemeToggle.textContent = '🎄 Christmas Mode On';
            
            elementsToTheme.forEach(el => el.classList.remove('dark-mode'));
            
            if (christmasStylesheet) christmasStylesheet.disabled = false;
            document.body.classList.add('christmas-mode');
        } else {
            if (christmasStylesheet) christmasStylesheet.disabled = true;
            if (christmasThemeToggle) christmasThemeToggle.textContent = '🎄 Christmas Mode Off';
            document.body.classList.remove('christmas-mode');

            if (isDarkMode) {
                if (themeToggle) themeToggle.textContent = '☀️ Light Mode';
                elementsToTheme.forEach(el => el.classList.add('dark-mode'));
            } else {
                if (themeToggle) themeToggle.textContent = '🌙 Dark Mode';
                elementsToTheme.forEach(el => el.classList.remove('dark-mode'));
            }
        }
    }

    // Event listeners for theme toggles
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (isChristmasMode) {
                isChristmasMode = false;
                localStorage.setItem('christmasMode', 'false');
            }
            isDarkMode = !isDarkMode;
            localStorage.setItem('darkMode', String(isDarkMode));
            updateTheme();
        });
    }

    if (christmasThemeToggle) {
        christmasThemeToggle.addEventListener('click', () => {
            if (isDarkMode) {
                isDarkMode = false;
                localStorage.setItem('darkMode', 'false');
            }
            isChristmasMode = !isChristmasMode;
            localStorage.setItem('christmasMode', String(isChristmasMode));
            updateTheme();
        });
    }

    // Event listeners for notes
    if (saveNoteBtn) saveNoteBtn.addEventListener("click", saveNote);
    if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeAddEditPopup);
    if (closeViewPopupBtn) closeViewPopupBtn.addEventListener("click", closeViewPopup);

    // Close popups when clicking overlay
    if (overlay) {
        overlay.addEventListener("click", () => {
            closeAddEditPopup();
            closeViewPopup();
            closeDeletePopup();
        });
    }

    // Auto-resize textarea
    if (noteContentInput) {
        noteContentInput.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        });
    }

    // Confirm delete event listeners
    const confirmDeleteBtn = safeGetElement('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (noteToDelete !== null && notes[noteToDelete]) {
                notes.splice(noteToDelete, 1);
                try {
                    localStorage.setItem('notes', JSON.stringify(notes));
                } catch (e) {
                    console.error("Error saving notes:", e);
                }
                closeDeletePopup();
                renderNotes();
            }
        });
    }

    const cancelDeleteBtn = safeGetElement('cancel-delete-btn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeletePopup);
    }

    // Initialize everything
    renderNotes();
    displayTodos();
    displayTimerLogs();
    updateDisplay();
    updateTheme();
});
