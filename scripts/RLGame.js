const fs = require("fs"); // Module pour la gestion des fichiers JSON

// 📌 Paramètres de l'algorithme RL
let gridSize = 600; // Taille de la grille (ajustée pour correspondre au jeu)
let QTable = {}; // Stockage de la Q-Table
let epsilon = 0.05; // Probabilité d'exploration (faible car on utilise un modèle entraîné)
const alpha = 0.1; // Taux d'apprentissage
const gamma = 0.9; // Facteur d'actualisation des récompenses
const saveInterval = 10; // Sauvegarde tous les X mouvements

// 🐍 Positions initiales de la bête et du serpent
let beast = { x: 50, y: 50 };
let snake = { x: 300, y: 300 };
let pastSnakePositions = [];
const historySize = 10;

// 🔀 Actions possibles (déplacements)
const actions = [
    { dx: 10, dy: 0 }, { dx: -10, dy: 0 }, { dx: 0, dy: 10 }, { dx: 0, dy: -10 },
    { dx: 10, dy: 10 }, { dx: -10, dy: 10 }, { dx: 10, dy: -10 }, { dx: -10, dy: -10 }
];

// ⏳ Gestion du temps (évite que l'algorithme tourne trop vite)
let timeStep = 0;

/**
 * 📂 Charger la Q-Table depuis un fichier JSON
 */
function loadQTableFromFile(filename = "q_table.json") {
    if (!fs.existsSync(filename)) {
        console.warn(`⚠️ Aucune Q-Table trouvée (${filename}), initialisation vide.`);
        return;
    }
    try {
        const data = fs.readFileSync(filename, "utf-8");
        QTable = JSON.parse(data);
        console.log(`📂 Q-Table chargée (${Object.keys(QTable).length} entrées).`);
    } catch (error) {
        console.error("❌ Erreur lors du chargement de la Q-Table :", error);
    }
}

/**
 * 💾 Sauvegarder la Q-Table dans un fichier JSON
 */
function saveQTableToFile(filename = "q_table.json") {
    fs.writeFileSync(filename, JSON.stringify(QTable, null, 2), "utf-8");
    console.log(`💾 Q-Table sauvegardée (${filename})`);
}

/**
 * 🎯 Obtenir l'état actuel de la bête et du serpent
 */
function getCurrentState() {
    if (!beast || !snake) return "0,0,0,0";
    return `${beast.x},${beast.y},${snake.x},${snake.y}`;
}

/**
 * 🔀 Choisir la meilleure action pour la bête
 */
function chooseBestAction(state) {
    if (!QTable[state] || Math.random() < epsilon) {
        return actions[Math.floor(Math.random() * actions.length)]; // Exploration aléatoire
    }

    let bestAction = actions[0];
    let bestValue = -Infinity;

    actions.forEach(action => {
        let key = `${state}-${action.dx}-${action.dy}`;
        if (QTable[key] && QTable[key] > bestValue) {
            bestValue = QTable[key];
            bestAction = action;
        }
    });

    return bestAction;
}

/**
 * 🧠 Mettre à jour la position de la bête en utilisant RL
 */
function updateBeast() {
    if (timeStep % 2 !== 0) return; // 🕰️ Éviter que la bête se mette à jour trop souvent
    timeStep++;

    let state = getCurrentState();
    let action = chooseBestAction(state);
    let newBeast = {
        x: Math.max(0, Math.min(beast.x + action.dx, gridSize - 1)),
        y: Math.max(0, Math.min(beast.y + action.dy, gridSize - 1))
    };

    let predictedSnake = predictSnakeFuturePosition();
    let escapePaths = countEscapePaths(snake);
    let reward = getReward(beast, newBeast, snake, predictedSnake, escapePaths);

    let newState = `${newBeast.x},${newBeast.y},${snake.x},${snake.y}`;

    updateQTable(state, action, reward, newState); // Mise à jour de la Q-Table
    beast = newBeast; // Mise à jour de la position

    console.log(`🐍 La bête a bougé vers : (${beast.x}, ${beast.y})`);
}

/**
 * 📊 Mise à jour de la Q-Table avec les nouvelles valeurs
 */
function updateQTable(state, action, reward, newState) {
    let key = `${state}-${action.dx}-${action.dy}`;
    if (!QTable[key]) QTable[key] = Math.random() * 0.01; // Initialisation aléatoire si non défini

    let futureQ = Math.max(...actions.map(a => QTable[`${newState}-${a.dx}-${a.dy}`] || 0));

    let oldValue = QTable[key];
    QTable[key] = (1 - alpha) * QTable[key] + alpha * (reward + gamma * futureQ);

    if (QTable[key] !== oldValue) {
        saveQTableToFile(); // Sauvegarde immédiate si une modification a eu lieu
    }
}

/**
 * 🎮 Lancer la simulation du jeu avec RL
 */
function runGame(iterations = 100) {
    loadQTableFromFile();

    for (let i = 0; i < iterations; i++) {
        console.log(`🎮 Tour ${i + 1} -----------------------------------`);

        updateSnake();  // Déplacement du serpent
        updateBeast();  // Déplacement de la bête via RL

        let predictedSnake = predictSnakeFuturePosition();
        console.log(`🔮 Prédiction de la position du Snake : (${predictedSnake.x}, ${predictedSnake.y})`);

        if (Math.abs(beast.x - snake.x) <= 10 && Math.abs(beast.y - snake.y) <= 10) {
            console.log("🔥 La bête a attrapé le Snake ! GAME OVER !");
            break;
        }
    }

    console.log("💾 Sauvegarde finale de la Q-Table !");
}

runGame(100); // Exécute le jeu pour 100 tours
