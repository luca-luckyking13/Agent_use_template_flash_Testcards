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

// Saves the exercise list and refreshes the drop-down menu.
function updateExerciseSelect() {
    const exerciseSelect = document.getElementById("exerciseSelect");
    exerciseSelect.innerHTML = "";

    for (let index = 0; index < exercises.length; index++) {
        const option = document.createElement("option");
        option.textContent = exercises[index];
        option.value = exercises[index];
        exerciseSelect.appendChild(option);
    }
}

// Creates input fields for weight and repetitions for every set.
function createSetFields() {
    const setCount = Number(document.getElementById("setCount").value);
    const setFields = document.getElementById("setFields");
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
    showTrainingTable();
    showStatistics();
    message.textContent = "Übungsname wurde geändert.";
}

// Reads all set fields and saves one complete training entry.
function saveTraining(event) {
    event.preventDefault();

    const date = document.getElementById("trainingDate").value;
    const exercise = document.getElementById("exerciseSelect").value;
    const weightInputs = document.querySelectorAll(".set-weight");
    const repetitionInputs = document.querySelectorAll(".set-reps");
    const sets = [];

    for (let index = 0; index < weightInputs.length; index++) {
        const weight = Number(weightInputs[index].value);
        const repetitions = Number(repetitionInputs[index].value);
        if (weightInputs[index].value === "" || repetitionInputs[index].value === "") {
            alert("Bitte für jeden Satz Gewicht und Wiederholungen eingeben.");
            return;
        }
        sets.push({ weight: weight, repetitions: repetitions });
    }

    trainingEntries.push({
        id: Date.now(),
        date: date,
        exercise: exercise,
        sets: sets
    });

    localStorage.setItem("trainingEntries", JSON.stringify(trainingEntries));
    showTrainingTable();
    showStatistics();
    document.getElementById("trainingForm").reset();
    document.getElementById("setCount").value = "3";
    document.getElementById("trainingDate").value =
        new Date().toISOString().split("T")[0];
    createSetFields();
}

// Displays every saved training entry in a table.
function showTrainingTable() {
    const tableBody = document.getElementById("trainingTable");
    tableBody.innerHTML = "";

    for (let index = trainingEntries.length - 1; index >= 0; index--) {
        const entry = trainingEntries[index];
        const row = document.createElement("tr");
        const details = makeSetDetails(entry.sets);
        row.innerHTML =
            "<td>" + formatDate(entry.date) + "</td>" +
            "<td>" + escapeHtml(entry.exercise) + "</td>" +
            "<td>" + entry.sets.length + "</td>" +
            "<td>" + details + "</td>" +
            '<td><button class="delete-button" type="button" data-id="' +
            entry.id + '">Löschen</button></td>';
        tableBody.appendChild(row);
    }
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

// Deletes one training entry from the saved list.
function deleteTraining(event) {
    if (!event.target.classList.contains("delete-button")) {
        return;
    }

    const entryId = Number(event.target.dataset.id);
    trainingEntries = trainingEntries.filter(function (entry) {
        return entry.id !== entryId;
    });
    localStorage.setItem("trainingEntries", JSON.stringify(trainingEntries));
    showTrainingTable();
    showStatistics();
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
    for (let index = 0; index < trainingEntries.length; index++) {
        setTotal = setTotal + trainingEntries[index].sets.length;
        const exerciseName = trainingEntries[index].exercise;
        if (!usedExercises.includes(exerciseName)) {
            usedExercises.push(exerciseName);
        }
    }

    document.getElementById("trainingCount").textContent = trainingEntries.length;
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
        viewBox: "0 0 520 230",
        role: "img",
        "aria-label": "Häufigkeitsdiagramm für " + unit
    });
    const maxCount = findHighestFrequency(frequencies);
    drawFrequencyAxes(svg, maxCount);

    if (frequencies.length === 0) {
        addSvgText(svg, 285, 112, "Noch keine Satzdaten");
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
    const bottom = 185;
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
    const bottom = 185;
    let x = (left + right) / 2;
    if (lastValue !== firstValue) {
        x = left + ((frequency.value - firstValue) / (lastValue - firstValue)) * (right - left);
    }
    const y = bottom - (frequency.count / maxCount) * (bottom - top);
    return { x: x, y: y, value: frequency.value, count: frequency.count };
}

// Adds visible data points and their labels to the line chart.
function addFrequencyPoints(svg, points, unit) {
    const bottom = 185;
    const labelStep = Math.ceil(points.length / 7);
    for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const circle = createSvgElement("circle", {
            cx: point.x, cy: point.y, r: 5, class: "frequency-point"
        });
        const title = createSvgElement("title", {});
        title.textContent = point.value + " " + unit + ": " + point.count + " Sätze";
        circle.appendChild(title);
        svg.appendChild(circle);
        if (points.length <= 7 || index % labelStep === 0 || index === points.length - 1) {
            addSvgText(svg, point.x, bottom + 22, point.value, "frequency-value-label");
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
    const today = new Date();
    const dateText = today.toISOString().split("T")[0];
    document.getElementById("trainingDate").value = dateText;
    updateExerciseSelect();
    createSetFields();
    showTrainingTable();
    showStatistics();
    showExerciseList();

    document.getElementById("createSetsButton").addEventListener("click", createSetFields);
    document.getElementById("exerciseForm").addEventListener("submit", addExercise);
    document.getElementById("exerciseTable").addEventListener("click", renameExercise);
    document.getElementById("trainingForm").addEventListener("submit", saveTraining);
    document.getElementById("trainingTable").addEventListener("click", deleteTraining);
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
