import { Boid } from "./Boids.js";
import { updateBeast } from "./RLGame.js"; // Importation de updateBeast depuis RLGame.js

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const accueil = document.getElementById("accueil");
const start_button = document.getElementById("startButton");

const canvas_size = 600;
canvas.width = canvas_size;
canvas.height = canvas_size;

/**
 * 🎮 Paramètres du jeu
 */
const snake_width = 10;
let snake_length = 100;
const head_proportion = (snake_length / 100) * 10;
let non_boids_speed = 2;
const boids_number = 10;
const max_turn_angle = Math.PI / 16;
let current_direction = Math.PI / 2;

/**
 * 🎯 Position initiale de la souris
 */
const center = canvas_size / 2;
let mouse_x = center + 100;
let mouse_y = center + 100;
let prev_mouse_x = mouse_x;
let prev_mouse_y = mouse_y;

let score = 0;
const scoreElement = document.getElementById("score");

/**
 * 🏁 Variables globales
 */
let game_running = false;
let enemy_speed = 1;
const historySize = 10;

let boids = [];
let snake_positions = [];
let level = 1;
let objective;
let ennemy = {
    color: "red",
    position: { x: undefined, y: undefined }
};

const compute_objective = () => {
    objective = 100 * level * (level + 5);
};

/**
 * 🏃‍♂️ Mise à jour de l'ennemi selon le score
 */
const update_ennemy = () => {
    if (!game_running) return;

    if (score < 1000) {
        ennemy.position.x = -100;
        ennemy.position.y = -100;
        return;
    }

    let targetPos;

    if (score < 2000) {
        // 🔵 Suivi avec A*
        let path = astar(ennemy.position, snake_positions[0]);
        if (path.length > 1) {
            targetPos = path[1];
        } else {
            console.warn("⚠️ A* n'a trouvé aucun chemin !");
            return;
        }
    } else if (score < 3000) {
        // 🟢 Prédiction de la future position du Snake
        targetPos = predictSnakeFuturePosition();
        console.log("🔮 L'ennemi anticipe :", targetPos);
        let path = astar(ennemy.position, targetPos);
        if (path.length > 1) {
            targetPos = path[1];
        } else {
            console.warn("⚠️ A* n'a trouvé aucun chemin !");
            return;
        }
    } else {
        // 🔥 Mode RL - L'ennemi suit `updateBeast()`
        console.log("🧠 Mode RL activé ! L'ennemi utilise Q-Learning...");
        updateBeast();
        ennemy.position.x = beast.x;
        ennemy.position.y = beast.y;
        return;
    }

    // 🔁 Déplacement progressif vers la cible
    let dx = targetPos.x - ennemy.position.x;
    let dy = targetPos.y - ennemy.position.y;
    let distance = Math.hypot(dx, dy);

    if (distance > enemy_speed) {
        ennemy.position.x += (dx / distance) * enemy_speed;
        ennemy.position.y += (dy / distance) * enemy_speed;
    } else {
        ennemy.position.x = targetPos.x;
        ennemy.position.y = targetPos.y;
    }

    // 🔥 Vérifier si l'ennemi touche le Snake (Game Over)
    let snake_head = snake_positions[0];
    let dist_to_head = Math.hypot(ennemy.position.x - snake_head.x, ennemy.position.y - snake_head.y);

    if (dist_to_head < snake_width) {
        console.log("💀 L'ennemi a touché le Snake ! GAME OVER");
        game_running = false;
        document.getElementById("gameOverScreen").style.display = "block";
    }
};

/**
 * 🏃‍♂️ Boucle principale du jeu
 */
const game_loop = () => {
    if (!game_running) return;

    update_snake();
    update_ennemy();

    check_boids_collision();
    for (let boid of boids) {
        boid.update(boids);
    }

    draw();

    if (score === objective) {
        level++;
        compute_objective();
    }

    if (game_running) {
        requestAnimationFrame(game_loop);
    }
};

/**
 * 🕹️ Démarrer le jeu
 */
start_button.addEventListener("click", () => {
    game_running = true;
    accueil.style.display = "none";
    canvas.style.display = "block";

    score = 0;
    snake_positions = [{ 
        x: Math.random() * (canvas_size - 200) + 100, 
        y: Math.random() * (canvas_size - 200) + 100 
    }];

    ennemy.position.x = canvas_size - snake_positions[0].x;
    ennemy.position.y = canvas_size - snake_positions[0].y;

    create_boids();
    game_loop();
});

/**
 * 🔄 Redémarrer le jeu
 */
document.getElementById("restartButton").addEventListener("click", () => {
    document.getElementById("gameOverScreen").style.display = "none";
    accueil.style.display = "flex";
    canvas.style.display = "none";
});
