/*
    ============================================================
    ORBIT TASK STUDIO
    ============================================================
    This project intentionally uses plain JavaScript.

    The app follows a simple cycle:
    1. Store task data in an array.
    2. Save that array in localStorage.
    3. Render the array as HTML.
    4. When the user changes something, repeat steps 2 and 3.

    This pattern is the small-scale version of how many larger
    web applications work.
*/

// ---------- 1. Find the HTML elements we need ----------

const elements = {
    taskForm: document.querySelector("#task-form"),
    taskModal: document.querySelector("#task-modal"),
    focusModal: document.querySelector("#focus-modal"),
    helpModal: document.querySelector("#help-modal"),
    openTaskModal: document.querySelector("#open-task-modal"),
    mobileAddTask: document.querySelector("#mobile-add-task"),
    emptyAddButton: document.querySelector("#empty-add-button"),
    closeTaskModal: document.querySelector("#close-task-modal"),
    cancelTask: document.querySelector("#cancel-task"),
    taskId: document.querySelector("#task-id"),
    taskTitle: document.querySelector("#task-title"),
    taskNotes: document.querySelector("#task-notes"),
    taskCategory: document.querySelector("#task-category"),
    taskDate: document.querySelector("#task-date"),
    taskStatus: document.querySelector("#task-status"),
    taskEnergy: document.querySelector("#task-energy"),
    titleCount: document.querySelector("#title-count"),
    modalTitle: document.querySelector("#modal-title"),
    submitLabel: document.querySelector("#submit-label"),
    formMessage: document.querySelector("#form-message"),
    searchInput: document.querySelector("#search-input"),
    priorityFilter: document.querySelector("#priority-filter"),
    activeFilters: document.querySelector("#active-filters"),
    filterDescription: document.querySelector("#filter-description"),
    clearFilters: document.querySelector("#clear-filters"),
    viewTitle: document.querySelector("#view-title"),
    boardView: document.querySelector("#board-view"),
    listView: document.querySelector("#list-view"),
    taskList: document.querySelector("#task-list"),
    boardViewButton: document.querySelector("#board-view-button"),
    listViewButton: document.querySelector("#list-view-button"),
    emptyState: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyMessage: document.querySelector("#empty-message"),
    nowColumn: document.querySelector("#now-column"),
    nextColumn: document.querySelector("#next-column"),
    doneColumn: document.querySelector("#done-column"),
    progressSummaryText: document.querySelector("#progress-summary-text"),
    progressTrack: document.querySelector("#progress-track"),
    progressBar: document.querySelector("#progress-bar"),
    themeToggle: document.querySelector("#theme-toggle"),
    themeIcon: document.querySelector("#theme-icon"),
    themeLabel: document.querySelector("#theme-label"),
    quickThemeToggle: document.querySelector("#quick-theme-toggle"),
    quickThemeIcon: document.querySelector("#quick-theme-icon"),
    sidebar: document.querySelector("#sidebar"),
    sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
    menuButton: document.querySelector("#menu-button"),
    sidebarClose: document.querySelector("#sidebar-close"),
    focusButton: document.querySelector("#focus-button"),
    focusButtonIcon: document.querySelector(".focus-button-icon"),
    focusLabel: document.querySelector(".focus-label"),
    focusLive: document.querySelector("#focus-live"),
    headerTimeLeft: document.querySelector("#header-time-left"),
    headerTimeElapsed: document.querySelector("#header-time-elapsed"),
    closeFocusModal: document.querySelector("#close-focus-modal"),
    focusTaskName: document.querySelector("#focus-task-name"),
    focusTimer: document.querySelector("#focus-timer"),
    timerToggle: document.querySelector("#timer-toggle"),
    timerReset: document.querySelector("#timer-reset"),
    customFocusMinutes: document.querySelector("#custom-focus-minutes"),
    applyFocusDuration: document.querySelector("#apply-focus-duration"),
    focusDurationHint: document.querySelector("#focus-duration-hint"),
    helpButton: document.querySelector("#help-button"),
    closeHelpModal: document.querySelector("#close-help-modal"),
    toast: document.querySelector("#toast"),
    toastMessage: document.querySelector("#toast-message"),
    toastIcon: document.querySelector("#toast-icon"),
    toastAction: document.querySelector("#toast-action")
};

// ---------- 2. App data and settings ----------

// Version 2 starts with an empty task list. The new key prevents old
// development/demo tasks saved under orbit-tasks-v1 from appearing after deploy.
const STORAGE_KEY = "orbit-tasks-v2";
const SETTINGS_KEY = "orbit-settings-v1";
const DEFAULT_FOCUS_MINUTES = 25;
const MIN_FOCUS_MINUTES = 1;
const MAX_FOCUS_MINUTES = 180;
const DATE_REFRESH_INTERVAL = 30 * 1000;

// The filters object remembers what the user is currently viewing.
const filters = {
    smart: "all",
    category: "all",
    priority: "all",
    search: ""
};

let currentView = "board";
let draggedTaskId = null;
let recentlyDeletedTask = null;
let toastTimeout = null;

// setInterval() returns an ID. We store that ID so clearInterval() can stop
// the exact repeating timer later. null means that no focus interval is active.
let focusIntervalId = null;

let focusSessionStarted = false;
let selectedFocusMinutes = DEFAULT_FOCUS_MINUTES;
let secondsRemaining = selectedFocusMinutes * 60;
let lastKnownDate = "";

// Load only the tasks saved in this visitor's own browser.
let tasks = loadTasks();

// ---------- 3. Data helpers ----------

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            return Array.isArray(parsedTasks) ? parsedTasks : [];
        }
    } catch (error) {
        console.warn("Orbit could not read saved tasks:", error);
    }

    // A first-time visitor has no saved tasks, so begin with an empty array.
    return [];
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createId() {
    // Date.now gives the current time; the random text prevents duplicate IDs.
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getTodayString() {
    return toDateInputValue(new Date());
}

// ---------- 4. Rendering the application ----------

function renderApp() {
    const visibleTasks = getFilteredTasks();

    updateTaskCounts();
    updateProgress();
    updateFilterMessage();
    renderBoard(visibleTasks);
    renderList(visibleTasks);
    updateEmptyState(visibleTasks);
}

function getFilteredTasks() {
    const today = getTodayString();

    return tasks.filter((task) => {
        let matchesSmartFilter = true;

        if (filters.smart === "today") {
            matchesSmartFilter = task.dueDate === today && task.status !== "done";
        } else if (filters.smart === "upcoming") {
            matchesSmartFilter = task.dueDate > today && task.status !== "done";
        } else if (filters.smart === "completed") {
            matchesSmartFilter = task.status === "done";
        }

        const matchesCategory =
            filters.category === "all" || task.category === filters.category;

        const matchesPriority =
            filters.priority === "all" || task.priority === filters.priority;

        const searchableText = `${task.title} ${task.notes} ${task.category}`.toLowerCase();
        const matchesSearch = searchableText.includes(filters.search.toLowerCase());

        return matchesSmartFilter && matchesCategory && matchesPriority && matchesSearch;
    });
}

function renderBoard(visibleTasks) {
    const columns = {
        now: elements.nowColumn,
        next: elements.nextColumn,
        done: elements.doneColumn
    };

    Object.entries(columns).forEach(([status, column]) => {
        const columnTasks = visibleTasks
            .filter((task) => task.status === status)
            .sort(sortTasks);

        if (columnTasks.length === 0) {
            column.innerHTML = `
                <div class="column-empty">
                    ${status === "done" ? "Finished tasks land here." : "Drop a task here or use the + button."}
                </div>
            `;
            return;
        }

        column.innerHTML = columnTasks.map(createTaskCardHTML).join("");
    });
}

function renderList(visibleTasks) {
    const sortedTasks = [...visibleTasks].sort(sortTasks);
    elements.taskList.innerHTML = sortedTasks.map(createListTaskHTML).join("");
}

function sortTasks(firstTask, secondTask) {
    const priorityOrder = { high: 1, medium: 2, low: 3 };

    // Tasks with a due date come before tasks without one.
    if (firstTask.dueDate && !secondTask.dueDate) return -1;
    if (!firstTask.dueDate && secondTask.dueDate) return 1;

    // Earlier due dates come first.
    if (firstTask.dueDate !== secondTask.dueDate) {
        return firstTask.dueDate.localeCompare(secondTask.dueDate);
    }

    // If dates match, higher priority comes first.
    return priorityOrder[firstTask.priority] - priorityOrder[secondTask.priority];
}

function createTaskCardHTML(task) {
    const safeTitle = escapeHTML(task.title);
    const safeNotes = escapeHTML(task.notes);
    const categoryClass = task.category.toLowerCase();
    const energyDetails = getEnergyDetails(task.energy);
    const dateDetails = getDateDetails(task.dueDate, task.status);
    const completedClass = task.status === "done" ? "completed" : "";

    return `
        <article class="task-card ${completedClass}" draggable="true" data-task-id="${task.id}">
            <div class="task-card-top">
                <span class="category-tag ${categoryClass}">${escapeHTML(task.category)}</span>
                <button class="task-menu-button" type="button" data-action="menu" aria-label="Task options">•••</button>
                <div class="task-menu" hidden>
                    <button type="button" data-action="edit">Edit task</button>
                    <button type="button" data-action="duplicate">Duplicate</button>
                    <button class="danger" type="button" data-action="delete">Delete</button>
                </div>
            </div>
            <h4 class="task-card-title">${safeTitle}</h4>
            ${safeNotes ? `<p class="task-card-notes">${safeNotes}</p>` : ""}
            <div class="task-card-meta">
                <span class="task-date ${dateDetails.className}">${dateDetails.label}</span>
                <span class="energy-tag" title="${energyDetails.fullLabel}">${energyDetails.shortLabel}</span>
                <span class="priority-badge ${task.priority}" title="${capitalize(task.priority)} priority"></span>
                <button
                    class="complete-button ${task.status === "done" ? "checked" : ""}"
                    type="button"
                    data-action="complete"
                    aria-label="${task.status === "done" ? "Mark as not complete" : "Mark as complete"}"
                >✓</button>
            </div>
        </article>
    `;
}

function createListTaskHTML(task) {
    const categoryClass = task.category.toLowerCase();
    const dateDetails = getDateDetails(task.dueDate, task.status);
    const completedClass = task.status === "done" ? "completed" : "";

    return `
        <article class="list-task ${completedClass}" data-task-id="${task.id}">
            <div class="list-title-cell">
                <button
                    class="complete-button ${task.status === "done" ? "checked" : ""}"
                    type="button"
                    data-action="complete"
                    aria-label="${task.status === "done" ? "Mark as not complete" : "Mark as complete"}"
                >✓</button>
                <strong title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</strong>
            </div>
            <span class="category-tag ${categoryClass}">${escapeHTML(task.category)}</span>
            <span class="task-date ${dateDetails.className}">${dateDetails.label}</span>
            <span><i class="priority-badge ${task.priority}"></i> ${capitalize(task.priority)}</span>
            <div class="list-actions">
                <button class="task-menu-button" type="button" data-action="menu" aria-label="Task options">•••</button>
                <div class="task-menu" hidden>
                    <button type="button" data-action="edit">Edit task</button>
                    <button type="button" data-action="duplicate">Duplicate</button>
                    <button class="danger" type="button" data-action="delete">Delete</button>
                </div>
            </div>
        </article>
    `;
}

function getDateDetails(dateString, status) {
    if (!dateString) {
        return { label: "No due date", className: "" };
    }

    const today = getTodayString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = toDateInputValue(tomorrow);

    if (dateString === today) {
        return { label: "◷ Today", className: status === "done" ? "" : "today" };
    }

    if (dateString === tomorrowString) {
        return { label: "◷ Tomorrow", className: "" };
    }

    if (dateString < today && status !== "done") {
        return { label: "◷ Overdue", className: "overdue" };
    }

    const date = new Date(`${dateString}T00:00:00`);
    return {
        label: `◷ ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        className: ""
    };
}

function getEnergyDetails(energy) {
    const options = {
        quick: { shortLabel: "5–15 min", fullLabel: "Estimated time: 5–15 minutes" },
        steady: { shortLabel: "30–60 min", fullLabel: "Estimated time: 30–60 minutes" },
        deep: { shortLabel: "1+ hr", fullLabel: "Estimated time: 1 hour or more" }
    };

    return options[energy] || options.quick;
}

function updateTaskCounts() {
    const today = getTodayString();
    const count = (test) => tasks.filter(test).length;

    setText("all-count", tasks.length);
    setText("today-count", count((task) => task.dueDate === today && task.status !== "done"));
    setText("upcoming-count", count((task) => task.dueDate > today && task.status !== "done"));
    setText("completed-count", count((task) => task.status === "done"));
    setText("personal-count", count((task) => task.category === "Personal"));
    setText("study-count", count((task) => task.category === "Study"));
    setText("work-count", count((task) => task.category === "Work"));
    setText("now-count", count((task) => task.status === "now"));
    setText("next-count", count((task) => task.status === "next"));
    setText("done-count", count((task) => task.status === "done"));
}

function updateProgress() {
    const completed = tasks.filter((task) => task.status === "done").length;
    const percentage = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

    elements.progressBar.style.width = `${percentage}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(percentage));
    elements.progressSummaryText.textContent =
        `${completed} of ${tasks.length} task${tasks.length === 1 ? "" : "s"} completed`;
}

function updateFilterMessage() {
    const labels = [];

    if (filters.smart !== "all") labels.push(filters.smart);
    if (filters.category !== "all") labels.push(filters.category);
    if (filters.priority !== "all") labels.push(`${filters.priority} priority`);
    if (filters.search) labels.push(`matching “${filters.search}”`);

    elements.activeFilters.hidden = labels.length === 0;
    elements.filterDescription.textContent = labels.length
        ? `Showing tasks: ${labels.join(" · ")}`
        : "";

    const titleMap = {
        all: "All tasks",
        today: "Today",
        upcoming: "Upcoming",
        completed: "Completed"
    };

    elements.viewTitle.textContent =
        filters.category !== "all" ? `${filters.category} tasks` : titleMap[filters.smart];
}

function updateEmptyState(visibleTasks) {
    const isEmpty = visibleTasks.length === 0;

    elements.emptyState.hidden = !isEmpty;
    elements.boardView.hidden = isEmpty || currentView !== "board";
    elements.listView.hidden = isEmpty || currentView !== "list";

    if (tasks.length === 0) {
        elements.emptyTitle.textContent = "No tasks yet";
        elements.emptyMessage.textContent = "Create a task to get started.";
        elements.emptyAddButton.textContent = "Create my first task";
    } else {
        elements.emptyTitle.textContent = "No tasks found here";
        elements.emptyMessage.textContent =
            "Try clearing a filter or search for something different.";
        elements.emptyAddButton.textContent = "Create another task";
    }
}

// ---------- 5. Creating and editing tasks ----------

function openTaskForm(status = "now", taskToEdit = null) {
    elements.taskForm.reset();
    elements.formMessage.textContent = "";

    if (taskToEdit) {
        elements.taskId.value = taskToEdit.id;
        elements.taskTitle.value = taskToEdit.title;
        elements.taskNotes.value = taskToEdit.notes;
        elements.taskCategory.value = taskToEdit.category;
        elements.taskDate.value = taskToEdit.dueDate;
        elements.taskStatus.value = taskToEdit.status;
        elements.taskEnergy.value = taskToEdit.energy;
        document.querySelector(
            `input[name="priority"][value="${taskToEdit.priority}"]`
        ).checked = true;
        elements.modalTitle.textContent = "Edit your task";
        elements.submitLabel.textContent = "Save changes";
    } else {
        elements.taskId.value = "";
        elements.taskStatus.value = status;
        elements.taskEnergy.value = "quick";
        elements.modalTitle.textContent = "Create a task";
        elements.submitLabel.textContent = "Create task";
    }

    updateTitleCount();
    showModal(elements.taskModal);
    window.setTimeout(() => elements.taskTitle.focus(), 50);
}

function closeTaskForm() {
    hideModal(elements.taskModal);
    elements.taskForm.reset();
    elements.formMessage.textContent = "";
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const title = elements.taskTitle.value.trim();

    if (title.length < 2) {
        elements.formMessage.textContent = "Please write at least 2 characters for the task.";
        elements.taskTitle.focus();
        return;
    }

    const selectedPriority = document.querySelector(
        'input[name="priority"]:checked'
    ).value;

    const taskData = {
        title,
        notes: elements.taskNotes.value.trim(),
        category: elements.taskCategory.value,
        dueDate: elements.taskDate.value,
        priority: selectedPriority,
        status: elements.taskStatus.value,
        energy: elements.taskEnergy.value
    };

    const editingId = elements.taskId.value;

    if (editingId) {
        const taskIndex = tasks.findIndex((task) => task.id === editingId);

        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
            showToast("Task updated");
        }
    } else {
        tasks.push({
            id: createId(),
            ...taskData,
            createdAt: Date.now()
        });
        showToast("Task created");
    }

    saveTasks();
    renderApp();
    closeTaskForm();
}

function editTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (task) openTaskForm(task.status, task);
}

function duplicateTask(taskId) {
    const originalTask = tasks.find((task) => task.id === taskId);
    if (!originalTask) return;

    tasks.push({
        ...originalTask,
        id: createId(),
        title: `${originalTask.title} (copy)`,
        status: originalTask.status === "done" ? "next" : originalTask.status,
        createdAt: Date.now()
    });

    saveTasks();
    renderApp();
    showToast("Task duplicated");
}

function deleteTask(taskId) {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) return;

    recentlyDeletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    saveTasks();
    renderApp();
    showToast("Task removed", true);
}

function undoDelete() {
    if (!recentlyDeletedTask) return;

    tasks.push(recentlyDeletedTask);
    recentlyDeletedTask = null;
    saveTasks();
    renderApp();
    hideToast();
}

function toggleTaskComplete(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    if (task.status === "done") {
        task.status = "next";
        showToast("Task moved back to Next");
    } else {
        task.status = "done";
        showToast("Task completed");
    }

    saveTasks();
    renderApp();
}

// ---------- 6. Click, filter, and view events ----------

elements.taskForm.addEventListener("submit", handleTaskSubmit);
elements.openTaskModal.addEventListener("click", () => openTaskForm());
elements.mobileAddTask.addEventListener("click", () => openTaskForm());
elements.emptyAddButton.addEventListener("click", () => openTaskForm());
elements.closeTaskModal.addEventListener("click", closeTaskForm);
elements.cancelTask.addEventListener("click", closeTaskForm);

elements.taskTitle.addEventListener("input", updateTitleCount);

function updateTitleCount() {
    elements.titleCount.textContent = elements.taskTitle.value.length;
}

document.querySelectorAll("[data-add-status]").forEach((button) => {
    button.addEventListener("click", () => {
        openTaskForm(button.dataset.addStatus);
    });
});

document.querySelectorAll("[data-smart-filter]").forEach((button) => {
    button.addEventListener("click", () => {
        filters.smart = button.dataset.smartFilter;
        filters.category = "all";
        setActiveNavigation(button);
        closeSidebar();
        renderApp();
    });
});

document.querySelectorAll("[data-category-filter]").forEach((button) => {
    button.addEventListener("click", () => {
        filters.smart = "all";
        filters.category = button.dataset.categoryFilter;
        setActiveNavigation(button);
        closeSidebar();
        renderApp();
    });
});

function setActiveNavigation(activeButton) {
    document.querySelectorAll(".nav-item").forEach((button) => {
        button.classList.toggle("active", button === activeButton);
    });
}

elements.searchInput.addEventListener("input", () => {
    filters.search = elements.searchInput.value.trim();
    renderApp();
});

elements.priorityFilter.addEventListener("change", () => {
    filters.priority = elements.priorityFilter.value;
    renderApp();
});

elements.clearFilters.addEventListener("click", clearAllFilters);

function clearAllFilters() {
    filters.smart = "all";
    filters.category = "all";
    filters.priority = "all";
    filters.search = "";

    elements.searchInput.value = "";
    elements.priorityFilter.value = "all";
    setActiveNavigation(document.querySelector('[data-smart-filter="all"]'));
    renderApp();
}

elements.boardViewButton.addEventListener("click", () => changeView("board"));
elements.listViewButton.addEventListener("click", () => changeView("list"));

function changeView(view) {
    currentView = view;
    elements.boardViewButton.classList.toggle("active", view === "board");
    elements.listViewButton.classList.toggle("active", view === "list");
    renderApp();
    saveSettings();
}

// Event delegation lets one listener handle all current and future task cards.
elements.boardView.addEventListener("click", handleTaskAreaClick);
elements.taskList.addEventListener("click", handleTaskAreaClick);

function handleTaskAreaClick(event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const taskContainer = actionButton.closest("[data-task-id]");
    if (!taskContainer) return;

    const taskId = taskContainer.dataset.taskId;
    const action = actionButton.dataset.action;

    if (action === "menu") {
        const menu = actionButton.nextElementSibling;
        const shouldOpen = menu.hidden;
        closeAllTaskMenus();
        menu.hidden = !shouldOpen;
    } else if (action === "edit") {
        editTask(taskId);
    } else if (action === "duplicate") {
        duplicateTask(taskId);
    } else if (action === "delete") {
        deleteTask(taskId);
    } else if (action === "complete") {
        toggleTaskComplete(taskId);
    }
}

document.addEventListener("click", (event) => {
    if (!event.target.closest(".task-menu") && !event.target.closest(".task-menu-button")) {
        closeAllTaskMenus();
    }
});

function closeAllTaskMenus() {
    document.querySelectorAll(".task-menu").forEach((menu) => {
        menu.hidden = true;
    });
}

// ---------- 7. Drag and drop board ----------

elements.boardView.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".task-card");
    if (!card) return;

    draggedTaskId = card.dataset.taskId;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedTaskId);
});

elements.boardView.addEventListener("dragend", (event) => {
    const card = event.target.closest(".task-card");
    if (card) card.classList.remove("dragging");

    document.querySelectorAll(".board-column").forEach((column) => {
        column.classList.remove("drag-over");
    });
    draggedTaskId = null;
});

document.querySelectorAll(".board-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", (event) => {
        if (!column.contains(event.relatedTarget)) {
            column.classList.remove("drag-over");
        }
    });

    column.addEventListener("drop", (event) => {
        event.preventDefault();
        const newStatus = column.dataset.status;
        const taskId = draggedTaskId || event.dataTransfer.getData("text/plain");
        const task = tasks.find((item) => item.id === taskId);

        if (task && task.status !== newStatus) {
            task.status = newStatus;
            saveTasks();
            renderApp();
            showToast(`Task moved to ${capitalize(newStatus)}`);
        }

        column.classList.remove("drag-over");
    });
});

// ---------- 8. Theme and sidebar ----------

document.querySelectorAll("[data-theme-toggle], #theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const isDark = document.documentElement.dataset.theme === "dark";
        setTheme(isDark ? "light" : "dark");
        saveSettings();
    });
});

function setTheme(theme) {
    if (theme === "dark") {
        document.documentElement.dataset.theme = "dark";
        elements.themeIcon.textContent = "☀";
        elements.themeLabel.textContent = "Light mode";
        elements.quickThemeIcon.textContent = "☀";
        elements.quickThemeToggle.setAttribute("aria-label", "Switch to light mode");
        elements.quickThemeToggle.title = "Switch to light mode";
    } else {
        delete document.documentElement.dataset.theme;
        elements.themeIcon.textContent = "☾";
        elements.themeLabel.textContent = "Dark mode";
        elements.quickThemeIcon.textContent = "☾";
        elements.quickThemeToggle.setAttribute("aria-label", "Switch to dark mode");
        elements.quickThemeToggle.title = "Switch to dark mode";
    }
}

elements.menuButton.addEventListener("click", openSidebar);
elements.sidebarClose.addEventListener("click", closeSidebar);
elements.sidebarBackdrop.addEventListener("click", closeSidebar);

function openSidebar() {
    elements.sidebar.classList.add("open");
    elements.sidebarBackdrop.classList.add("visible");
}

function closeSidebar() {
    elements.sidebar.classList.remove("open");
    elements.sidebarBackdrop.classList.remove("visible");
}

// ---------- 9. Focus timer ----------

elements.focusButton.addEventListener("click", openFocusMode);
elements.closeFocusModal.addEventListener("click", closeFocusMode);
elements.timerToggle.addEventListener("click", toggleTimer);
elements.timerReset.addEventListener("click", resetTimer);
elements.applyFocusDuration.addEventListener("click", applyCustomFocusDuration);

document.querySelectorAll("[data-focus-minutes]").forEach((button) => {
    button.addEventListener("click", () => {
        setFocusDuration(Number(button.dataset.focusMinutes));
    });
});

elements.customFocusMinutes.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        applyCustomFocusDuration();
    }
});

function openFocusMode() {
    const focusTask = tasks.find((task) => task.status === "now");
    elements.focusTaskName.textContent = focusTask
        ? focusTask.title
        : "Move a task into “Now” to make it your focus.";
    showModal(elements.focusModal);
}

function closeFocusMode() {
    hideModal(elements.focusModal);
}

function applyCustomFocusDuration() {
    const requestedMinutes = Number(elements.customFocusMinutes.value);

    if (
        !Number.isFinite(requestedMinutes) ||
        !Number.isInteger(requestedMinutes) ||
        requestedMinutes < MIN_FOCUS_MINUTES ||
        requestedMinutes > MAX_FOCUS_MINUTES
    ) {
        elements.focusDurationHint.textContent =
            `Enter a whole number from ${MIN_FOCUS_MINUTES} to ${MAX_FOCUS_MINUTES}.`;
        elements.focusDurationHint.classList.add("error");
        elements.customFocusMinutes.focus();
        return;
    }

    setFocusDuration(Math.round(requestedMinutes));
}

function setFocusDuration(minutes, shouldSave = true) {
    const safeMinutes = Math.min(
        MAX_FOCUS_MINUTES,
        Math.max(MIN_FOCUS_MINUTES, Math.round(Number(minutes)))
    );

    pauseTimer();
    focusSessionStarted = false;
    selectedFocusMinutes = safeMinutes;
    secondsRemaining = selectedFocusMinutes * 60;
    elements.customFocusMinutes.value = selectedFocusMinutes;
    elements.focusDurationHint.textContent =
        `Timer set to ${selectedFocusMinutes} minute${selectedFocusMinutes === 1 ? "" : "s"}.`;
    elements.focusDurationHint.classList.remove("error");
    elements.timerToggle.textContent = `Start ${selectedFocusMinutes} min`;

    document.querySelectorAll("[data-focus-minutes]").forEach((button) => {
        const isActive = Number(button.dataset.focusMinutes) === selectedFocusMinutes;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    updateTimerDisplay();
    if (shouldSave) saveSettings();
}

function toggleTimer() {
    // If an interval ID already exists, the timer is running.
    // Clicking the same button should pause it instead of starting a second
    // interval on top of the first one.
    if (focusIntervalId !== null) {
        pauseTimer();
        return;
    }

    if (secondsRemaining <= 0) {
        secondsRemaining = selectedFocusMinutes * 60;
        updateTimerDisplay();
    }

    focusSessionStarted = true;
    elements.timerToggle.textContent = "Pause";
    updateHeaderFocusDisplay();

    // setInterval repeats this function every 1000 milliseconds (1 second).
    // The returned ID is saved in focusIntervalId.
    focusIntervalId = setInterval(function countDownOneSecond() {
        secondsRemaining -= 1;
        updateTimerDisplay();

        if (secondsRemaining <= 0) {
            pauseTimer();
            showToast("Focus session complete! Take a short break.");
        }
    }, 1000);
}

function pauseTimer() {
    // clearInterval needs the ID returned by setInterval.
    if (focusIntervalId !== null) {
        clearInterval(focusIntervalId);
        focusIntervalId = null;
    }

    if (secondsRemaining <= 0) {
        elements.timerToggle.textContent = "Restart";
    } else if (secondsRemaining === selectedFocusMinutes * 60) {
        elements.timerToggle.textContent = `Start ${selectedFocusMinutes} min`;
    } else {
        elements.timerToggle.textContent = "Continue";
    }

    updateHeaderFocusDisplay();
}

function resetTimer() {
    pauseTimer();
    focusSessionStarted = false;
    secondsRemaining = selectedFocusMinutes * 60;
    updateTimerDisplay();
    elements.timerToggle.textContent = `Start ${selectedFocusMinutes} min`;
}

function updateTimerDisplay() {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    elements.focusTimer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    updateHeaderFocusDisplay();
}

function formatTimerTime(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateHeaderFocusDisplay() {
    const totalSessionSeconds = selectedFocusMinutes * 60;
    const elapsedSeconds = Math.max(0, totalSessionSeconds - secondsRemaining);
    const isRunning = focusIntervalId !== null;
    const isComplete = focusSessionStarted && secondsRemaining <= 0;

    elements.focusLabel.hidden = focusSessionStarted;
    elements.focusLive.hidden = !focusSessionStarted;
    elements.focusButton.classList.toggle("timer-active", focusSessionStarted);
    elements.focusButton.classList.toggle("timer-running", isRunning);
    elements.focusButton.classList.toggle("timer-complete", isComplete);

    elements.headerTimeLeft.textContent = formatTimerTime(secondsRemaining);
    elements.headerTimeElapsed.textContent = formatTimerTime(elapsedSeconds);

    if (!focusSessionStarted) {
        elements.focusButton.setAttribute("aria-label", "Open focus timer");
        elements.focusButton.title = "Open focus timer";
        return;
    }

    let stateText = "paused";
    if (isRunning) stateText = "running";
    if (isComplete) stateText = "complete";

    const accessibleStatus =
        `${formatTimerTime(secondsRemaining)} remaining, ` +
        `${formatTimerTime(elapsedSeconds)} elapsed, timer ${stateText}. ` +
        "Open focus timer.";

    elements.focusButton.setAttribute("aria-label", accessibleStatus);
    elements.focusButton.title = accessibleStatus;
}

// ---------- 10. Modals, keyboard shortcuts, and toast ----------

elements.helpButton.addEventListener("click", () => showModal(elements.helpModal));
elements.closeHelpModal.addEventListener("click", () => hideModal(elements.helpModal));

document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
        if (event.target !== backdrop) return;

        if (backdrop === elements.taskModal) closeTaskForm();
        else hideModal(backdrop);
    });
});

function showModal(modal) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
}

function hideModal(modal) {
    modal.hidden = true;

    const anyModalOpen = [...document.querySelectorAll(".modal-backdrop")]
        .some((item) => !item.hidden);

    if (!anyModalOpen) document.body.style.overflow = "";
}

document.addEventListener("keydown", (event) => {
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement.tagName
    );

    if (event.key === "Escape") {
        closeTaskForm();
        closeFocusMode();
        hideModal(elements.helpModal);
        closeSidebar();
        closeAllTaskMenus();
    }

    if (isTyping) return;

    if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openTaskForm();
    }

    if (event.key === "/") {
        event.preventDefault();
        elements.searchInput.focus();
    }
});

elements.toastAction.addEventListener("click", undoDelete);

function showToast(message, showUndo = false) {
    window.clearTimeout(toastTimeout);
    elements.toastMessage.textContent = message;
    elements.toastAction.hidden = !showUndo;
    elements.toastIcon.textContent = showUndo ? "↶" : "✓";
    elements.toast.classList.add("visible");

    toastTimeout = window.setTimeout(hideToast, showUndo ? 6000 : 3000);
}

function hideToast() {
    elements.toast.classList.remove("visible");
    window.clearTimeout(toastTimeout);
}

// ---------- 11. Small reusable utilities ----------

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function escapeHTML(value) {
    // Text from users must be escaped before being placed inside HTML.
    // This prevents typed HTML from becoming real page elements.
    const temporaryElement = document.createElement("div");
    temporaryElement.textContent = value || "";
    return temporaryElement.innerHTML;
}

function getGreetingForHour(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function updateDateAndGreeting() {
    const now = new Date();
    const currentDate = toDateInputValue(now);
    const greeting = getGreetingForHour(now.getHours());

    setText("greeting", greeting);
    setText("date-month", now.toLocaleDateString(undefined, { month: "short" }).toUpperCase());
    setText("date-day", now.getDate());
    setText(
        "full-date",
        now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric"
        })
    );

    // A tab can remain open overnight. Re-render date-sensitive filters,
    // due-date labels, and counts when the visitor's local day changes.
    if (lastKnownDate && lastKnownDate !== currentDate) {
        renderApp();
    }

    lastKnownDate = currentDate;
}

function startAutomaticDateUpdates() {
    setInterval(updateDateAndGreeting, DATE_REFRESH_INTERVAL);

    // Browser timers may slow down in a background tab. Refresh immediately
    // when the user returns instead of waiting for the next interval.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) updateDateAndGreeting();
    });

    window.addEventListener("focus", updateDateAndGreeting);
}

function saveSettings() {
    const settings = {
        theme: document.documentElement.dataset.theme || "light",
        view: currentView,
        focusMinutes: selectedFocusMinutes
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
    try {
        const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY));

        if (savedSettings) {
            setTheme(savedSettings.theme);
            currentView = savedSettings.view === "list" ? "list" : "board";
            elements.boardViewButton.classList.toggle("active", currentView === "board");
            elements.listViewButton.classList.toggle("active", currentView === "list");
            setFocusDuration(
                Number(savedSettings.focusMinutes) || DEFAULT_FOCUS_MINUTES,
                false
            );
            return;
        }
    } catch (error) {
        console.warn("Orbit could not read saved settings:", error);
    }

    // Respect the device color preference the first time the app opens.
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
}

// ---------- 12. Start the app ----------

loadSettings();
updateDateAndGreeting();
renderApp();
startAutomaticDateUpdates();
