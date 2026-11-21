const defaultExercises = [
    "Bankdrücken",
    "Kniebeugen",
    "Kreuzheben",
    "Schrägbankdrücken",
    "Rudern",
    "Latziehen",
    "Beinpresse",
    "Seitheben",
    "Bizepscurls",
    "Trizepsdrücken"
];

let exercises = loadExercises();
let trainingEntries = loadTrainingEntries();
let nextExerciseEntryId = 0;
let editingDate = null;

// Loads saved training entries and removes the old generated sample data.
function loadTrainingEntries() {
    const savedEntries = localStorage.getItem("trainingEntries");
    if (!savedEntries) {
        return [];
    }

    const trainingEntries = JSON.parse(savedEntries);
    if (isGeneratedExampleData(trainingEntries)) {
        localStorage.removeItem("trainingEntries");
        return [];
    }
    return trainingEntries;
}

// Recognizes the old sample data without removing ordinary user entries.
function isGeneratedExampleData(entries) {
    const sampleExercises = [
        "Bankdrücken", "Kniebeugen", "Kreuzheben",
        "Rudern", "Latziehen", "Seitheben"
    ];
    if (entries.length !== 20 && entries.length !== 120) {
        return false;
    }

    const entriesPerDay = entries.length / 20;
    const dayCounts = {};
    for (let index = 0; index < entries.length; index++) {
        const entry = entries[index];
        if (!sampleExercises.includes(entry.exercise) || entry.sets.length !== 3) {
            return false;
        }
        for (let setIndex = 0; setIndex < entry.sets.length; setIndex++) {
            const repetitions = entry.sets[setIndex].repetitions;
            if (repetitions < 8 || repetitions > 12) {
                return false;
            }
        }
        dayCounts[entry.date] = (dayCounts[entry.date] || 0) + 1;
    }

    const dates = Object.keys(dayCounts).sort();
    if (dates.length !== 20) {
        return false;
    }
    for (let index = 0; index < dates.length; index++) {
        if (dayCounts[dates[index]] !== entriesPerDay) {
            return false;
        }
        if (index > 0) {
            const previousDate = new Date(dates[index - 1] + "T00:00:00Z");
            const currentDate = new Date(dates[index] + "T00:00:00Z");
            if (currentDate - previousDate !== 86400000) {
                return false;
            }
        }
    }
    return true;
}

// Finds saved exercises or uses the list of standard exercises.
function loadExercises() {
    const savedExercises = localStorage.getItem("exerciseList");
    if (savedExercises) {
        return JSON.parse(savedExercises);
    }
    return defaultExercises.slice();
}

// Refreshes the exercise menus in every exercise block.
function updateExerciseSelect() {
    const exerciseSelects = document.querySelectorAll(".exercise-select");
    for (let selectIndex = 0; selectIndex < exerciseSelects.length; selectIndex++) {
        const exerciseSelect = exerciseSelects[selectIndex];
        const previousValue = exerciseSelect.value;
        exerciseSelect.innerHTML = "";

        for (let index = 0; index < exercises.length; index++) {
            const option = document.createElement("option");
            option.textContent = exercises[index];
            option.value = exercises[index];
            exerciseSelect.appendChild(option);
        }
        if (exercises.includes(previousValue)) {
            exerciseSelect.value = previousValue;
        }
    }
}

// Adds another exercise form to the selected training unit.
function addExerciseEntry() {
    const exerciseEntries = document.getElementById("exerciseEntries");
    const exerciseEntry = makeExerciseEntry(nextExerciseEntryId);
    nextExerciseEntryId++;
    exerciseEntries.appendChild(exerciseEntry);
    updateExerciseSelect();
    updateExerciseEntryNumbers();
    createSetFields(exerciseEntry);
    return exerciseEntry;
}

// Creates one exercise form with a set count and remove button.
function makeExerciseEntry(entryId) {
    const exerciseEntry = document.createElement("div");
    exerciseEntry.className = "exercise-entry";
    exerciseEntry.dataset.entryId = entryId;
    exerciseEntry.appendChild(makeExerciseEntryHeading());
    exerciseEntry.appendChild(makeExerciseSelect(entryId));
    exerciseEntry.appendChild(makeSetCountControls(entryId));
    return exerciseEntry;
}

// Creates the title and remove button for an exercise block.
function makeExerciseEntryHeading() {
    const headingRow = document.createElement("div");
    const heading = document.createElement("h3");
    const removeButton = document.createElement("button");

    headingRow.className = "exercise-entry-heading";
    heading.textContent = "Übung";
    removeButton.className = "secondary-button remove-exercise-button";
    removeButton.type = "button";
    removeButton.textContent = "Entfernen";
    headingRow.appendChild(heading);
    headingRow.appendChild(removeButton);
    return headingRow;
}

// Creates the exercise selector for one block.
function makeExerciseSelect(entryId) {
    const controls = document.createElement("div");
    const exerciseLabel = document.createElement("label");
    const exerciseSelect = document.createElement("select");

    exerciseSelect.className = "exercise-select";
    exerciseSelect.id = "exercise-select-" + entryId;
    exerciseSelect.required = true;
    exerciseLabel.htmlFor = exerciseSelect.id;
    exerciseLabel.textContent = "Übung";
    controls.appendChild(exerciseLabel);
    controls.appendChild(exerciseSelect);
    return controls;
}

// Creates the set count and set generation controls.
function makeSetCountControls(entryId) {
    const controls = document.createElement("div");
    const setCountLabel = document.createElement("label");
    const setCount = document.createElement("input");
    const createSetsButton = document.createElement("button");
    const setFields = document.createElement("div");

    setCount.id = "set-count-" + entryId;
    setCount.className = "exercise-set-count";
    setCount.type = "number";
    setCount.min = "1";
    setCount.max = "20";
    setCount.value = "3";
    setCount.required = true;
    setCountLabel.htmlFor = setCount.id;
    setCountLabel.textContent = "Anzahl der Sätze";
    createSetsButton.className = "secondary-button create-sets-button";
    createSetsButton.type = "button";
    createSetsButton.textContent = "Sätze erstellen";
    setFields.className = "exercise-set-fields";
    controls.appendChild(setCountLabel);
    controls.appendChild(setCount);
    controls.appendChild(createSetsButton);
    controls.appendChild(setFields);
    return controls;
}

// Numbers the exercise blocks and hides removal for the first one.
function updateExerciseEntryNumbers() {
    const exerciseEntries = document.querySelectorAll(".exercise-entry");
    for (let index = 0; index < exerciseEntries.length; index++) {
        const heading = exerciseEntries[index].querySelector("h3");
        const removeButton = exerciseEntries[index].querySelector(".remove-exercise-button");
        heading.textContent = "Übung " + (index + 1);
        removeButton.hidden = index === 0;
    }
}

// Creates input fields for each set in one exercise block.
function createSetFields(exerciseEntry) {
    const setCount = Number(exerciseEntry.querySelector(".exercise-set-count").value);
    const setFields = exerciseEntry.querySelector(".exercise-set-fields");
    setFields.innerHTML = "";

    if (setCount < 1) {
        return;
    }

    for (let setNumber = 1; setNumber <= setCount; setNumber++) {
        const setRow = document.createElement("div");
        setRow.className = "set-row";
        setRow.innerHTML =
            '<span>Satz ' + setNumber + '</span>' +
            '<div><label>Gewicht (kg)</label><input class="set-weight" type="number" min="0" step="0.5" required></div>' +
            '<div><label>Wiederholungen</label><input class="set-reps" type="number" min="1" required></div>';
        setFields.appendChild(setRow);
    }
}

// Checks whether another exercise already uses this name.
function exerciseNameExists(name, ignoredIndex) {
    for (let index = 0; index < exercises.length; index++) {
        if (index !== ignoredIndex && exercises[index].toLowerCase() === name.toLowerCase()) {
            return true;
        }
    }
    return false;
}

// Adds a new exercise to the saved list.
function addExercise(event) {
    event.preventDefault();
    const nameInput = document.getElementById("newExerciseName");
    const exerciseName = nameInput.value.trim();
    const message = document.getElementById("exerciseMessage");

    if (exerciseName === "") {
        message.textContent = "Bitte einen Namen eingeben.";
        return;
    }
    if (exerciseNameExists(exerciseName, -1)) {
        message.textContent = "Diese Übung ist schon vorhanden.";
        return;
    }

    exercises.push(exerciseName);
    localStorage.setItem("exerciseList", JSON.stringify(exercises));
    updateExerciseSelect();
    showExerciseList();
    nameInput.value = "";
    message.textContent = "Übung wurde hinzugefügt.";
    showStatistics();
}

// Shows every saved exercise with an input to change its name.
function showExerciseList() {
    const exerciseTable = document.getElementById("exerciseTable");
    exerciseTable.innerHTML = "";

    for (let index = 0; index < exercises.length; index++) {
        exerciseTable.appendChild(makeExerciseRow(index));
    }
}

// Creates one row with an editable exercise name.
function makeExerciseRow(index) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const nameInput = document.createElement("input");
    const saveButton = document.createElement("button");

    nameInput.className = "exercise-name-input";
    nameInput.value = exercises[index];
    nameInput.readOnly = true;
    nameInput.setAttribute("aria-label", "Übungsname ändern");
    saveButton.className = "secondary-button exercise-table-button exercise-edit-button";
    saveButton.textContent = "Bearbeiten";
    saveButton.dataset.index = index;
    actionCell.appendChild(saveButton);
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);
    row.appendChild(actionCell);
    return row;
}

// Updates historical training entries after an exercise is renamed.
function updateTrainingExerciseNames(oldName, newName) {
    for (let index = 0; index < trainingEntries.length; index++) {
        if (trainingEntries[index].exercise === oldName) {
            trainingEntries[index].exercise = newName;
        }
    }
    localStorage.setItem("trainingEntries", JSON.stringify(trainingEntries));
}

// Enables a name field or saves it after the user presses the button again.
function renameExercise(event) {
    if (!event.target.classList.contains("exercise-edit-button")) {
        return;
    }

    const exerciseIndex = Number(event.target.dataset.index);
    const input = event.target.parentElement.previousElementSibling.querySelector("input");
    if (input.readOnly) {
        input.readOnly = false;
        event.target.textContent = "Speichern";
        input.focus();
        return;
    }

    saveExerciseName(exerciseIndex, input.value.trim());
}

// Checks and saves a changed name together with its training history.
function saveExerciseName(exerciseIndex, newName) {
    const message = document.getElementById("exerciseMessage");

    if (newName === "") {
        message.textContent = "Bitte einen Namen eingeben.";
        return;
    }
    if (exerciseNameExists(newName, exerciseIndex)) {
        message.textContent = "Diese Übung ist schon vorhanden.";
        return;
    }

    const oldName = exercises[exerciseIndex];
    exercises[exerciseIndex] = newName;
    localStorage.setItem("exerciseList", JSON.stringify(exercises));
    updateTrainingExerciseNames(oldName, newName);
    updateExerciseSelect();
    showExerciseList();
    showTrainingSessions();
    showStatistics();
    message.textContent = "Übungsname wurde geändert.";
}

// Saves a new or edited training session.
function saveTraining(event) {
    event.preventDefault();

    const date = document.getElementById("trainingDate").value;
    const trainingName = document.getElementById("trainingName").value.trim();
    const exerciseBlocks = document.querySelectorAll(".exercise-entry");
    const newEntries = [];
    const message = document.getElementById("trainingMessage");
    message.textContent = "";

    if (trainingName === "") {
        message.textContent = "Bitte einen Trainingsnamen eingeben.";
        return;
    }
    if (hasOtherSessionOnDate(date)) {
        message.textContent = "Für dieses Datum gibt es schon ein Training. Bitte bearbeite dieses Training.";
        return;
    }
    for (let index = 0; index < exerciseBlocks.length; index++) {
        const newEntry = makeTrainingEntry(exerciseBlocks[index], date, trainingName, index);
        if (newEntry === null) {
            alert("Bitte für jeden Satz Gewicht und Wiederholungen eingeben.");
            return;
        }
        newEntries.push(newEntry);
    }

    if (editingDate !== null) {
        trainingEntries = trainingEntries.filter(function (entry) {
            return entry.date !== editingDate;
        });
    }
    for (let index = 0; index < newEntries.length; index++) {
        trainingEntries.push(newEntries[index]);
    }

    localStorage.setItem("trainingEntries", JSON.stringify(trainingEntries));
    editingDate = null;
    closeTrainingForm();
    showTrainingSessions();
    showStatistics();
}

// Builds a saved exercise entry from one form block.
function makeTrainingEntry(exerciseEntry, date, trainingName, index) {
    const sets = collectExerciseSets(exerciseEntry);
    if (sets === null) {
        return null;
    }
    return {
        id: Date.now() + index,
        date: date,
        trainingName: trainingName,
        exercise: exerciseEntry.querySelector(".exercise-select").value,
        sets: sets
    };
}

// Reads the weights and repetitions from one exercise block.
function collectExerciseSets(exerciseEntry) {
    const weightInputs = exerciseEntry.querySelectorAll(".set-weight");
    const repetitionInputs = exerciseEntry.querySelectorAll(".set-reps");
    const sets = [];

    for (let index = 0; index < weightInputs.length; index++) {
        if (weightInputs[index].value === "" || repetitionInputs[index].value === "") {
            return null;
        }
        sets.push({
            weight: Number(weightInputs[index].value),
            repetitions: Number(repetitionInputs[index].value)
        });
    }
    return sets;
}

// Handles add/remove and set-building buttons inside exercise blocks.
function handleExerciseEntryClick(event) {
    const exerciseEntry = event.target.closest(".exercise-entry");
    if (event.target.classList.contains("create-sets-button")) {
        createSetFields(exerciseEntry);
        return;
    }
    if (event.target.classList.contains("remove-exercise-button")) {
        exerciseEntry.remove();
        updateExerciseEntryNumbers();
    }
}

// Prevents accidentally creating two sessions for the same date.
function hasOtherSessionOnDate(date) {
    for (let index = 0; index < trainingEntries.length; index++) {
        if (trainingEntries[index].date === date && trainingEntries[index].date !== editingDate) {
            return true;
        }
    }
    return false;
}

// Opens a clean form for a new training session.
function openNewTrainingForm() {
    const today = new Date().toISOString().split("T")[0];
    editingDate = null;
    document.getElementById("trainingForm").reset();
    document.getElementById("trainingFormHeading").textContent = "Neues Training";
    document.getElementById("saveTrainingButton").textContent = "Training speichern";
    document.getElementById("trainingDate").value = today;
    document.getElementById("trainingMessage").textContent = "";
    document.getElementById("exerciseEntries").innerHTML = "";
    nextExerciseEntryId = 0;
    addExerciseEntry();
    document.getElementById("trainingOverview").hidden = true;
    document.getElementById("trainingFormPanel").hidden = false;
}

// Opens a clean form for a new training session.
function openNewTrainingForm() {
    const today = new Date().toISOString().split("T")[0];
    editingDate = null;
    document.getElementById("trainingForm").reset();
    document.getElementById("trainingFormHeading").textContent = "Neues Training";
    document.getElementById("saveTrainingButton").textContent = "Training speichern";
    document.getElementById("trainingDate").value = today;
    document.getElementById("trainingMessage").textContent = "";
    document.getElementById("exerciseEntries").innerHTML = "";
    nextExerciseEntryId = 0;
    addExerciseEntry();
    document.getElementById("trainingOverview").hidden = true;
    document.getElementById("trainingFormPanel").hidden = false;
}

// Hides the form and returns to the training overview.
function closeTrainingForm() {
    document.getElementById("trainingFormPanel").hidden = true;
    document.getElementById("trainingOverview").hidden = false;
}

// Cancels editing without changing saved data.
function cancelTrainingForm() {
    editingDate = null;
    closeTrainingForm();
}

// Opens a saved session for editing after its button is pressed.
function openEditTraining(event) {
    if (!event.target.classList.contains("edit-session-button")) {
        return;
    }

    const date = event.target.dataset.date;
    const sessionEntries = trainingEntries.filter(function (entry) {
        return entry.date === date;
    });
    if (sessionEntries.length === 0) {
        return;
    }
    fillTrainingForm(sessionEntries);
}

// Loads a saved session into the editable form.
function fillTrainingForm(sessionEntries) {
    editingDate = sessionEntries[0].date;
    document.getElementById("trainingOverview").hidden = true;
    document.getElementById("trainingFormPanel").hidden = false;
    document.getElementById("trainingFormHeading").textContent = "Training bearbeiten";
    document.getElementById("saveTrainingButton").textContent = "Änderungen speichern";
    document.getElementById("trainingDate").value = editingDate;
    document.getElementById("trainingName").value =
        sessionEntries[0].trainingName || "Trainingseinheit";
    document.getElementById("trainingMessage").textContent = "";
    document.getElementById("exerciseEntries").innerHTML = "";
    nextExerciseEntryId = 0;

    for (let index = 0; index < sessionEntries.length; index++) {
        const exerciseEntry = addExerciseEntry();
        fillExerciseEntry(exerciseEntry, sessionEntries[index]);
    }
    updateExerciseEntryNumbers();
}

// Restores exercise and set values in one form block.
function fillExerciseEntry(exerciseEntry, savedEntry) {
    exerciseEntry.querySelector(".exercise-select").value = savedEntry.exercise;
    exerciseEntry.querySelector(".exercise-set-count").value = savedEntry.sets.length;
    createSetFields(exerciseEntry);
    const weightInputs = exerciseEntry.querySelectorAll(".set-weight");
    const repetitionInputs = exerciseEntry.querySelectorAll(".set-reps");

    for (let index = 0; index < savedEntry.sets.length; index++) {
        weightInputs[index].value = savedEntry.sets[index].weight;
        repetitionInputs[index].value = savedEntry.sets[index].repetitions;
    }
}

// Returns sessions ordered by most recently added.
function getTrainingSessions() {
    const sessions = [];
    for (let index = 0; index < trainingEntries.length; index++) {
        addEntryToTrainingSessions(sessions, trainingEntries[index]);
    }
    sessions.sort(function (firstSession, secondSession) {
        return secondSession.latestId - firstSession.latestId;
    });
    return sessions;
}

// Adds an entry to its date-based training session.
function addEntryToTrainingSessions(sessions, entry) {
    let session = sessions.find(function (item) {
        return item.date === entry.date;
    });
    if (!session) {
        session = {
            date: entry.date,
            trainingName: entry.trainingName || "Trainingseinheit",
            latestId: Number(entry.id),
            entries: []
        };
        sessions.push(session);
    }
    session.latestId = Math.max(session.latestId, Number(entry.id));
    if (entry.trainingName) {
        session.trainingName = entry.trainingName;
    }
    session.entries.push(entry);
}

// Shows saved sessions as read-only cards with edit and delete buttons.
function showTrainingSessions() {
    const sessionList = document.getElementById("trainingSessions");
    const sessions = getTrainingSessions();
    sessionList.innerHTML = "";

    if (sessions.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-chart";
        emptyMessage.textContent = "Noch keine Trainingseinheiten gespeichert.";
        sessionList.appendChild(emptyMessage);
        return;
    }
    for (let index = 0; index < sessions.length; index++) {
        sessionList.appendChild(makeTrainingSessionCard(sessions[index]));
    }
}

// Builds a read-only summary card for one training session.
function makeTrainingSessionCard(session) {
    const card = document.createElement("section");
    const header = document.createElement("div");
    const heading = document.createElement("h3");
    const date = document.createElement("p");
    const exerciseList = document.createElement("div");
    const actions = document.createElement("div");

    card.className = "panel training-session-card";
    header.className = "session-card-heading";
    heading.textContent = session.trainingName;
    date.textContent = formatDate(session.date);
    exerciseList.className = "session-exercise-list";
    actions.className = "session-actions";
    header.appendChild(heading);
    header.appendChild(date);
    for (let index = 0; index < session.entries.length; index++) {
        exerciseList.appendChild(makeSessionExerciseRow(session.entries[index]));
    }
    actions.appendChild(makeSessionButton("Bearbeiten", "edit-session-button", session.date));
    actions.appendChild(makeSessionButton("Löschen", "delete-session-button", session.date));
    card.appendChild(header);
    card.appendChild(exerciseList);
    card.appendChild(actions);
    return card;
}

// Creates one exercise summary line inside a session card.
function makeSessionExerciseRow(entry) {
    const row = document.createElement("div");
    const name = document.createElement("strong");
    const details = document.createElement("span");
    row.className = "session-exercise-row";
    name.textContent = entry.exercise;
    details.textContent = makeSetDetails(entry.sets);
    row.appendChild(name);
    row.appendChild(details);
    return row;
}

// Creates an edit or delete button for a session card.
function makeSessionButton(label, className, date) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.date = date;
    button.textContent = label;
    return button;
}

// Deletes all exercises in a date-based session after confirmation.
function deleteTrainingSession(event) {
    if (!event.target.classList.contains("delete-session-button")) {
        return;
    }
    const date = event.target.dataset.date;
    if (!confirm("Diese Trainingseinheit wirklich löschen?")) {
        return;
    }
    trainingEntries = trainingEntries.filter(function (entry) {
        return entry.date !== date;
    });
    localStorage.setItem("trainingEntries", JSON.stringify(trainingEntries));
    showTrainingSessions();
    showStatistics();
}

// Builds short text for all sets of one exercise.
function makeSetDetails(sets) {
    const details = [];
    for (let index = 0; index < sets.length; index++) {
        details.push(sets[index].weight + " kg × " + sets[index].repetitions);
    }
    return details.join(", ");
}

// Converts special characters before text is used in HTML.
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Changes the database date into a readable German date.
function formatDate(dateText) {
    const date = new Date(dateText + "T00:00:00");
    return date.toLocaleDateString("de-DE");
}

// Switches between the training and statistics pages.
function openTab(tabName) {
    const tabNames = ["training", "statistics", "exercise"];
    for (let index = 0; index < tabNames.length; index++) {
        document.getElementById(tabNames[index] + "Page").classList.remove("active");
        document.getElementById(tabNames[index] + "Tab").classList.remove("active");
    }

    document.getElementById(tabName + "Page").classList.add("active");
    document.getElementById(tabName + "Tab").classList.add("active");
    if (tabName === "statistics") {
        showStatistics();
    }
    if (tabName === "exercise") {
        showExerciseList();
    }
}

// Calculates totals and draws simple statistics bars.
function showStatistics() {
    let setTotal = 0;
    let usedExercises = [];
    let usedDates = [];
    for (let index = 0; index < trainingEntries.length; index++) {
        setTotal = setTotal + trainingEntries[index].sets.length;
        const exerciseName = trainingEntries[index].exercise;
        const trainingDate = trainingEntries[index].date;
        if (!usedExercises.includes(exerciseName)) {
            usedExercises.push(exerciseName);
        }
        if (!usedDates.includes(trainingDate)) {
            usedDates.push(trainingDate);
        }
    }

    document.getElementById("trainingCount").textContent = usedDates.length;
    document.getElementById("exerciseCount").textContent = usedExercises.length;
    document.getElementById("setTotal").textContent = setTotal;
    showExerciseChart();
    showExerciseCharts();
}

// Counts how often each exercise was used.
function showExerciseChart() {
    const exerciseCount = {};
    for (let index = 0; index < trainingEntries.length; index++) {
        const exerciseName = trainingEntries[index].exercise;
        if (exerciseCount[exerciseName]) {
            exerciseCount[exerciseName]++;
        } else {
            exerciseCount[exerciseName] = 1;
        }
    }
    drawChart("exerciseChart", exerciseCount, " Mal");
}

// Draws two frequency line charts for every saved exercise.
function showExerciseCharts() {
    const chartContainer = document.getElementById("exerciseCharts");
    chartContainer.innerHTML = "";

    for (let index = 0; index < exercises.length; index++) {
        const exerciseName = exercises[index];
        const card = document.createElement("section");
        card.className = "panel exercise-chart-card";
        const heading = document.createElement("h3");
        heading.textContent = exerciseName;
        const charts = document.createElement("div");
        charts.className = "exercise-line-grid";
        card.appendChild(heading);
        addExerciseLineChart(charts, exerciseName, "weight", "Gewicht (kg)", "kg");
        addExerciseLineChart(charts, exerciseName, "repetitions", "Wiederholungen", "Wdh.");
        card.appendChild(charts);
        chartContainer.appendChild(card);
    }
}

// Adds one titled line chart for the selected exercise value.
function addExerciseLineChart(container, exerciseName, fieldName, title, unit) {
    const chartPanel = document.createElement("div");
    const heading = document.createElement("h4");
    const description = document.createElement("p");
    const chart = document.createElement("div");

    chartPanel.className = "frequency-chart";
    heading.textContent = title;
    description.className = "chart-description";
    description.textContent = "X: Wert · Y: Anzahl der Sätze";
    chart.className = "line-chart";
    chartPanel.appendChild(heading);
    chartPanel.appendChild(description);
    chartPanel.appendChild(chart);
    drawFrequencyChart(chart, collectExerciseFrequencies(exerciseName, fieldName), unit);
    container.appendChild(chartPanel);
}

// Counts how many sets used each value for this exercise.
function collectExerciseFrequencies(exerciseName, fieldName) {
    const counts = {};
    for (let entryIndex = 0; entryIndex < trainingEntries.length; entryIndex++) {
        const entry = trainingEntries[entryIndex];
        if (entry.exercise !== exerciseName) {
            continue;
        }
        for (let setIndex = 0; setIndex < entry.sets.length; setIndex++) {
            const value = Number(entry.sets[setIndex][fieldName]);
            counts[value] = (counts[value] || 0) + 1;
        }
    }

    const values = Object.keys(counts).map(Number);
    values.sort(function (firstValue, secondValue) {
        return firstValue - secondValue;
    });
    const frequencies = [];
    for (let index = 0; index < values.length; index++) {
        frequencies.push({ value: values[index], count: counts[values[index]] });
    }
    return frequencies;
}

// Creates a frequency graph, including an empty graph when no data exists.
function drawFrequencyChart(container, frequencies, unit) {
    const svg = createSvgElement("svg", {
        viewBox: "0 0 520 280",
        role: "img",
        "aria-label": "Häufigkeitsdiagramm für " + unit
    });
    const maxCount = findHighestFrequency(frequencies);
    drawFrequencyAxes(svg, maxCount);

    if (frequencies.length === 0) {
        addSvgText(svg, 285, 140, "Noch keine Satzdaten");
    } else {
        drawFrequencyLine(svg, frequencies, maxCount, unit);
    }
    container.appendChild(svg);
}

// Finds the largest frequency for the vertical chart scale.
function findHighestFrequency(frequencies) {
    let highest = 0;
    for (let index = 0; index < frequencies.length; index++) {
        if (frequencies[index].count > highest) {
            highest = frequencies[index].count;
        }
    }
    return highest;
}

// Draws the horizontal and vertical axes with frequency guide lines.
function drawFrequencyAxes(svg, maxCount) {
    const left = 52;
    const right = 500;
    const top = 18;
    const bottom = 230;
    addFrequencyGridLine(svg, left, right, top);
    addFrequencyGridLine(svg, left, right, bottom);
    if (maxCount > 1) {
        const middleCount = Math.ceil(maxCount / 2);
        const middleY = bottom - (middleCount / maxCount) * (bottom - top);
        addFrequencyGridLine(svg, left, right, middleY);
        addSvgText(svg, 35, middleY + 5, middleCount);
    }
    svg.appendChild(createSvgElement("line", {
        x1: left, y1: top, x2: left, y2: bottom, class: "frequency-axis-line"
    }));
    svg.appendChild(createSvgElement("line", {
        x1: left, y1: bottom, x2: right, y2: bottom, class: "frequency-axis-line"
    }));
    addSvgText(svg, 35, top + 5, maxCount);
    addSvgText(svg, 35, bottom + 5, 0);
}

// Adds one horizontal frequency guide line to the chart.
function addFrequencyGridLine(svg, left, right, y) {
    svg.appendChild(createSvgElement("line", {
        x1: left, y1: y, x2: right, y2: y, class: "frequency-grid-line"
    }));
}

// Draws a rising or falling line through the measured frequencies.
function drawFrequencyLine(svg, frequencies, maxCount, unit) {
    const firstValue = frequencies[0].value;
    const lastValue = frequencies[frequencies.length - 1].value;
    const points = [];

    for (let index = 0; index < frequencies.length; index++) {
        points.push(getFrequencyPoint(frequencies[index], firstValue, lastValue, maxCount));
    }

    const pointList = points.map(function (point) {
        return point.x + "," + point.y;
    }).join(" ");
    svg.appendChild(createSvgElement("polyline", {
        points: pointList, class: "frequency-line"
    }));
    addFrequencyPoints(svg, points, unit);
}

// Calculates where one measured value belongs in the chart.
function getFrequencyPoint(frequency, firstValue, lastValue, maxCount) {
    const left = 52;
    const right = 500;
    const top = 18;
    const bottom = 230;
    let x = (left + right) / 2;
    if (lastValue !== firstValue) {
        x = left + ((frequency.value - firstValue) / (lastValue - firstValue)) * (right - left);
    }
    const y = bottom - (frequency.count / maxCount) * (bottom - top);
    return { x: x, y: y, value: frequency.value, count: frequency.count };
}

// Adds visible data points and their labels to the line chart.
function addFrequencyPoints(svg, points, unit) {
    const bottom = 230;
    const labelStep = Math.ceil(points.length / 12);
    for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const circle = createSvgElement("circle", {
            cx: point.x, cy: point.y, r: 6, class: "frequency-point"
        });
        const title = createSvgElement("title", {});
        title.textContent = point.value + " " + unit + ": " + point.count + " Sätze";
        circle.appendChild(title);
        svg.appendChild(circle);
        if (points.length <= 12 || index % labelStep === 0 || index === points.length - 1) {
            addSvgText(svg, point.x, bottom + 22, point.value, "frequency-value-label");
        }
        if (points.length <= 12) {
            const labelY = point.y < 35 ? point.y + 22 : point.y - 10;
            addSvgText(svg, point.x, labelY, point.count, "frequency-point-label");
        }
    }
}

// Creates an SVG element with the supplied attributes.
function createSvgElement(tagName, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    const attributeNames = Object.keys(attributes);
    for (let index = 0; index < attributeNames.length; index++) {
        element.setAttribute(attributeNames[index], attributes[attributeNames[index]]);
    }
    return element;
}

// Adds centered text to an SVG chart.
function addSvgText(svg, x, y, text, className) {
    const label = createSvgElement("text", {
        x: x, y: y, class: className || "frequency-axis-label",
        "text-anchor": "middle"
    });
    label.textContent = text;
    svg.appendChild(label);
}

// Creates horizontal bars from the supplied name and number data.
function drawChart(chartId, values, unit) {
    const chart = document.getElementById(chartId);
    chart.innerHTML = "";
    const names = Object.keys(values);

    if (names.length === 0) {
        chart.innerHTML = '<p class="empty-chart">Noch keine Daten vorhanden.</p>';
        return;
    }

    let highestValue = 0;
    for (let index = 0; index < names.length; index++) {
        if (values[names[index]] > highestValue) {
            highestValue = values[names[index]];
        }
    }

    for (let index = 0; index < names.length; index++) {
        const name = names[index];
        const value = values[name];
        const width = (value / highestValue) * 100;
        const row = document.createElement("div");
        row.className = "bar-row";
        row.innerHTML =
            "<span>" + escapeHtml(name) + "</span>" +
            '<div class="bar-track"><div class="bar-fill" style="width:' +
            width + '%"></div></div>' +
            "<strong>" + value + unit + "</strong>";
        chart.appendChild(row);
    }
}

// Starts the page and connects all buttons.
function startApp() {
    showTrainingSessions();
    showStatistics();
    showExerciseList();

    document.getElementById("newTrainingButton").addEventListener("click", openNewTrainingForm);
    document.getElementById("cancelTrainingButton").addEventListener("click", cancelTrainingForm);
    document.getElementById("addExerciseEntryButton").addEventListener("click", addExerciseEntry);
    document.getElementById("exerciseEntries").addEventListener("click", handleExerciseEntryClick);
    document.getElementById("trainingSessions").addEventListener("click", openEditTraining);
    document.getElementById("trainingSessions").addEventListener("click", deleteTrainingSession);
    document.getElementById("exerciseForm").addEventListener("submit", addExercise);
    document.getElementById("exerciseTable").addEventListener("click", renameExercise);
    document.getElementById("trainingForm").addEventListener("submit", saveTraining);
    document.getElementById("trainingTab").addEventListener("click", function () {
        openTab("training");
    });
    document.getElementById("statisticsTab").addEventListener("click", function () {
        openTab("statistics");
    });
    document.getElementById("exerciseTab").addEventListener("click", function () {
        openTab("exercise");
    });
}

startApp();
