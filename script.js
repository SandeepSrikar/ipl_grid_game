
"use strict";

// ======================================================
// IPL 3x3 GRID QUIZ
// ======================================================

const MAX_LIVES = 5;
const GRID_SIZE = 3;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const MAX_ROUND_ATTEMPTS = 5000;

const TEAM_NAMES = {
    RCB: "Royal Challengers Bengaluru",
    CSK: "Chennai Super Kings",
    MI: "Mumbai Indians",
    KKR: "Kolkata Knight Riders",
    SRH: "Sunrisers Hyderabad",
    DC: "Delhi Capitals",
    DD: "Delhi Daredevils",
    DC_HYD: "Deccan Chargers",
    PBKS: "Punjab Kings",
    GL: "Gujarat Lions",
    RPS: "Rising Pune Supergiant",
    PWI: "Pune Warriors India",
    RR: "Rajasthan Royals",
    LSG: "Lucknow Super Giants",
    GT: "Gujarat Titans",
    Kochi: "Kochi Tuskers Kerala"
};

const TEAM_LOGOS = {
    RCB: "./assets/teams/RCB.png",
    CSK: "./assets/teams/CSK.png",
    MI: "./assets/teams/MI.png",
    KKR: "./assets/teams/KKR.png",
    SRH: "./assets/teams/SRH.png",
    DC: "./assets/teams/DC.png",
    DD: "./assets/teams/DD.png",
    DCH: "./assets/teams/DCH.png",
    PBKS: "./assets/teams/PBKS.png",
    KXIP: "./assets/teams/PBKS.png",
    GL: "./assets/teams/GL.png",
    RPS: "./assets/teams/RPS.png",
    PWI: "./assets/teams/PWI.png",
    RR: "./assets/teams/RR.png",
    LSG: "./assets/teams/LSG.png",
    GT: "./assets/teams/GT.png",
    Kochi: "./assets/teams/KTK.png"
};

const COUNTRY_LOGOS = {
    India: "./assets/countries/India.png",
    Australia: "./assets/countries/Australia.png",
    England: "./assets/countries/England.png",
    "New Zealand": "./assets/countries/New Zealand.png",
    "South Africa": "./assets/countries/South Africa.png",
    Pakistan: "./assets/countries/Pakistan.png",
    "Sri Lanka": "./assets/countries/Sri Lanka.png",
    Bangladesh: "./assets/countries/Bangladesh.png",
    Afghanistan: "./assets/countries/Afghanistan.png",
    "West Indies": "./assets/countries/West Indies.png"
};

const BOOLEAN_CLUES = [
    { field: "isIPLWinner", label: "IPL Winner" },
    { field: "orangeCap", label: "Orange Cap Winner" },
    { field: "purpleCap", label: "Purple Cap Winner" },
    { field: "isCaptain", label: "IPL Captain" },
    { field: "centuryScored", label: "Scored an IPL Century" }
];

// ======================================================
// DOM ELEMENTS
// ======================================================

const newRoundButton = document.getElementById("new-round-btn");
const correctCountElement = document.getElementById("correct-count");
const mistakeCountElement = document.getElementById("mistake-count");
const livesCountElement = document.getElementById("lives-count");

const columnCluesElement = document.getElementById("column-clues");
const rowCluesElement = document.getElementById("row-clues");
const answerGridElement = document.getElementById("answer-grid");

const playerInput = document.getElementById("player-input");
const playerDropdown = document.getElementById("player-dropdown");
const submitAnswerButton = document.getElementById("submit-answer-btn");
const feedbackElement = document.getElementById("feedback");

const completionPanel = document.getElementById("completion-panel");
const completionTitle = document.getElementById("completion-title");
const completionMessage = document.getElementById("completion-message");
const playAgainButton = document.getElementById("play-again-btn");

// Guess Player game elements.
const gridTab = document.getElementById("grid-tab");
const guessTab = document.getElementById("guess-tab");
const gridView = document.getElementById("grid-view");
const guessView = document.getElementById("guess-view");
const guessNewRoundButton = document.getElementById("guess-new-round-btn");
const guessCountElement = document.getElementById("guess-count");
const revealedCountElement = document.getElementById("revealed-count");
const careerCountElement = document.getElementById("career-count");
const careerTeamsElement = document.getElementById("career-teams");
const guessFeedbackElement = document.getElementById("guess-feedback");
const guessPlayerInput = document.getElementById("guess-player-input");
const guessPlayerDropdown = document.getElementById("guess-player-dropdown");
const guessSubmitButton = document.getElementById("guess-submit-btn");
const guessResultPanel = document.getElementById("guess-result-panel");
const guessResultTitle = document.getElementById("guess-result-title");
const guessResultMessage = document.getElementById("guess-result-message");
const fullCareerTeamsElement = document.getElementById("full-career-teams");
const guessPlayAgainButton = document.getElementById("guess-play-again-btn");

// ======================================================
// GAME STATE
// ======================================================

let players = [];
let clues = [];
let rowClues = [];
let columnClues = [];
let solution = [];

let selectedCellIndex = null;
let selectedSuggestionIndex = -1;

let correctCount = 0;
let mistakeCount = 0;
let lives = MAX_LIVES;

let gameOver = false;
let gameWon = false;

// Stores unique IDs of players correctly used this round.
let usedPlayerIds = new Set();

let playerTeamRecords = [];
let guessTarget = null;
let guessTeamHistory = [];
let revealedTeamCount = 2;
let guessAttempts = 0;
let guessGameOver = false;
let guessWon = false;
let selectedGuessSuggestionIndex = -1;
const guessedPlayerIds = new Set();

// ======================================================
// GENERAL HELPERS
// ======================================================

function getPlayerId(player) {
    return String(player.id ?? player.name);
}

function shuffle(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function normalizeName(value) {
    return String(value || "").trim().toLocaleLowerCase();
}

function setFeedback(message, type = "") {
    feedbackElement.textContent = message;
    feedbackElement.className = "feedback";

    if (type) {
        feedbackElement.classList.add(type);
    }
}

function updateStats() {
    correctCountElement.textContent = `${correctCount} / ${TOTAL_CELLS}`;
    mistakeCountElement.textContent = `${mistakeCount} / ${MAX_LIVES}`;
    livesCountElement.textContent = lives;

    livesCountElement.style.color =
        lives <= 2 ? "var(--red)" : "var(--green)";
}

function hideDropdown() {
    playerDropdown.hidden = true;
    playerDropdown.replaceChildren();
    selectedSuggestionIndex = -1;
}

function closeCompletionPanel() {
    completionPanel.hidden = true;
}

function disableAnswerControls(disabled) {
    playerInput.disabled = disabled;
    submitAnswerButton.disabled = disabled;
}

// ======================================================
// CLUE CREATION
// ======================================================

function createCluePool() {
    const pool = [];
    const seenKeys = new Set();

    function addClue(clue) {
        if (seenKeys.has(clue.key)) return;

        seenKeys.add(clue.key);
        pool.push(clue);
    }

    // Team clues.
    [...new Set(players.flatMap(player => player.teams || []))]
        .forEach(teamId => {
            addClue({
                key: `team:${teamId}`,
                label: `Played for ${TEAM_NAMES[teamId] || teamId}`,
                test: player => (player.teams || []).includes(teamId)
            });
        });

    // Non-Indian players get their country name only.
    [...new Set(
        players
            .map(player => player.country)
            .filter(country => country && country !== "India")
    )].forEach(country => {
        addClue({
            key: `country:${country}`,
            label: country,
            test: player => player.country === country
        });
    });

    // Role clues.
    [...new Set(players.map(player => player.role).filter(Boolean))]
        .forEach(role => {
            addClue({
                key: `role:${role}`,
                label: role
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, character => character.toUpperCase()),
                test: player => player.role === role
            });
        });

    // Achievement clues.
    BOOLEAN_CLUES.forEach(({ field, label }) => {
        if (players.some(player => player[field] === true)) {
            addClue({
                key: `boolean:${field}`,
                label,
                test: player => player[field] === true
            });
        }
    });

    // Indian players with isInternational === true.
    if (players.some(player =>
        player.country === "India" &&
        player.isInternational === true
    )) {
        addClue({
            key: "classification:indian-player",
            label: "Indian Player",
            test: player =>
                player.country === "India" &&
                player.isInternational === true
        });
    }

    // Indian players with isInternational === false.
    if (players.some(player =>
        player.country === "India" &&
        player.isInternational === false
    )) {
        addClue({
            key: "classification:domestic-player",
            label: "Domestic Player",
            test: player =>
                player.country === "India" &&
                player.isInternational === false
        });
    }

    // No "Overseas Player" clue is created.
    return pool;
}

// ======================================================
// FIND A SOLUTION WITH NO REPEATED PLAYERS
// ======================================================

function findSolution(candidateMatrix) {
    const answers = Array(TOTAL_CELLS).fill(null);
    const usedIds = new Set();

    // Solve cells with fewer candidates first.
    const cellOrder = Array.from(
        { length: TOTAL_CELLS },
        (_, index) => index
    ).sort((a, b) =>
        candidateMatrix[a].length - candidateMatrix[b].length
    );

    function search(position) {
        if (position === TOTAL_CELLS) {
            return true;
        }

        const cellIndex = cellOrder[position];
        const candidates = shuffle(candidateMatrix[cellIndex]);

        for (const player of candidates) {
            const playerId = getPlayerId(player);

            if (usedIds.has(playerId)) {
                continue;
            }

            usedIds.add(playerId);
            answers[cellIndex] = player;

            if (search(position + 1)) {
                return true;
            }

            usedIds.delete(playerId);
            answers[cellIndex] = null;
        }

        return false;
    }

    return search(0) ? answers : null;
}

// ======================================================
// GENERATE A NEW ROUND
// ======================================================


function generateRound() {
    if (players.length < TOTAL_CELLS) {
        setFeedback("Not enough players in players.json.", "error");
        return;
    }

    const cluePool = createCluePool();

    if (cluePool.length < GRID_SIZE * 2) {
        setFeedback(
            "Not enough different clues to create a grid.",
            "error"
        );
        return;
    }

    let foundRound = false;

    for (let attempt = 0; attempt < MAX_ROUND_ATTEMPTS; attempt++) {
        const chosenClues = shuffle(cluePool).slice(0, GRID_SIZE * 2);

        const proposedRows = chosenClues.slice(0, GRID_SIZE);
        const proposedColumns = chosenClues.slice(GRID_SIZE);

        // Collect the team IDs used by all six clues.
        const selectedTeamIds = new Set(
            chosenClues
                .filter(clue => clue.key.startsWith("team:"))
                .map(clue => clue.key.slice("team:".length))
        );

        // KXIP and PBKS are the same franchise under different names.
        // Reject this combination if both team clues are selected.
        if (
            selectedTeamIds.has("KXIP") &&
            selectedTeamIds.has("PBKS")
        ) {
            continue;
        }

        // DC and DD are allowed together. No restriction is needed.

        const candidateMatrix = [];

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let column = 0; column < GRID_SIZE; column++) {
                const rowClue = proposedRows[row];
                const columnClue = proposedColumns[column];

                const candidates = players.filter(player =>
                    rowClue.test(player) &&
                    columnClue.test(player)
                );

                candidateMatrix.push(candidates);
            }
        }

        // Every cell must have at least one possible answer.
        if (candidateMatrix.some(candidates => candidates.length === 0)) {
            continue;
        }

        // Find a solution that uses a different player in every cell.
        const foundSolution = findSolution(candidateMatrix);

        if (!foundSolution) {
            continue;
        }

        rowClues = proposedRows;
        columnClues = proposedColumns;
        clues = [...rowClues, ...columnClues];
        solution = foundSolution;

        foundRound = true;
        break;
    }

    if (!foundRound) {
        setFeedback(
            "Could not create a valid grid from the current player data. " +
            "Add more players or retry.",
            "error"
        );

        disableAnswerControls(true);
        return;
    }

    // Reset the state for the new round.
    selectedCellIndex = null;
    correctCount = 0;
    mistakeCount = 0;
    lives = MAX_LIVES;
    gameOver = false;
    gameWon = false;

    // Players can be used again in a new round.
    usedPlayerIds.clear();

    closeCompletionPanel();
    hideDropdown();

    playerInput.value = "";
    disableAnswerControls(false);

    updateStats();
    renderClues();
    renderGrid();

    setFeedback("New round ready. Select a cell to begin.");
}


// ======================================================
// RENDER CLUES
// ======================================================

function renderClue(clue, index, type) {
    const element = document.createElement("div");

    element.className =
        type === "row" ? "row-clue" : "column-clue";

    const teamMatch = clue.key.match(/^team:(.+)$/);
    const countryMatch = clue.key.match(/^country:(.+)$/);

    let logoUrl = null;
    let logoName = "";

    if (clue.key === "boolean:isIPLWinner") {
        logoUrl = "./assets/other/trophy.png";
        logoName = clue.label;
        element.classList.add("trophy-clue");
    } else if (teamMatch) {
        const teamId = teamMatch[1];
        logoUrl = TEAM_LOGOS[teamId];
        logoName = TEAM_NAMES[teamId] || teamId;
    } else if (countryMatch) {
        const country = countryMatch[1];
        logoUrl = COUNTRY_LOGOS[country] || null;
        logoName = country;
    }

    if (logoUrl) {
        const image = document.createElement("img");

        image.src = logoUrl;
        image.alt = `${logoName} logo`;
        image.className =
            clue.key === "boolean:isIPLWinner"
                ? "trophy-icon"
                : "team-logo";
        image.loading = "lazy";

        image.onerror = () => {
            element.replaceChildren();
            element.textContent = clue.label;
        };

        element.appendChild(image);
        element.title = logoName;
    } else {
        element.textContent = clue.label;
        element.title = clue.label;
    }

    element.setAttribute("aria-label", clue.label);

    return element;
}

function renderClues() {
    columnCluesElement.replaceChildren();
    rowCluesElement.replaceChildren();

    columnClues.forEach((clue, index) => {
        columnCluesElement.appendChild(
            renderClue(clue, index, "column")
        );
    });

    rowClues.forEach((clue, index) => {
        rowCluesElement.appendChild(
            renderClue(clue, index, "row")
        );
    });
}

// ======================================================
// RENDER THE 3x3 ANSWER GRID
// ======================================================

function renderGrid() {
    answerGridElement.replaceChildren();

    for (let index = 0; index < TOTAL_CELLS; index++) {
        const cell = document.createElement("button");

        cell.type = "button";
        cell.className = "answer-cell";
        cell.id = `cell-${index}`;
        cell.dataset.index = index;
        cell.textContent = "Select";

        cell.setAttribute(
            "aria-label",
            `Row ${Math.floor(index / GRID_SIZE) + 1}, ` +
            `column ${(index % GRID_SIZE) + 1}`
        );

        cell.addEventListener("click", () => selectCell(index));

        answerGridElement.appendChild(cell);
    }

    updateGridPositions();
}

function updateGridPositions() {
    const cells = answerGridElement.querySelectorAll(".answer-cell");

    cells.forEach((cell, index) => {
        const row = Math.floor(index / GRID_SIZE);
        const column = index % GRID_SIZE;

        cell.style.gridRow = String(row + 2);
        cell.style.gridColumn = String(column + 2);
    });

    rowCluesElement.querySelectorAll(".row-clue")
        .forEach((element, index) => {
            element.style.gridRow = String(index + 2);
        });

    columnCluesElement.querySelectorAll(".column-clue")
        .forEach((element, index) => {
            element.style.gridColumn = String(index + 2);
        });
}

// ======================================================
// SELECT CELLS
// ======================================================

function selectCell(index) {
    if (gameOver || gameWon) {
        return;
    }

    const cell = document.getElementById(`cell-${index}`);

    if (!cell || cell.classList.contains("correct")) {
        setFeedback("That cell is already solved and locked.", "warning");
        return;
    }

    if (cell.classList.contains("revealed-answer")) {
        return;
    }

    selectedCellIndex = index;

    document.querySelectorAll(".answer-cell").forEach(item => {
        item.classList.remove("selected");
    });

    cell.classList.add("selected");

    const row = Math.floor(index / GRID_SIZE);
    const column = index % GRID_SIZE;

    setFeedback(
        `Selected: ${rowClues[row].label} × ${columnClues[column].label}`
    );

    playerInput.value = "";
    hideDropdown();
    playerInput.focus();
}

// ======================================================
// PLAYER AUTOCOMPLETE
// ======================================================

function renderSuggestions() {
    hideDropdown();

    if (gameOver || gameWon || selectedCellIndex === null) {
        return;
    }

    const query = normalizeName(playerInput.value);

    if (query.length < 2) {
        return;
    }

    const matches = players
        .filter(player => {
            const playerId = getPlayerId(player);

            return (
                normalizeName(player.name).includes(query) &&
                !usedPlayerIds.has(playerId)
            );
        })
        .slice(0, 8);

    if (matches.length === 0) {
        return;
    }

    matches.forEach(player => {
        const option = document.createElement("button");

        option.type = "button";
        option.className = "player-option";
        option.setAttribute("role", "option");
        option.textContent = player.name;

        option.addEventListener("mousedown", event => {
            event.preventDefault();
        });

        option.addEventListener("click", () => {
            playerInput.value = player.name;
            hideDropdown();
            playerInput.focus();
        });

        playerDropdown.appendChild(option);
    });

    playerDropdown.hidden = false;
}

playerInput.addEventListener("input", renderSuggestions);

playerInput.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        hideDropdown();
    }

    if (event.key === "Enter") {
        event.preventDefault();

        if (!playerDropdown.hidden) {
            const firstOption =
                playerDropdown.querySelector(".player-option");

            if (firstOption) {
                playerInput.value = firstOption.textContent;
                hideDropdown();
                return;
            }
        }

        submitAnswer();
    }
});

playerInput.addEventListener("blur", () => {
    window.setTimeout(hideDropdown, 120);
});

// ======================================================
// SUBMIT ANSWER
// ======================================================

function submitAnswer() {
    if (gameOver || gameWon) {
        return;
    }

    if (selectedCellIndex === null) {
        setFeedback("Select an unsolved cell first.", "warning");
        return;
    }

    const cell = document.getElementById(`cell-${selectedCellIndex}`);

    if (
        !cell ||
        cell.classList.contains("correct") ||
        cell.classList.contains("revealed-answer")
    ) {
        setFeedback("Choose an unanswered cell.", "warning");
        return;
    }

    const enteredName = normalizeName(playerInput.value);

    if (!enteredName) {
        setFeedback("Enter a player name.", "warning");
        playerInput.focus();
        return;
    }

    const player = players.find(
        item => normalizeName(item.name) === enteredName
    );

    if (!player) {
        registerMistake("Player not found. Check the name and try again.");
        return;
    }

    const playerId = getPlayerId(player);

    // Do not allow a previously used player to fill another cell.
    if (usedPlayerIds.has(playerId)) {
        registerMistake("That player has already been used.");
        return;
    }

    const row = Math.floor(selectedCellIndex / GRID_SIZE);
    const column = selectedCellIndex % GRID_SIZE;

    const matchesRow = rowClues[row].test(player);
    const matchesColumn = columnClues[column].test(player);

    if (matchesRow && matchesColumn) {
        cell.textContent = player.name;
        cell.classList.remove("selected", "wrong");
        cell.classList.add("correct");

        cell.disabled = true;
        cell.setAttribute("aria-disabled", "true");
        cell.title = "Correct answer — cell locked";

        // Record the player only after a correct answer.
        usedPlayerIds.add(playerId);

        correctCount++;

        updateStats();
        hideDropdown();

        playerInput.value = "";
        selectedCellIndex = null;

        setFeedback("Correct! This cell is now locked.", "success");

        if (correctCount === TOTAL_CELLS) {
            finishGame(true);
        }

        return;
    }

    registerMistake("Incorrect! The player must match both clues.");
}

function registerMistake(message) {
    if (gameOver || gameWon) {
        return;
    }

    mistakeCount++;
    lives = Math.max(0, MAX_LIVES - mistakeCount);

    updateStats();
    hideDropdown();

    const cell = selectedCellIndex !== null
        ? document.getElementById(`cell-${selectedCellIndex}`)
        : null;

    if (cell) {
        cell.classList.add("wrong");

        window.setTimeout(() => {
            cell.classList.remove("wrong");
        }, 350);
    }

    playerInput.value = "";

    if (lives <= 0) {
        finishGame(false);
        return;
    }

    setFeedback(
        `${message} ${lives} ${lives === 1 ? "life" : "lives"} remaining.`,
        "error"
    );
}

// ======================================================
// GAME OVER / GRID COMPLETION
// ======================================================

function finishGame(won) {
    gameOver = !won;
    gameWon = won;

    hideDropdown();
    disableAnswerControls(true);

    document.querySelectorAll(".answer-cell").forEach((cell, index) => {
        cell.classList.remove("selected", "wrong");

        if (won) {
            cell.disabled = true;
            return;
        }

        if (cell.classList.contains("correct")) {
            cell.disabled = true;
            return;
        }

        const answer = solution[index];

        if (answer) {
            cell.textContent = answer.name;
        }

        cell.classList.add("revealed-answer");
        cell.disabled = true;
        cell.setAttribute("aria-disabled", "true");
        cell.title = "Correct answer revealed";
    });

    selectedCellIndex = null;
    completionPanel.hidden = false;

    if (won) {
        completionTitle.textContent = "🏆 Grid Completed!";
        completionMessage.textContent =
            `Excellent! You solved all nine cells with ${mistakeCount} ` +
            `${mistakeCount === 1 ? "mistake" : "mistakes"}.`;

        setFeedback("You won the round!", "success");
    } else {
        completionTitle.textContent = "Grid Lost!";
        completionMessage.textContent =
            `You used all five lives and solved ${correctCount} of 9 cells. ` +
            "The correct answers for the unanswered cells are shown in orange.";

        setFeedback(
            "Game over. The unanswered answers are revealed in orange.",
            "warning"
        );
    }

    updateStats();
}

// ======================================================
// BUTTONS
// ======================================================

submitAnswerButton.addEventListener("click", submitAnswer);
newRoundButton.addEventListener("click", generateRound);
playAgainButton.addEventListener("click", generateRound);

// ======================================================
// LOAD JSON DATA
// ======================================================

async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Could not load ${path} (${response.status})`);
    }

    return response.json();
}

function toArray(data, possibleKeys = []) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === "object") {
        for (const key of possibleKeys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }
    }

    return [];
}

async function initializeGame() {
    try {
        setFeedback("Loading IPL data...");

        const [
            rawPlayers,
            rawPlayerTeams,
            rawAwards,
            rawCaptains,
            rawCenturies,
            rawTeamTitles
        ] = await Promise.all([
            loadJson("./data/players.json"),
            loadJson("./data/player_team.json"),
            loadJson("./data/awards.json"),
            loadJson("./data/captains.json"),
            loadJson("./data/centuries.json"),
            loadJson("./data/team_titles.json")
        ]);

        const basePlayers = toArray(rawPlayers, ["players", "data"]);
        const playerTeams = toArray(rawPlayerTeams, ["player_team", "playerTeams", "data"]);
        playerTeamRecords = playerTeams;
        const awards = toArray(rawAwards, ["awards", "data"]);
        const captains = toArray(rawCaptains, ["captains", "data"]);
        const centuries = toArray(rawCenturies, ["centuries", "data"]);
        const teamTitles = toArray(rawTeamTitles, ["team_titles", "teamTitles", "data"]);

        const byId = new Map(
            basePlayers
                .filter(player => player && player.id != null && player.name)
                .map(player => [
                    String(player.id),
                    {
                        ...player,
                        teams: [],
                        orangeCap: false,
                        purpleCap: false,
                        isCaptain: false,
                        centuryScored: false,
                        isIPLWinner: false,
                        isDomestic:
                            player.country === "India" &&
                            player.isInternational === false
                    }
                ])
        );

        // Player-team history.
        playerTeams.forEach(record => {
            const player = byId.get(String(record.playerId));

            if (player) {
                player.teams = [
                    ...new Set(record.teams || [])
                ];
            }
        });

        // Orange Cap and Purple Cap awards.
        awards.forEach(record => {
            const player = byId.get(String(record.playerId));

            if (!player) return;

            if (record.award === "orange_cap") {
                player.orangeCap = true;
            }

            if (record.award === "purple_cap") {
                player.purpleCap = true;
            }
        });

        // Captains.
        captains.forEach(record => {
            const player = byId.get(String(record.playerId));

            if (player) {
                player.isCaptain = true;
            }
        });

        // IPL centuries.
        centuries.forEach(record => {
            const player = byId.get(String(record.playerId));

            if (player) {
                player.centuryScored =
                    Array.isArray(record.centuries) &&
                    record.centuries.length > 0;
            }
        });

        // Determine players associated with title-winning teams.
        const winningTeams = new Set(
            teamTitles.map(record => String(record.teamId))
        );

        byId.forEach(player => {
            player.isIPLWinner = player.teams.some(teamId =>
                winningTeams.has(String(teamId))
            );
        });

        players = [...byId.values()];

        if (players.length < TOTAL_CELLS) {
            throw new Error(
                "The data files must contain at least nine valid players."
            );
        }

        generateRound();
        initializeGuessGame();
    } catch (error) {
        console.error("Failed to initialize the quiz:", error);

        setFeedback(
            `Could not load the quiz: ${error.message}. ` +
            "Run the project using VS Code Live Server.",
            "error"
        );

        disableAnswerControls(true);
    }
}


// ======================================================
// GAME TABS
// ======================================================

function showGameTab(tab) {
    const showGrid = tab === "grid";
    gridView.hidden = !showGrid;
    guessView.hidden = showGrid;
    gridTab.classList.toggle("active", showGrid);
    guessTab.classList.toggle("active", !showGrid);
    gridTab.setAttribute("aria-selected", String(showGrid));
    guessTab.setAttribute("aria-selected", String(!showGrid));
    newRoundButton.hidden = !showGrid;
}

gridTab.addEventListener("click", () => showGameTab("grid"));
guessTab.addEventListener("click", () => showGameTab("guess"));

// ======================================================
// GUESS PLAYER GAME
// ======================================================

function getTeamName(teamId) {
    return TEAM_NAMES[teamId] || ({
        DCH: "Deccan Chargers",
        KXIP: "Kings XI Punjab",
        KTK: "Kochi Tuskers Kerala"
    })[teamId] || teamId;
}

function getTeamLogo(teamId) {
    return TEAM_LOGOS[teamId] || ({
        DC_HYD: "./assets/teams/DCH.png",
        DCH: "./assets/teams/DCH.png",
        KXIP: "./assets/teams/PBKS.png",
        KTK: "./assets/teams/KTK.png"
    })[teamId] || "";
}

function renderCareerTeams(container, teamIds) {
    container.innerHTML = "";
    teamIds.forEach(teamId => {
        const item = document.createElement("div");
        item.className = "career-team";

        const logoPath = getTeamLogo(teamId);
        if (logoPath) {
            const logo = document.createElement("img");
            logo.src = logoPath;
            logo.alt = "";
            logo.className = "career-team-logo";
            logo.onerror = () => logo.remove();
            item.appendChild(logo);
        }

        const name = document.createElement("span");
        name.textContent = getTeamName(teamId);
        item.appendChild(name);
        container.appendChild(item);
    });
}

function setGuessFeedback(message, type = "") {
    guessFeedbackElement.textContent = message;
    guessFeedbackElement.className = "feedback";
    if (type) guessFeedbackElement.classList.add(type);
}

function hideGuessDropdown() {
    guessPlayerDropdown.hidden = true;
    guessPlayerDropdown.innerHTML = "";
    selectedGuessSuggestionIndex = -1;
}

function disableGuessControls(disabled) {
    guessPlayerInput.disabled = disabled;
    guessSubmitButton.disabled = disabled;
    if (disabled) hideGuessDropdown();
}

function updateGuessStats() {
    guessCountElement.textContent = `${guessAttempts} / ${MAX_LIVES}`;
    revealedCountElement.textContent = String(Math.min(revealedTeamCount, guessTeamHistory.length));
    careerCountElement.textContent = String(guessTeamHistory.length || "—");
}

function renderGuessSuggestions() {
    const query = normalizeName(guessPlayerInput.value);
    guessPlayerDropdown.innerHTML = "";
    selectedGuessSuggestionIndex = -1;

    if (!query || guessGameOver) {
        hideGuessDropdown();
        return;
    }

    const matches = players
        .filter(player => normalizeName(player.name).includes(query))
        .filter(player => !guessedPlayerIds.has(getPlayerId(player)))
        .slice(0, 8);

    if (!matches.length) {
        hideGuessDropdown();
        return;
    }

    matches.forEach(player => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "player-option";
        option.setAttribute("role", "option");
        option.textContent = player.name;
        option.addEventListener("click", () => {
            guessPlayerInput.value = player.name;
            hideGuessDropdown();
            guessSubmitButton.disabled = false;
            guessPlayerInput.focus();
        });
        guessPlayerDropdown.appendChild(option);
    });

    guessPlayerDropdown.hidden = false;
}

function startGuessRound() {
    const eligible = playerTeamRecords
        .map(record => {
            const player = players.find(item => getPlayerId(item) === String(record.playerId));
            const teams = [...new Set((record.teams || []).map(String))];
            return player && teams.length >= 2 ? { player, teams } : null;
        })
        .filter(Boolean);

    if (!eligible.length) {
        setGuessFeedback("No players with at least two IPL teams were found in player_team.json.", "error");
        disableGuessControls(true);
        return;
    }

    const previousId = guessTarget ? getPlayerId(guessTarget) : "";
    let pool = eligible.filter(item => getPlayerId(item.player) !== previousId);
    if (!pool.length) pool = eligible;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    guessTarget = chosen.player;
    guessTeamHistory = chosen.teams;
    revealedTeamCount = Math.min(2, guessTeamHistory.length);
    guessAttempts = 0;
    guessGameOver = false;
    guessWon = false;
    guessedPlayerIds.clear();

    guessPlayerInput.value = "";
    guessResultPanel.hidden = true;
    fullCareerTeamsElement.innerHTML = "";
    renderCareerTeams(careerTeamsElement, guessTeamHistory.slice(0, revealedTeamCount));
    updateGuessStats();
    disableGuessControls(false);
    guessPlayerInput.focus();
    guessSubmitButton.disabled = true;
    setGuessFeedback("Who is the player? Enter a name and submit your guess.");
}

function finishGuessRound(won) {
    guessGameOver = true;
    guessWon = won;
    disableGuessControls(true);
    guessResultPanel.hidden = false;

    if (won) {
        guessResultTitle.textContent = "🏆 Correct Guess!";
        guessResultMessage.textContent =
            `You identified ${guessTarget.name} in ${guessAttempts} ${guessAttempts === 1 ? "guess" : "guesses"}.`;
        setGuessFeedback("Excellent work — you found the player!", "success");
    } else {
        guessResultTitle.textContent = "Out of Guesses";
        guessResultMessage.textContent =
            `The player was ${guessTarget.name}. Here is their complete IPL team history.`;
        setGuessFeedback(`No guesses left. The answer was ${guessTarget.name}.`, "warning");
    }

    renderCareerTeams(fullCareerTeamsElement, guessTeamHistory);
    renderCareerTeams(careerTeamsElement, guessTeamHistory);
    revealedTeamCount = guessTeamHistory.length;
    updateGuessStats();
}

function submitGuess() {
    if (guessGameOver || !guessTarget) return;

    const typedName = guessPlayerInput.value.trim();
    if (!typedName) {
        setGuessFeedback("Enter a player name first.", "error");
        return;
    }

    const player = players.find(item => normalizeName(item.name) === normalizeName(typedName));
    if (!player) {
        setGuessFeedback("Choose a valid player from the suggestions.", "error");
        return;
    }

    const playerId = getPlayerId(player);
    if (guessedPlayerIds.has(playerId)) {
        setGuessFeedback("You already guessed that player. Try someone else.", "error");
        return;
    }

    guessedPlayerIds.add(playerId);
    guessAttempts += 1;
    guessPlayerInput.value = "";
    hideGuessDropdown();

    if (playerId === getPlayerId(guessTarget)) {
        finishGuessRound(true);
        return;
    }

    if (guessAttempts >= MAX_LIVES) {
        finishGuessRound(false);
        return;
    }

    if (revealedTeamCount < guessTeamHistory.length) {
        revealedTeamCount += 1;
    }

    renderCareerTeams(careerTeamsElement, guessTeamHistory.slice(0, revealedTeamCount));
    updateGuessStats();
    const newlyRevealed = Math.min(revealedTeamCount, guessTeamHistory.length);
    setGuessFeedback(
        `That's not correct. ${newlyRevealed < guessTeamHistory.length ? "One more team has been revealed." : "All teams are now revealed."} ${MAX_LIVES - guessAttempts} ${MAX_LIVES - guessAttempts === 1 ? "guess" : "guesses"} remaining.`,
        "error"
    );
    guessSubmitButton.disabled = true;
    guessPlayerInput.focus();
}

function initializeGuessGame() {
    guessPlayerInput.addEventListener("input", () => {
        guessSubmitButton.disabled = !guessPlayerInput.value.trim() || guessGameOver;
        renderGuessSuggestions();
    });

    guessPlayerInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (!guessPlayerDropdown.hidden) {
                const firstOption = guessPlayerDropdown.querySelector(".player-option");
                if (firstOption && !guessPlayerInput.value.trim()) firstOption.click();
                else submitGuess();
            } else {
                submitGuess();
            }
        } else if (event.key === "Escape") {
            hideGuessDropdown();
        }
    });

    guessPlayerInput.addEventListener("blur", () => {
        window.setTimeout(hideGuessDropdown, 120);
    });

    guessSubmitButton.addEventListener("click", submitGuess);
    guessNewRoundButton.addEventListener("click", startGuessRound);
    guessPlayAgainButton.addEventListener("click", startGuessRound);

    startGuessRound();
}


initializeGame();
