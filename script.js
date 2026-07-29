/*
    ============================================================
    ORBIT TASK STUDIO
    ============================================================
    Orbit uses plain JavaScript and one predictable update cycle:

    1. Read or change application data.
    2. Save the data to localStorage.
    3. Call renderApp() to redraw everything that depends on it.

    The recommendation system is rule-based. It does not call an
    external service and does not modify the user's tasks.
*/

// ---------- 1. HTML elements ----------

const elements = {
    taskForm: document.querySelector("#task-form"),
    taskModal: document.querySelector("#task-modal"),
    helpModal: document.querySelector("#help-modal"),
    openTaskModal: document.querySelector("#open-task-modal"),
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
    taskDuration: document.querySelector("#task-duration"),
    taskCustomDuration: document.querySelector("#task-custom-duration"),
    customDurationField: document.querySelector("#custom-duration-field"),
    titleCount: document.querySelector("#title-count"),
    modalTitle: document.querySelector("#modal-title"),
    submitLabel: document.querySelector("#submit-label"),
    formMessage: document.querySelector("#form-message"),
    searchInput: document.querySelector("#search-input"),
    quickAddToggle: document.querySelector("#quick-add-toggle"),
    quickCapturePreview: document.querySelector("#quick-capture-preview"),
    quickCaptureTitle: document.querySelector("#quick-capture-title"),
    quickCaptureMeta: document.querySelector("#quick-capture-meta"),
    quickCaptureMessage: document.querySelector("#quick-capture-message"),
    quickCaptureAdd: document.querySelector("#quick-capture-add"),
    quickCaptureCancel: document.querySelector("#quick-capture-cancel"),
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
    emptyWorkflow: document.querySelector("#empty-workflow"),
    nowColumn: document.querySelector("#now-column"),
    nextColumn: document.querySelector("#next-column"),
    doneColumn: document.querySelector("#done-column"),
    progressSummaryText: document.querySelector("#progress-summary-text"),
    progressTrack: document.querySelector("#progress-track"),
    progressBar: document.querySelector("#progress-bar"),
    momentumPercent: document.querySelector("#momentum-percent"),
    momentumFocusMinutes: document.querySelector("#momentum-focus-minutes"),
    dailyTasksToday: document.querySelector("#daily-tasks-today"),
    dailyHighPriority: document.querySelector("#daily-high-priority"),
    dailyPlannedMinutes: document.querySelector("#daily-planned-minutes"),
    recommendationHeading: document.querySelector("#recommendation-heading"),
    recommendationMeta: document.querySelector("#recommendation-meta"),
    recommendationReason: document.querySelector("#recommendation-reason"),
    recommendationAction: document.querySelector("#recommendation-action"),
    themeToggle: document.querySelector("#theme-toggle"),
    themeIcon: document.querySelector("#theme-icon"),
    themeLabel: document.querySelector("#theme-label"),
    quickThemeToggle: document.querySelector("#quick-theme-toggle"),
    quickThemeIcon: document.querySelector("#quick-theme-icon"),
    sidebar: document.querySelector("#sidebar"),
    sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
    menuButton: document.querySelector("#menu-button"),
    sidebarClose: document.querySelector("#sidebar-close"),
    sidebarCollapse: document.querySelector("#sidebar-collapse"),
    workspaceLayout: document.querySelector("#workspace-layout"),
    focusPanel: document.querySelector("#focus-panel"),
    focusPanelBackdrop: document.querySelector("#focus-panel-backdrop"),
    focusButton: document.querySelector("#focus-button"),
    focusButtonIcon: document.querySelector(".focus-button-icon"),
    focusLabel: document.querySelector(".focus-label"),
    focusLive: document.querySelector("#focus-live"),
    headerTimeLeft: document.querySelector("#header-time-left"),
    headerTimeElapsed: document.querySelector("#header-time-elapsed"),
    closeFocusPanel: document.querySelector("#close-focus-panel"),
    focusTitle: document.querySelector("#focus-title"),
    focusTaskName: document.querySelector("#focus-task-name"),
    focusTaskMeta: document.querySelector("#focus-task-meta"),
    focusTimer: document.querySelector("#focus-timer"),
    focusRingProgress: document.querySelector("#focus-ring-progress"),
    focusStatus: document.querySelector("#focus-status"),
    timerToggle: document.querySelector("#timer-toggle"),
    timerReset: document.querySelector("#timer-reset"),
    completeFocusTask: document.querySelector("#complete-focus-task"),
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

// ---------- 2. Storage keys and application state ----------

const STORAGE_KEY = "orbit-tasks-v2";
const SETTINGS_KEY = "orbit-settings-v1";
const FOCUS_STORAGE_KEY = "orbit-focus-session-v1";
const DAILY_FOCUS_KEY = "orbit-daily-focus-v1";
const DEFAULT_TASK_MINUTES = 30;
const DEFAULT_FOCUS_MINUTES = 25;
const MIN_FOCUS_MINUTES = 1;
const MAX_FOCUS_MINUTES = 180;
const DATE_REFRESH_INTERVAL = 30 * 1000;
const FOCUS_RING_CIRCUMFERENCE = 2 * Math.PI * 52;

const filters = {
    smart: "all",
    category: "all",
    priority: "all",
    search: ""
};

let tasks = loadTasks();
let currentView = "board";
let currentEnergy = "normal";
let sidebarCollapsed = false;
let quickCaptureMode = false;
let quickCaptureTask = null;
let recommendedTaskId = null;
let draggedTaskId = null;
let lastKnownDate = "";
let toastTimeout = null;
let undoAction = null;
let activeModal = null;
let previouslyFocusedElement = null;
let focusIntervalId = null;
let focusSession = createEmptyFocusSession(DEFAULT_FOCUS_MINUTES);

// ---------- 3. Safe task loading and migration ----------

function loadTasks() {
    try {
        const savedValue = localStorage.getItem(STORAGE_KEY);
        if (!savedValue) return [];

        const parsedValue = JSON.parse(savedValue);
        if (!Array.isArray(parsedValue)) return [];

        const migratedTasks = migrateTasks(parsedValue);
        const changed = JSON.stringify(migratedTasks) !== JSON.stringify(parsedValue);

        if (changed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedTasks));
        }

        return migratedTasks;
    } catch (error) {
        console.warn("Orbit could not read saved tasks:", error);
        return [];
    }
}

function migrateTasks(savedTasks) {
    return savedTasks
        .map((task) => migrateTask(task))
        .filter(Boolean);
}

function migrateTask(task) {
    if (!task || typeof task !== "object") return null;

    const title = typeof task.title === "string" ? task.title.trim() : "";
    if (!title) return null;

    const legacyEnergyMinutes = {
        quick: 15,
        steady: 45,
        deep: 60
    };
    const legacyEnergyNames = {
        quick: "low",
        steady: "normal",
        deep: "high"
    };

    const oldStatus = task.status || task.stage;
    let status = ["now", "next", "done"].includes(oldStatus)
        ? oldStatus
        : "next";

    if (!task.status && !task.stage && task.completed === true) {
        status = "done";
    }

    const requestedMinutes = Number(task.estimatedMinutes);
    const estimatedMinutes = isValidDuration(requestedMinutes)
        ? Math.round(requestedMinutes)
        : legacyEnergyMinutes[task.energy] || DEFAULT_TASK_MINUTES;

    const energy = ["low", "normal", "high"].includes(task.energy)
        ? task.energy
        : legacyEnergyNames[task.energy] || "normal";

    const categorySource = task.category || task.space;
    const category = ["Personal", "Study", "Work"].includes(categorySource)
        ? categorySource
        : capitalize(String(categorySource || "Personal").toLowerCase());

    return {
        ...task,
        id: String(task.id || createId()),
        title,
        notes: String(task.notes ?? task.description ?? ""),
        category: ["Personal", "Study", "Work"].includes(category)
            ? category
            : "Personal",
        dueDate: isDateInputValue(task.dueDate) ? task.dueDate : "",
        priority: ["low", "medium", "high"].includes(task.priority)
            ? task.priority
            : "medium",
        status,
        energy,
        estimatedMinutes,
        completed: status === "done",
        createdAt: Number(task.createdAt) || Date.now()
    };
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.warn("Orbit could not save tasks:", error);
        showToast("Tasks could not be saved in this browser");
    }
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isValidDuration(value) {
    return Number.isFinite(value) &&
        Number.isInteger(value) &&
        value >= MIN_FOCUS_MINUTES &&
        value <= MAX_FOCUS_MINUTES;
}

function isDateInputValue(value) {
    return typeof value === "string" &&
        (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
}

// ---------- 4. Rendering ----------

function renderApp() {
    const visibleTasks = getFilteredTasks();

    updateTaskCounts();
    renderDailyHeader();
    renderDailyMomentum();
    renderRecommendation();
    updateFilterMessage();
    renderBoard(visibleTasks);
    renderList(visibleTasks);
    updateEmptyState(visibleTasks);
    renderFocusPanel();
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
        const searchableText =
            `${task.title} ${task.notes} ${task.category}`.toLowerCase();
        const matchesSearch =
            searchableText.includes(filters.search.toLowerCase());

        return matchesSmartFilter &&
            matchesCategory &&
            matchesPriority &&
            matchesSearch;
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
            const messages = {
                now: "Move a task here when you are ready to begin.",
                next: "Tasks planned for later will wait here.",
                done: "Completed tasks remain visible here."
            };
            column.innerHTML = `<div class="column-empty">${messages[status]}</div>`;
            return;
        }

        column.innerHTML = columnTasks.map(createTaskCardHTML).join("");
    });
}

function renderList(visibleTasks) {
    const sortedTasks = [...visibleTasks].sort(sortTasks);
    elements.taskList.innerHTML =
        sortedTasks.map(createListTaskHTML).join("");
}

function sortTasks(firstTask, secondTask) {
    const priorityOrder = { high: 1, medium: 2, low: 3 };

    if (firstTask.dueDate && !secondTask.dueDate) return -1;
    if (!firstTask.dueDate && secondTask.dueDate) return 1;

    if (firstTask.dueDate !== secondTask.dueDate) {
        return firstTask.dueDate.localeCompare(secondTask.dueDate);
    }

    return priorityOrder[firstTask.priority] -
        priorityOrder[secondTask.priority];
}

function createTaskCardHTML(task) {
    const categoryClass = task.category.toLowerCase();
    const dateDetails = getDateDetails(task.dueDate, task.status);
    const completedClass = task.status === "done" ? "completed" : "";
    const safeTitle = escapeHTML(task.title);
    const safeNotes = escapeHTML(task.notes);

    return `
        <article
            class="task-card ${categoryClass} ${completedClass}"
            draggable="true"
            data-task-id="${escapeHTML(task.id)}"
        >
            <div class="task-card-main">
                <div class="task-card-top">
                    <span class="category-tag ${categoryClass}">${escapeHTML(task.category)}</span>
                </div>
                <h4 class="task-card-title">${safeTitle}</h4>
                ${safeNotes ? `<p class="task-card-notes">${safeNotes}</p>` : ""}
                <div class="task-card-info">
                    <div class="task-info-line">
                        <span class="task-date ${dateDetails.className}">${dateDetails.label}</span>
                        <span class="separator">·</span>
                        <span>${task.estimatedMinutes} min</span>
                    </div>
                    <div class="task-info-line">
                        <span class="task-energy-text ${task.energy}">${capitalize(task.energy)} energy</span>
                        <span class="separator">·</span>
                        <span class="task-priority-text ${task.priority}">${capitalize(task.priority)} priority</span>
                    </div>
                </div>
            </div>
            <div class="task-card-actions">
                ${task.status === "done" ? "" : `
                    <button class="focus-task-button" type="button" data-action="focus">Focus</button>
                `}
                <button
                    class="complete-button ${task.status === "done" ? "checked" : ""}"
                    type="button"
                    data-action="${task.status === "done" ? "restore" : "complete"}"
                    aria-label="${task.status === "done" ? "Restore task to Next" : "Mark task complete"}"
                >✓</button>
                <div class="list-actions">
                    <button
                        class="task-menu-button"
                        type="button"
                        data-action="menu"
                        aria-label="More options for ${safeTitle}"
                        aria-expanded="false"
                    >More</button>
                    ${createTaskMenuHTML(task)}
                </div>
            </div>
        </article>
    `;
}

function createListTaskHTML(task) {
    const categoryClass = task.category.toLowerCase();
    const dateDetails = getDateDetails(task.dueDate, task.status);
    const completedClass = task.status === "done" ? "completed" : "";
    const safeTitle = escapeHTML(task.title);

    return `
        <article class="list-task ${completedClass}" data-task-id="${escapeHTML(task.id)}">
            <div class="list-title-cell">
                <button
                    class="complete-button ${task.status === "done" ? "checked" : ""}"
                    type="button"
                    data-action="${task.status === "done" ? "restore" : "complete"}"
                    aria-label="${task.status === "done" ? "Restore task to Next" : "Mark task complete"}"
                >✓</button>
                <strong title="${safeTitle}">${safeTitle}</strong>
            </div>
            <span class="category-tag ${categoryClass}">${escapeHTML(task.category)}</span>
            <span class="list-task-due">
                <span class="task-date ${dateDetails.className}">${dateDetails.label}</span>
                <small>${task.estimatedMinutes} min · ${capitalize(task.energy)} energy</small>
            </span>
            <span><i class="priority-badge ${task.priority}"></i> ${capitalize(task.priority)}</span>
            <div class="list-actions">
                <button
                    class="task-menu-button"
                    type="button"
                    data-action="menu"
                    aria-label="More options for ${safeTitle}"
                    aria-expanded="false"
                >•••</button>
                ${createTaskMenuHTML(task)}
            </div>
        </article>
    `;
}

function createTaskMenuHTML(task) {
    const isDone = task.status === "done";

    return `
        <div class="task-menu" role="menu" hidden>
            ${isDone ? "" : `<button type="button" role="menuitem" data-action="focus">Start focus</button>`}
            <button type="button" role="menuitem" data-action="edit">Edit task</button>
            <button type="button" role="menuitem" data-action="move-now" ${task.status === "now" ? "disabled" : ""}>Move to Now</button>
            <button type="button" role="menuitem" data-action="move-next" ${task.status === "next" ? "disabled" : ""}>Move to Next</button>
            <button type="button" role="menuitem" data-action="${isDone ? "restore" : "complete"}">
                ${isDone ? "Restore task" : "Mark complete"}
            </button>
            <button type="button" role="menuitem" data-action="duplicate">Duplicate</button>
            <button class="danger" type="button" role="menuitem" data-action="delete">Delete</button>
        </div>
    `;
}

function getDateDetails(dateString, status = "next") {
    if (!dateString) {
        return { label: "No due date", className: "" };
    }

    const today = getTodayString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = toDateInputValue(tomorrow);

    if (dateString === today) {
        return {
            label: "Today",
            className: status === "done" ? "" : "today"
        };
    }

    if (dateString === tomorrowString) {
        return { label: "Tomorrow", className: "" };
    }

    if (dateString < today && status !== "done") {
        return { label: "Overdue", className: "overdue" };
    }

    const date = new Date(`${dateString}T00:00:00`);
    return {
        label: date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
        }),
        className: ""
    };
}

function updateTaskCounts() {
    const today = getTodayString();
    const count = (test) => tasks.filter(test).length;

    setText("all-count", tasks.length);
    setText("today-count", count((task) =>
        task.dueDate === today && task.status !== "done"
    ));
    setText("upcoming-count", count((task) =>
        task.dueDate > today && task.status !== "done"
    ));
    setText("completed-count", count((task) => task.status === "done"));
    setText("personal-count", count((task) => task.category === "Personal"));
    setText("study-count", count((task) => task.category === "Study"));
    setText("work-count", count((task) => task.category === "Work"));
    setText("now-count", count((task) => task.status === "now"));
    setText("next-count", count((task) => task.status === "next"));
    setText("done-count", count((task) => task.status === "done"));
}

function renderDailyHeader() {
    const today = getTodayString();
    const incompleteTasks = tasks.filter((task) => task.status !== "done");
    const todayTasks = incompleteTasks.filter((task) => task.dueDate === today);
    const highPriorityTasks = incompleteTasks.filter(
        (task) => task.priority === "high"
    );
    const plannedMinutes = todayTasks.reduce(
        (total, task) => total + task.estimatedMinutes,
        0
    );

    elements.dailyTasksToday.textContent = todayTasks.length;
    elements.dailyHighPriority.textContent = highPriorityTasks.length;
    elements.dailyPlannedMinutes.textContent = plannedMinutes;
}

function renderDailyMomentum() {
    const today = getTodayString();
    const tasksDueToday = tasks.filter((task) => task.dueDate === today);
    const completedToday = tasksDueToday.filter(
        (task) => task.status === "done"
    ).length;
    const percentage = tasksDueToday.length === 0
        ? 0
        : Math.round((completedToday / tasksDueToday.length) * 100);
    const focusedMinutes = Math.floor(getFocusedSecondsToday() / 60);

    elements.progressBar.style.width = `${percentage}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(percentage));
    elements.momentumPercent.textContent = `${percentage}%`;
    elements.momentumFocusMinutes.textContent =
        `${focusedMinutes} focused minute${focusedMinutes === 1 ? "" : "s"}`;
    elements.progressSummaryText.textContent = tasksDueToday.length === 0
        ? "No tasks due today"
        : `${completedToday} of ${tasksDueToday.length} mission${tasksDueToday.length === 1 ? "" : "s"} completed`;
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

    elements.viewTitle.textContent = filters.category !== "all"
        ? `${filters.category} tasks`
        : titleMap[filters.smart];
}

function updateEmptyState(visibleTasks) {
    const isEmpty = visibleTasks.length === 0;

    elements.emptyState.hidden = !isEmpty;
    elements.boardView.hidden = isEmpty || currentView !== "board";
    elements.listView.hidden = isEmpty || currentView !== "list";

    if (tasks.length === 0) {
        elements.emptyTitle.textContent = "Start your first mission";
        elements.emptyMessage.textContent =
            "Create a task and move it through a simple Now, Next and Done workflow.";
        elements.emptyAddButton.textContent = "Create your first mission";
        elements.emptyWorkflow.hidden = false;
    } else {
        elements.emptyTitle.textContent = "No tasks found here";
        elements.emptyMessage.textContent =
            "Try clearing a filter or searching for something different.";
        elements.emptyAddButton.textContent = "Create another task";
        elements.emptyWorkflow.hidden = true;
    }
}

// ---------- 5. Energy-aware recommendation ----------

function calculateTaskScore(task, selectedEnergy) {
    let score = 0;

    const priorityScores = {
        high: 30,
        medium: 20,
        low: 10
    };
    score += priorityScores[task.priority] || 10;

    if (task.energy === selectedEnergy) score += 25;
    if (isDueToday(task.dueDate)) score += 40;
    if (isOverdue(task.dueDate)) score += 60;
    if (task.status === "now") score += 20;

    return score;
}

function getRecommendedTask() {
    const openTasks = tasks.filter((task) => task.status !== "done");

    return openTasks
        .map((task) => ({
            task,
            score: calculateTaskScore(task, currentEnergy)
        }))
        .sort((first, second) => {
            if (second.score !== first.score) {
                return second.score - first.score;
            }

            return getDueDateSortValue(first.task.dueDate) -
                getDueDateSortValue(second.task.dueDate);
        })[0]?.task || null;
}

function renderRecommendation() {
    const recommendedTask = getRecommendedTask();
    const completedCount = tasks.filter(
        (task) => task.status === "done"
    ).length;

    recommendedTaskId = recommendedTask?.id || null;
    elements.recommendationAction.disabled = !recommendedTask;

    if (!recommendedTask) {
        if (tasks.length > 0 && completedCount === tasks.length) {
            elements.recommendationHeading.textContent =
                "Everything is complete";
            elements.recommendationMeta.textContent =
                "There are no open tasks to recommend.";
            elements.recommendationReason.textContent =
                "Restore a task or create a new one when you are ready.";
        } else {
            elements.recommendationHeading.textContent =
                "Add a task to receive a recommendation";
            elements.recommendationMeta.textContent =
                "Orbit uses priority, deadline, stage and energy.";
            elements.recommendationReason.textContent =
                "Your recommendation updates whenever your tasks change.";
        }
        return;
    }

    const dateDetails = getDateDetails(
        recommendedTask.dueDate,
        recommendedTask.status
    );
    elements.recommendationHeading.textContent = recommendedTask.title;
    elements.recommendationMeta.textContent =
        `${recommendedTask.category} · ${capitalize(recommendedTask.priority)} priority · ` +
        `${recommendedTask.estimatedMinutes} min · ${dateDetails.label}`;
    elements.recommendationReason.textContent =
        createRecommendationExplanation(recommendedTask);
}

function createRecommendationExplanation(task) {
    const reasons = [];

    if (isOverdue(task.dueDate)) reasons.push("overdue");
    else if (isDueToday(task.dueDate)) reasons.push("due today");

    if (task.priority === "high") reasons.push("high priority");
    if (task.energy === currentEnergy) reasons.push("matches your energy");
    if (task.status === "now") reasons.push("already in Now");

    if (reasons.length === 0) {
        reasons.push(`${task.priority} priority`);
    }

    return `Recommended because it is ${joinReasons(reasons)}.`;
}

function joinReasons(reasons) {
    if (reasons.length === 1) return reasons[0];
    if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;
    return `${reasons.slice(0, -1).join(", ")} and ${reasons.at(-1)}`;
}

function getDueDateSortValue(dateString) {
    if (!dateString) return Number.MAX_SAFE_INTEGER;
    return new Date(`${dateString}T00:00:00`).getTime();
}

function isDueToday(dateString) {
    return Boolean(dateString) && dateString === getTodayString();
}

function isOverdue(dateString) {
    return Boolean(dateString) && dateString < getTodayString();
}

// ---------- 6. Creating and editing tasks ----------

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
        setDurationFormValue(taskToEdit.estimatedMinutes);
        document.querySelector(
            `input[name="priority"][value="${taskToEdit.priority}"]`
        ).checked = true;
        elements.modalTitle.textContent = "Edit task";
        elements.submitLabel.textContent = "Save changes";
    } else {
        elements.taskId.value = "";
        elements.taskStatus.value = status;
        elements.taskEnergy.value = "normal";
        elements.taskDuration.value = String(DEFAULT_TASK_MINUTES);
        elements.customDurationField.hidden = true;
        document.querySelector(
            'input[name="priority"][value="medium"]'
        ).checked = true;
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

function setDurationFormValue(minutes) {
    const presetValues = [15, 30, 45, 60];

    if (presetValues.includes(minutes)) {
        elements.taskDuration.value = String(minutes);
        elements.customDurationField.hidden = true;
    } else {
        elements.taskDuration.value = "custom";
        elements.taskCustomDuration.value = minutes;
        elements.customDurationField.hidden = false;
    }
}

function getDurationFromForm() {
    const selectedValue = elements.taskDuration.value;
    return selectedValue === "custom"
        ? Number(elements.taskCustomDuration.value)
        : Number(selectedValue);
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const title = elements.taskTitle.value.trim();
    const estimatedMinutes = getDurationFromForm();

    if (title.length < 2) {
        elements.formMessage.textContent =
            "Please write at least 2 characters for the task.";
        elements.taskTitle.focus();
        return;
    }

    if (!isValidDuration(estimatedMinutes)) {
        elements.formMessage.textContent =
            `Estimated time must be a whole number from ${MIN_FOCUS_MINUTES} to ${MAX_FOCUS_MINUTES}.`;
        elements.taskCustomDuration.focus();
        return;
    }

    const selectedPriority = document.querySelector(
        'input[name="priority"]:checked'
    ).value;
    const status = elements.taskStatus.value;
    const taskData = {
        title,
        notes: elements.taskNotes.value.trim(),
        category: elements.taskCategory.value,
        dueDate: elements.taskDate.value,
        priority: selectedPriority,
        status,
        energy: elements.taskEnergy.value,
        estimatedMinutes,
        completed: status === "done"
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
    closeTaskForm();
    renderApp();
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
        completed: false,
        createdAt: Date.now()
    });

    saveTasks();
    renderApp();
    showToast("Task duplicated");
}

function deleteTask(taskId) {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) return;

    const removedTask = cloneTask(tasks[taskIndex]);
    tasks.splice(taskIndex, 1);

    if (focusSession.taskId === taskId) {
        clearFocusSession();
        closeFocusPanel(false);
    }

    saveTasks();
    renderApp();
    setUndoAction("Task removed", () => {
        tasks.splice(taskIndex, 0, removedTask);
        saveTasks();
        renderApp();
    });
}

function completeTask(taskId) {
    changeTaskStatus(
        taskId,
        "done",
        "Mission completed · Daily momentum updated"
    );
}

function restoreTask(taskId) {
    changeTaskStatus(taskId, "next", "Task restored to Next");
}

function moveTask(taskId, newStatus) {
    const statusLabels = {
        now: "Now",
        next: "Next",
        done: "Done"
    };
    changeTaskStatus(
        taskId,
        newStatus,
        `Task moved to ${statusLabels[newStatus]}`
    );
}

function changeTaskStatus(taskId, newStatus, message) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === newStatus) return;

    const previousTask = cloneTask(task);
    task.status = newStatus;
    task.completed = newStatus === "done";

    saveTasks();
    renderApp();
    setUndoAction(message, () => {
        const taskToRestore = tasks.find((item) => item.id === taskId);
        if (!taskToRestore) return;

        Object.assign(taskToRestore, previousTask);
        saveTasks();
        renderApp();
    });
}

function cloneTask(task) {
    return { ...task };
}

// ---------- 7. Filters, views and task controls ----------

elements.taskForm.addEventListener("submit", handleTaskSubmit);
elements.openTaskModal.addEventListener("click", () => openTaskForm());
elements.emptyAddButton.addEventListener("click", () => openTaskForm());
elements.closeTaskModal.addEventListener("click", closeTaskForm);
elements.cancelTask.addEventListener("click", closeTaskForm);
elements.taskTitle.addEventListener("input", updateTitleCount);

elements.taskDuration.addEventListener("change", () => {
    const usesCustomValue = elements.taskDuration.value === "custom";
    elements.customDurationField.hidden = !usesCustomValue;
    if (usesCustomValue) elements.taskCustomDuration.focus();
});

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
    if (quickCaptureMode) {
        updateQuickCapturePreview();
        return;
    }

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
    setActiveNavigation(
        document.querySelector('[data-smart-filter="all"]')
    );
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

elements.boardView.addEventListener("click", handleTaskAreaClick);
elements.taskList.addEventListener("click", handleTaskAreaClick);

function handleTaskAreaClick(event) {
    const actionButton = event.target.closest("[data-action]");
    const taskContainer = event.target.closest("[data-task-id]");
    if (!taskContainer) return;

    const taskId = taskContainer.dataset.taskId;

    if (!actionButton) {
        editTask(taskId);
        return;
    }

    const action = actionButton.dataset.action;

    if (action === "menu") {
        toggleTaskMenu(actionButton);
    } else if (action === "edit") {
        editTask(taskId);
    } else if (action === "duplicate") {
        duplicateTask(taskId);
    } else if (action === "delete") {
        deleteTask(taskId);
    } else if (action === "complete") {
        completeTask(taskId);
    } else if (action === "restore") {
        restoreTask(taskId);
    } else if (action === "move-now") {
        moveTask(taskId, "now");
    } else if (action === "move-next") {
        moveTask(taskId, "next");
    } else if (action === "focus") {
        startFocusSession(taskId);
    }

    if (action !== "menu") closeAllTaskMenus();
}

function toggleTaskMenu(button) {
    const menu = button.nextElementSibling;
    const shouldOpen = menu.hidden;
    closeAllTaskMenus();
    menu.hidden = !shouldOpen;
    button.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen) {
        const firstEnabledButton = menu.querySelector("button:not([disabled])");
        firstEnabledButton?.focus();
    }
}

document.addEventListener("click", (event) => {
    if (
        !event.target.closest(".task-menu") &&
        !event.target.closest(".task-menu-button")
    ) {
        closeAllTaskMenus();
    }
});

function closeAllTaskMenus() {
    document.querySelectorAll(".task-menu").forEach((menu) => {
        menu.hidden = true;
    });
    document.querySelectorAll(".task-menu-button").forEach((button) => {
        button.setAttribute("aria-expanded", "false");
    });
}

// ---------- 8. Drag and drop ----------

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

    clearDragStyles();
    draggedTaskId = null;
});

document.querySelectorAll(".board-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        document.querySelectorAll(".board-column").forEach((item) => {
            item.classList.toggle("drag-over", item === column);
        });
    });

    column.addEventListener("dragleave", (event) => {
        if (!column.contains(event.relatedTarget)) {
            column.classList.remove("drag-over");
        }
    });

    column.addEventListener("drop", (event) => {
        event.preventDefault();
        const newStatus = column.dataset.status;
        const taskId =
            draggedTaskId || event.dataTransfer.getData("text/plain");
        moveTask(taskId, newStatus);
        clearDragStyles();
    });
});

function clearDragStyles() {
    document.querySelectorAll(".board-column").forEach((column) => {
        column.classList.remove("drag-over");
    });
}

// ---------- 9. Energy selection ----------

document.querySelectorAll("[data-current-energy]").forEach((button) => {
    button.addEventListener("click", () => {
        setCurrentEnergy(button.dataset.currentEnergy);
        saveSettings();
        renderApp();
    });
});

function setCurrentEnergy(energy) {
    currentEnergy = ["low", "normal", "high"].includes(energy)
        ? energy
        : "normal";

    document.querySelectorAll("[data-current-energy]").forEach((button) => {
        const isActive = button.dataset.currentEnergy === currentEnergy;
        button.setAttribute("aria-pressed", String(isActive));
    });
}

// ---------- 10. Quick capture ----------

elements.quickAddToggle.addEventListener("click", () => {
    setQuickCaptureMode(!quickCaptureMode);
});
elements.quickCaptureCancel.addEventListener("click", () => {
    setQuickCaptureMode(false);
});
elements.quickCaptureAdd.addEventListener("click", addQuickCaptureTask);

function setQuickCaptureMode(isActive) {
    quickCaptureMode = isActive;
    quickCaptureTask = null;
    filters.search = "";
    elements.searchInput.value = "";
    elements.quickAddToggle.setAttribute("aria-pressed", String(isActive));
    elements.quickAddToggle.setAttribute(
        "aria-label",
        isActive ? "Return to search" : "Switch to quick capture"
    );
    elements.quickAddToggle.title =
        isActive ? "Return to search" : "Quick capture";
    elements.quickAddToggle.closest(".capture-area")
        .classList.toggle("quick-mode", isActive);
    elements.quickCapturePreview.hidden = !isActive;
    elements.searchInput.placeholder = isActive
        ? "Describe a task with simple keywords..."
        : "Search tasks...";

    if (isActive) {
        updateQuickCapturePreview();
        elements.searchInput.focus();
    } else {
        elements.quickCaptureMessage.textContent = "";
        renderApp();
    }
}

function parseQuickTask(input) {
    const words = input.trim().split(/\s+/).filter(Boolean);
    const titleWords = [];
    const result = {
        title: "",
        notes: "",
        category: "Personal",
        dueDate: "",
        priority: "medium",
        status: "next",
        energy: "normal",
        estimatedMinutes: DEFAULT_TASK_MINUTES,
        completed: false
    };

    words.forEach((originalWord) => {
        const word = originalWord
            .toLowerCase()
            .replace(/^[,.;]+|[,.;]+$/g, "");
        const durationMatch = word.match(/^(\d{1,3})m$/);

        if (word === "today") {
            result.dueDate = getTodayString();
        } else if (word === "tomorrow") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            result.dueDate = toDateInputValue(tomorrow);
        } else if (["high", "medium", "low"].includes(word)) {
            result.priority = word;
        } else if (["personal", "study", "work"].includes(word)) {
            result.category = capitalize(word);
        } else if (
            ["low-energy", "normal-energy", "high-energy"].includes(word)
        ) {
            result.energy = word.replace("-energy", "");
        } else if (
            durationMatch &&
            isValidDuration(Number(durationMatch[1]))
        ) {
            result.estimatedMinutes = Number(durationMatch[1]);
        } else {
            titleWords.push(originalWord);
        }
    });

    result.title = titleWords.join(" ").trim();
    return result;
}

function updateQuickCapturePreview() {
    const input = elements.searchInput.value;
    quickCaptureTask = parseQuickTask(input);
    const isValid = quickCaptureTask.title.length >= 2;

    elements.quickCaptureTitle.textContent =
        quickCaptureTask.title || "Describe a task";
    elements.quickCaptureMeta.textContent =
        `${getDateDetails(quickCaptureTask.dueDate).label} · ` +
        `${capitalize(quickCaptureTask.priority)} priority · ` +
        `${quickCaptureTask.estimatedMinutes} min · ` +
        `${quickCaptureTask.category} · ${capitalize(quickCaptureTask.energy)} energy`;
    elements.quickCaptureMessage.textContent =
        input && !isValid
            ? "Add a task name in addition to the command keywords."
            : "";
    elements.quickCaptureAdd.disabled = !isValid;
}

function addQuickCaptureTask() {
    if (!quickCaptureTask || quickCaptureTask.title.length < 2) return;

    tasks.push({
        id: createId(),
        ...quickCaptureTask,
        createdAt: Date.now()
    });
    saveTasks();
    setQuickCaptureMode(false);
    renderApp();
    showToast("Task added from quick capture");
}

// ---------- 11. Theme and sidebar ----------

document.querySelectorAll("[data-theme-toggle], #theme-toggle").forEach(
    (button) => {
        button.addEventListener("click", () => {
            const isDark =
                document.documentElement.dataset.theme === "dark";
            setTheme(isDark ? "light" : "dark");
            saveSettings();
        });
    }
);

function setTheme(theme) {
    const isDark = theme === "dark";

    if (isDark) {
        document.documentElement.dataset.theme = "dark";
    } else {
        delete document.documentElement.dataset.theme;
    }

    const icon = isDark ? "☀" : "☾";
    const label = isDark ? "Light mode" : "Dark mode";
    const actionLabel = isDark
        ? "Switch to light mode"
        : "Switch to dark mode";

    elements.themeIcon.textContent = icon;
    elements.themeLabel.textContent = label;
    elements.quickThemeIcon.textContent = icon;
    elements.quickThemeToggle.setAttribute("aria-label", actionLabel);
    elements.quickThemeToggle.title = actionLabel;
}

elements.menuButton.addEventListener("click", openSidebar);
elements.sidebarClose.addEventListener("click", closeSidebar);
elements.sidebarBackdrop.addEventListener("click", closeSidebar);
elements.sidebarCollapse.addEventListener("click", () => {
    setSidebarCollapsed(!sidebarCollapsed);
    saveSettings();
});

function openSidebar() {
    elements.sidebar.classList.add("open");
    elements.sidebarBackdrop.classList.add("visible");
    elements.menuButton.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
    elements.sidebar.classList.remove("open");
    elements.sidebarBackdrop.classList.remove("visible");
    elements.menuButton.setAttribute("aria-expanded", "false");
}

function setSidebarCollapsed(isCollapsed) {
    sidebarCollapsed = Boolean(isCollapsed);
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
    elements.sidebarCollapse.setAttribute(
        "aria-pressed",
        String(sidebarCollapsed)
    );
    elements.sidebarCollapse.setAttribute(
        "aria-label",
        sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
    );
    elements.sidebarCollapse.title =
        sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
}

// ---------- 12. Focus Orbit ----------

elements.focusButton.addEventListener("click", openFocusMode);
elements.recommendationAction.addEventListener("click", () => {
    if (recommendedTaskId) startFocusSession(recommendedTaskId);
});
elements.closeFocusPanel.addEventListener("click", () => closeFocusPanel());
elements.focusPanelBackdrop.addEventListener("click", () => closeFocusPanel());
elements.timerToggle.addEventListener("click", toggleFocusTimer);
elements.timerReset.addEventListener("click", resetFocusSession);
elements.completeFocusTask.addEventListener("click", completeFocusedTask);
elements.applyFocusDuration.addEventListener(
    "click",
    applyCustomFocusDuration
);

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

function createEmptyFocusSession(minutes) {
    const durationSeconds = minutes * 60;
    return {
        taskId: null,
        durationSeconds,
        remainingSeconds: durationSeconds,
        endTime: null,
        started: false,
        completionRecorded: false,
        panelOpen: false
    };
}

function startFocusSession(taskId) {
    const task = tasks.find(
        (item) => item.id === taskId && item.status !== "done"
    );
    if (!task) {
        showToast("Choose an incomplete task to focus on");
        return;
    }

    if (focusSession.taskId !== taskId) {
        stopFocusTicker();
        focusSession = createEmptyFocusSession(task.estimatedMinutes);
        focusSession.taskId = taskId;
    }

    focusSession.panelOpen = true;
    saveFocusSession();
    showFocusPanel();
    renderFocusPanel();
}

function openFocusMode() {
    const savedTask = tasks.find(
        (task) =>
            task.id === focusSession.taskId &&
            task.status !== "done"
    );
    const taskToFocus = savedTask ||
        getRecommendedTask() ||
        tasks.find((task) => task.status === "now");

    if (!taskToFocus) {
        showToast("Create an open task before starting focus");
        return;
    }

    startFocusSession(taskToFocus.id);
}

function showFocusPanel() {
    const isMobilePanel =
        window.matchMedia("(max-width: 600px)").matches;

    elements.focusPanel.hidden = false;
    elements.focusPanelBackdrop.hidden = false;
    elements.workspaceLayout.classList.add("focus-active");
    document.body.classList.add("focus-panel-open");

    if (isMobilePanel) {
        elements.focusPanel.setAttribute("role", "dialog");
        elements.focusPanel.setAttribute("aria-modal", "true");
        document.body.style.overflow = "hidden";
    } else {
        elements.focusPanel.removeAttribute("role");
        elements.focusPanel.removeAttribute("aria-modal");
    }

    window.setTimeout(() => elements.closeFocusPanel.focus(), 20);
}

function closeFocusPanel(shouldPause = true) {
    if (shouldPause && focusSession.endTime) {
        pauseFocusSession();
    }

    focusSession.panelOpen = false;
    elements.focusPanel.hidden = true;
    elements.focusPanelBackdrop.hidden = true;
    elements.workspaceLayout.classList.remove("focus-active");
    document.body.classList.remove("focus-panel-open");
    elements.focusPanel.removeAttribute("role");
    elements.focusPanel.removeAttribute("aria-modal");

    if (!activeModal) document.body.style.overflow = "";
    saveFocusSession();
    updateHeaderFocusDisplay();
}

function applyCustomFocusDuration() {
    const requestedMinutes = Number(elements.customFocusMinutes.value);

    if (!isValidDuration(requestedMinutes)) {
        elements.focusDurationHint.textContent =
            `Enter a whole number from ${MIN_FOCUS_MINUTES} to ${MAX_FOCUS_MINUTES}.`;
        elements.focusDurationHint.classList.add("error");
        elements.customFocusMinutes.focus();
        return;
    }

    setFocusDuration(requestedMinutes);
}

function setFocusDuration(minutes, shouldSave = true) {
    const safeMinutes = Math.min(
        MAX_FOCUS_MINUTES,
        Math.max(MIN_FOCUS_MINUTES, Math.round(Number(minutes)))
    );

    stopFocusTicker();
    focusSession.durationSeconds = safeMinutes * 60;
    focusSession.remainingSeconds = focusSession.durationSeconds;
    focusSession.endTime = null;
    focusSession.started = false;
    focusSession.completionRecorded = false;
    elements.customFocusMinutes.value = safeMinutes;
    elements.focusDurationHint.textContent =
        `Timer set to ${safeMinutes} minute${safeMinutes === 1 ? "" : "s"}.`;
    elements.focusDurationHint.classList.remove("error");

    document.querySelectorAll("[data-focus-minutes]").forEach((button) => {
        const isActive = Number(button.dataset.focusMinutes) === safeMinutes;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    if (shouldSave) saveFocusSession();
    updateFocusDisplays();
}

function toggleFocusTimer() {
    if (!focusSession.taskId) return;

    if (focusSession.endTime) {
        pauseFocusSession();
        return;
    }

    if (focusSession.remainingSeconds <= 0) {
        focusSession.remainingSeconds = focusSession.durationSeconds;
        focusSession.completionRecorded = false;
    }

    focusSession.started = true;
    focusSession.endTime =
        Date.now() + focusSession.remainingSeconds * 1000;
    saveFocusSession();
    startFocusTicker();
    updateFocusDisplays();
}

function startFocusTicker() {
    stopFocusTicker();
    focusIntervalId = window.setInterval(syncFocusTimer, 1000);
}

function stopFocusTicker() {
    if (focusIntervalId !== null) {
        window.clearInterval(focusIntervalId);
        focusIntervalId = null;
    }
}

function syncFocusTimer() {
    if (!focusSession.endTime) {
        updateFocusDisplays();
        return;
    }

    focusSession.remainingSeconds = Math.max(
        0,
        Math.ceil((focusSession.endTime - Date.now()) / 1000)
    );

    if (focusSession.remainingSeconds <= 0) {
        focusSession.endTime = null;
        stopFocusTicker();

        if (!focusSession.completionRecorded) {
            recordFocusedSeconds(focusSession.durationSeconds);
            focusSession.completionRecorded = true;
        }

        saveFocusSession();
        renderApp();
        showToast("Focus session finished · Mark the task complete when ready");
        return;
    }

    updateFocusDisplays();
}

function pauseFocusSession() {
    if (focusSession.endTime) {
        focusSession.remainingSeconds = Math.max(
            0,
            Math.ceil((focusSession.endTime - Date.now()) / 1000)
        );
    }

    focusSession.endTime = null;
    stopFocusTicker();
    saveFocusSession();
    updateFocusDisplays();
}

function resetFocusSession() {
    stopFocusTicker();
    focusSession.endTime = null;
    focusSession.remainingSeconds = focusSession.durationSeconds;
    focusSession.started = false;
    focusSession.completionRecorded = false;
    saveFocusSession();
    updateFocusDisplays();
}

function completeFocusedTask() {
    const focusedTask = tasks.find(
        (task) => task.id === focusSession.taskId
    );
    if (!focusedTask || focusedTask.status === "done") return;

    const elapsedSeconds = Math.max(
        0,
        focusSession.durationSeconds - getCurrentRemainingSeconds()
    );

    if (elapsedSeconds > 0 && !focusSession.completionRecorded) {
        recordFocusedSeconds(elapsedSeconds);
        focusSession.completionRecorded = true;
    }

    const taskId = focusedTask.id;
    clearFocusSession();
    closeFocusPanel(false);
    completeTask(taskId);
}

function clearFocusSession() {
    stopFocusTicker();
    const defaultMinutes = Math.round(
        focusSession.durationSeconds / 60
    ) || DEFAULT_FOCUS_MINUTES;
    focusSession = createEmptyFocusSession(defaultMinutes);
    saveFocusSession();
    updateHeaderFocusDisplay();
}

function getCurrentRemainingSeconds() {
    if (!focusSession.endTime) return focusSession.remainingSeconds;
    return Math.max(
        0,
        Math.ceil((focusSession.endTime - Date.now()) / 1000)
    );
}

function renderFocusPanel() {
    const focusedTask = tasks.find(
        (task) => task.id === focusSession.taskId
    );

    if (!focusedTask) {
        if (focusSession.panelOpen) closeFocusPanel(false);
        updateHeaderFocusDisplay();
        return;
    }

    if (focusSession.panelOpen) {
        elements.focusPanel.hidden = false;
        elements.focusPanelBackdrop.hidden = false;
        elements.workspaceLayout.classList.add("focus-active");
    }

    elements.focusTitle.textContent = focusedTask.title;
    elements.focusTaskName.textContent =
        focusedTask.notes || "A focused session for this task.";
    elements.focusTaskMeta.innerHTML = `
        <span>${escapeHTML(focusedTask.category)}</span>
        <span>${capitalize(focusedTask.priority)} priority</span>
        <span>${capitalize(focusedTask.energy)} energy</span>
        <span>${focusedTask.estimatedMinutes} min estimate</span>
    `;
    elements.completeFocusTask.disabled = focusedTask.status === "done";
    updateFocusDisplays();
}

function updateFocusDisplays() {
    const remainingSeconds = getCurrentRemainingSeconds();
    focusSession.remainingSeconds = remainingSeconds;
    const elapsedSeconds = Math.max(
        0,
        focusSession.durationSeconds - remainingSeconds
    );
    const progress = focusSession.durationSeconds === 0
        ? 0
        : elapsedSeconds / focusSession.durationSeconds;
    const dashOffset =
        FOCUS_RING_CIRCUMFERENCE * (1 - Math.min(1, progress));

    elements.focusTimer.textContent = formatTimerTime(remainingSeconds);
    elements.focusRingProgress.style.strokeDasharray =
        String(FOCUS_RING_CIRCUMFERENCE);
    elements.focusRingProgress.style.strokeDashoffset =
        String(dashOffset);

    if (focusSession.endTime) {
        elements.timerToggle.textContent = "Pause";
        elements.focusStatus.textContent = "Session in progress.";
    } else if (remainingSeconds <= 0) {
        elements.timerToggle.textContent = "Restart";
        elements.focusStatus.textContent =
            "Time is up. Complete the task when it is actually finished.";
    } else if (!focusSession.started) {
        elements.timerToggle.textContent = "Start";
        elements.focusStatus.textContent = "Ready when you are.";
    } else {
        elements.timerToggle.textContent = "Resume";
        elements.focusStatus.textContent = "Session paused.";
    }

    updateHeaderFocusDisplay();
}

function updateHeaderFocusDisplay() {
    const remainingSeconds = getCurrentRemainingSeconds();
    const elapsedSeconds = Math.max(
        0,
        focusSession.durationSeconds - remainingSeconds
    );
    const isRunning = Boolean(focusSession.endTime);
    const isComplete =
        focusSession.started && remainingSeconds <= 0;
    const hasSession = Boolean(focusSession.taskId && focusSession.started);

    elements.focusLabel.hidden = hasSession;
    elements.focusLive.hidden = !hasSession;
    elements.focusButton.classList.toggle("timer-active", hasSession);
    elements.focusButton.classList.toggle("timer-running", isRunning);
    elements.focusButton.classList.toggle("timer-complete", isComplete);
    elements.headerTimeLeft.textContent =
        formatTimerTime(remainingSeconds);
    elements.headerTimeElapsed.textContent =
        formatTimerTime(elapsedSeconds);

    if (!hasSession) {
        elements.focusButton.setAttribute(
            "aria-label",
            "Open Focus Orbit for the recommended task"
        );
        elements.focusButton.title = "Open Focus Orbit";
        return;
    }

    let stateText = "paused";
    if (isRunning) stateText = "running";
    if (isComplete) stateText = "complete";

    const accessibleStatus =
        `${formatTimerTime(remainingSeconds)} remaining, ` +
        `${formatTimerTime(elapsedSeconds)} elapsed, timer ${stateText}. ` +
        "Open Focus Orbit.";
    elements.focusButton.setAttribute("aria-label", accessibleStatus);
    elements.focusButton.title = accessibleStatus;
}

function formatTimerTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function saveFocusSession() {
    try {
        localStorage.setItem(
            FOCUS_STORAGE_KEY,
            JSON.stringify(focusSession)
        );
    } catch (error) {
        console.warn("Orbit could not save the focus session:", error);
    }
}

function restoreFocusSession() {
    try {
        const savedValue = localStorage.getItem(FOCUS_STORAGE_KEY);
        if (!savedValue) return;

        const saved = JSON.parse(savedValue);
        const taskExists = tasks.some(
            (task) => task.id === saved.taskId && task.status !== "done"
        );
        const durationSeconds = Number(saved.durationSeconds);
        const remainingSeconds = Number(saved.remainingSeconds);

        if (!taskExists || !Number.isFinite(durationSeconds)) return;

        focusSession = {
            taskId: saved.taskId,
            durationSeconds: Math.max(60, durationSeconds),
            remainingSeconds: Number.isFinite(remainingSeconds)
                ? Math.max(0, remainingSeconds)
                : durationSeconds,
            endTime: Number.isFinite(Number(saved.endTime))
                ? Number(saved.endTime)
                : null,
            started: Boolean(saved.started),
            completionRecorded: Boolean(saved.completionRecorded),
            panelOpen: Boolean(saved.panelOpen)
        };

        elements.customFocusMinutes.value = Math.round(
            focusSession.durationSeconds / 60
        );

        if (focusSession.endTime) {
            syncFocusTimer();
            if (focusSession.endTime) startFocusTicker();
        }

        if (focusSession.panelOpen) showFocusPanel();
    } catch (error) {
        console.warn("Orbit could not restore the focus session:", error);
    }
}

function getFocusedSecondsToday() {
    const today = getTodayString();

    try {
        const savedValue = JSON.parse(
            localStorage.getItem(DAILY_FOCUS_KEY)
        );

        if (savedValue?.date === today) {
            return Math.max(0, Number(savedValue.seconds) || 0);
        }
    } catch (error) {
        console.warn("Orbit could not read daily focus time:", error);
    }

    return 0;
}

function recordFocusedSeconds(seconds) {
    const safeSeconds = Math.max(0, Math.round(seconds));
    const updatedSeconds = getFocusedSecondsToday() + safeSeconds;

    try {
        localStorage.setItem(
            DAILY_FOCUS_KEY,
            JSON.stringify({
                date: getTodayString(),
                seconds: updatedSeconds
            })
        );
    } catch (error) {
        console.warn("Orbit could not save daily focus time:", error);
    }
}

// ---------- 13. Modals, keyboard shortcuts and undo toast ----------

elements.helpButton.addEventListener("click", () => {
    showModal(elements.helpModal);
    window.setTimeout(() => elements.closeHelpModal.focus(), 20);
});
elements.closeHelpModal.addEventListener(
    "click",
    () => hideModal(elements.helpModal)
);

document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
        if (event.target !== backdrop) return;

        if (backdrop === elements.taskModal) closeTaskForm();
        else hideModal(backdrop);
    });
});

function showModal(modal) {
    previouslyFocusedElement = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
}

function hideModal(modal) {
    if (modal.hidden) return;

    modal.hidden = true;
    if (activeModal === modal) activeModal = null;

    const anyModalOpen = [...document.querySelectorAll(".modal-backdrop")]
        .some((item) => !item.hidden);
    const mobileFocusOpen =
        focusSession.panelOpen &&
        window.matchMedia("(max-width: 600px)").matches;

    if (!anyModalOpen && !mobileFocusOpen) {
        document.body.style.overflow = "";
    }

    if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && activeModal) {
        trapFocus(event, activeModal);
        return;
    }

    if (
        event.key === "Tab" &&
        focusSession.panelOpen &&
        window.matchMedia("(max-width: 600px)").matches
    ) {
        trapFocus(event, elements.focusPanel);
        return;
    }

    const activeElement = document.activeElement;
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
        activeElement.tagName
    );

    if (event.key === "Escape") {
        closeTaskForm();
        hideModal(elements.helpModal);
        closeFocusPanel();
        closeSidebar();
        closeAllTaskMenus();
        if (quickCaptureMode) setQuickCaptureMode(false);
        return;
    }

    if (isTyping) return;

    if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openTaskForm();
    }

    if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        setQuickCaptureMode(true);
    }

    if (event.key === "/") {
        event.preventDefault();
        if (quickCaptureMode) setQuickCaptureMode(false);
        elements.searchInput.focus();
    }
});

function trapFocus(event, container) {
    const focusableElements = [...container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), ' +
        'select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    )].filter((item) => !item.hidden && item.offsetParent !== null);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

elements.toastAction.addEventListener("click", undoLastAction);
elements.toast.addEventListener("mouseenter", pauseToastDismissal);
elements.toast.addEventListener("mouseleave", resumeToastDismissal);
elements.toast.addEventListener("focusin", pauseToastDismissal);
elements.toast.addEventListener("focusout", resumeToastDismissal);

function setUndoAction(message, action) {
    undoAction = action;
    showToast(message, true);
}

function undoLastAction() {
    if (!undoAction) return;

    const action = undoAction;
    undoAction = null;
    action();
    hideToast();
    showToast("Previous action undone");
}

function showToast(message, showUndo = false) {
    window.clearTimeout(toastTimeout);
    elements.toastMessage.textContent = message;
    elements.toastAction.hidden = !showUndo;
    elements.toastIcon.textContent = showUndo ? "↶" : "✓";
    elements.toast.classList.add("visible");

    if (!showUndo) undoAction = null;
    scheduleToastDismissal(showUndo ? 7000 : 3500);
}

function scheduleToastDismissal(delay) {
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(hideToast, delay);
}

function pauseToastDismissal() {
    window.clearTimeout(toastTimeout);
}

function resumeToastDismissal() {
    if (elements.toast.classList.contains("visible")) {
        scheduleToastDismissal(elements.toastAction.hidden ? 2500 : 5000);
    }
}

function hideToast() {
    elements.toast.classList.remove("visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = null;
}

// ---------- 14. Dates, settings and utilities ----------

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getTodayString() {
    return toDateInputValue(new Date());
}

function getGreetingForHour(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function updateDateAndGreeting() {
    const now = new Date();
    const currentDate = toDateInputValue(now);

    setText("greeting", getGreetingForHour(now.getHours()));
    setText(
        "date-month",
        now.toLocaleDateString(undefined, { month: "short" }).toUpperCase()
    );
    setText("date-day", now.getDate());
    setText(
        "full-date",
        now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric"
        })
    );

    if (lastKnownDate && lastKnownDate !== currentDate) {
        renderApp();
    }

    lastKnownDate = currentDate;
}

function startAutomaticDateUpdates() {
    window.setInterval(updateDateAndGreeting, DATE_REFRESH_INTERVAL);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            updateDateAndGreeting();
            syncFocusTimer();
        }
    });

    window.addEventListener("focus", () => {
        updateDateAndGreeting();
        syncFocusTimer();
    });
}

function saveSettings() {
    const settings = {
        theme: document.documentElement.dataset.theme || "light",
        view: currentView,
        currentEnergy,
        sidebarCollapsed
    };

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn("Orbit could not save settings:", error);
    }
}

function loadSettings() {
    try {
        const savedSettings = JSON.parse(
            localStorage.getItem(SETTINGS_KEY)
        );

        if (savedSettings && typeof savedSettings === "object") {
            setTheme(savedSettings.theme);
            currentView =
                savedSettings.view === "list" ? "list" : "board";
            setCurrentEnergy(savedSettings.currentEnergy || "normal");
            setSidebarCollapsed(Boolean(savedSettings.sidebarCollapsed));
            elements.boardViewButton.classList.toggle(
                "active",
                currentView === "board"
            );
            elements.listViewButton.classList.toggle(
                "active",
                currentView === "list"
            );
            return;
        }
    } catch (error) {
        console.warn("Orbit could not read saved settings:", error);
    }

    const prefersDark =
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
    setCurrentEnergy("normal");
    setSidebarCollapsed(false);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function capitalize(word) {
    const safeWord = String(word || "");
    return safeWord.charAt(0).toUpperCase() + safeWord.slice(1);
}

function escapeHTML(value) {
    const temporaryElement = document.createElement("div");
    temporaryElement.textContent = value || "";
    return temporaryElement.innerHTML;
}

// ---------- 15. Start Orbit ----------

loadSettings();
restoreFocusSession();
updateDateAndGreeting();
renderApp();
startAutomaticDateUpdates();
