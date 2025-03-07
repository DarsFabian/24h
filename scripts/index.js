import { Boid } from "./Boids.js"

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const accueil = document.getElementById("accueil");
const start_button = document.getElementById("startButton");

const canvas_size = 600;
canvas.width = canvas_size;
canvas.height = canvas_size;

/**
 * Defining game parameters and draw rules
 */
const snake_width = 10;
let snake_length = 100;
const head_proportion = (snake_length / 100) * 10;
let non_boids_speed = 1.5;
const boids_number = 10;
const max_turn_angle = Math.PI / 16; // ~5 degrees max turn per frame
let current_direction = Math.PI / 2;

/**
 * Mouse placed at the center when starting game
 */
const center = canvas_size / 2;
let mouse_x = center + 100;
let mouse_y = center + 100;
let prev_mouse_x = mouse_x;
let prev_mouse_y = mouse_y;

let score = 0;
const scoreElement = document.getElementById("score");


/**
 * Game flags
 */
let game_running = false;

/**
 * Game data
 */
let boids = [];
let snake_positions = [];
let level = 1;
let objective;
let ennemy = {
    color: "red",
    position: {
        x: undefined,
        y: undefined
    },
    target_pos: {
        x: undefined,
        y: undefined
    }
}
const compute_objective = () => {
    objective = 100 * level * (level + 5);
}

function isSnakeBody(x, y) {
    return snake_positions.some(segment => segment.x === x && segment.y === y);
}

function astar(start, goal) {
    let openList = [];
    let closedList = new Set();

    openList.push({ pos: start, parent: null, g: 0, h: heuristic(start, goal), f: 0 });

    function heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f);
        let current = openList.shift();

        const distance = Math.hypot(current.pos.x - goal.x, current.pos.y - goal.y);

        if (distance <= non_boids_speed) {
            let path = [];
            while (current) {
                path.push(current.pos);
                current = current.parent;
            }
            return path.reverse();
        }

        closedList.add(`${current.pos.x},${current.pos.y}`);

        let neighbors = [
            { x: current.pos.x + non_boids_speed, y: current.pos.y },
            { x: current.pos.x - non_boids_speed, y: current.pos.y },
            { x: current.pos.x, y: current.pos.y + non_boids_speed },
            { x: current.pos.x, y: current.pos.y - non_boids_speed },
            { x: current.pos.x + non_boids_speed, y: current.pos.y + non_boids_speed },
            { x: current.pos.x - non_boids_speed, y: current.pos.y + non_boids_speed },
            { x: current.pos.x + non_boids_speed, y: current.pos.y - non_boids_speed },
            { x: current.pos.x - non_boids_speed, y: current.pos.y - non_boids_speed }
        ];

        for (let neighbor of neighbors) {
            if (
                neighbor.x < 0 || neighbor.y < 0 ||
                neighbor.x >= canvas_size || neighbor.y >= canvas_size ||
                closedList.has(`${neighbor.x},${neighbor.y}`) ||
                isSnakeBody(neighbor.x, neighbor.y)
            ) {
                continue;
            }

            let g = current.g + (Math.abs(neighbor.x - current.pos.x) + Math.abs(neighbor.y - current.pos.y) === 20 ? 14 : 10);
            let h = heuristic(neighbor, goal);
            let f = g + h;

            openList.push({ pos: neighbor, parent: current, g, h, f });
        }
    }
    return [];
}

canvas.addEventListener("mousemove", event => {
    /**
     * If the game didn't start do nothing
     */
    if (!game_running) return;

    /**
     * Mouse position relative to the canvas' center and set it as the new position
     */
    const rectangle = canvas.getBoundingClientRect();
    const new_mouse_x = event.clientX - rectangle.left;
    const new_mouse_y = event.clientY - rectangle.top;
    prev_mouse_x = mouse_x;
    prev_mouse_y = mouse_y;
    mouse_x = new_mouse_x;
    mouse_y = new_mouse_y;
});

/**
 * Speaks for itself
 */
const create_boids = () => {
    boids = [];
    for (let i = 0; i < boids_number; i++)
        boids.push(new Boid(canvas_size, boids)); // Passer la liste
};

const check_snake_death = () => {
    const snake_head = snake_positions[0];

    for (let i = head_proportion + 1; i < snake_positions.length; i++) {
        const position = snake_positions[i];
        const distance = Math.hypot(snake_head.x - position.x, snake_head.y - position.y);

        if (distance < non_boids_speed) {
            game_running = false;
            score = 0;
            document.getElementById("gameOverScreen").style.display = "block";
        }
    }
};

const update_snake = () => {
    /**
     * If the game doesnt run do nothing
     */
    if (!game_running) return;

    /**
     * Get the current position of the snake's head
     */
    const current_head = snake_positions[0] || { x: center, y: center };

    check_snake_death();

    /**
     * If the head is at the cursor's position do nothing
     */
    if (current_head.x == mouse_x && current_head.y == mouse_y) return;

    /**
     * Distance of head from mouse
     */
    const dx = mouse_x - current_head.x;
    const dy = mouse_y - current_head.y;
    const distance = Math.sqrt((dx ** 2) + (dy ** 2));

    /**
     * Calculate desired direction towards mouse
     */
    let target_angle = Math.atan2(dy, dx);
    let angle_diff = target_angle - current_direction;

    /**
     * Limit turning angle
     */
    angle_diff = ((angle_diff + Math.PI) % (2 * Math.PI)) - Math.PI; // Normalize
    angle_diff = Math.sign(angle_diff) * Math.min(Math.abs(angle_diff), max_turn_angle);
    current_direction += angle_diff;

    /**
     * Move along current direction
     */
    let head_x = current_head.x + Math.cos(current_direction) * non_boids_speed;
    let head_y = current_head.y + Math.sin(current_direction) * non_boids_speed;

    if (head_x < 0 || head_x > canvas_size || head_y < 0 || head_y > canvas_size) {
        console.log("Game Over - Bordure touchée");
        game_running = false;
        document.getElementById("gameOverScreen").style.display = "block";
        return; // Stoppe l'exécution de update_snake()
    }

    /**
     * If close enough, snap the head to the mouse
     */
    if (distance < non_boids_speed) {
        head_x = mouse_x;
        head_y = mouse_y;
        current_direction = Math.atan2(
            head_y - current_head.y,
            head_x - current_head.x
        );
    }

    /**
     * Update snake position
     */
    snake_positions.unshift({ x: head_x, y: head_y });

    /**
     * Keep snake at correct length
     */
    while (snake_positions.length > snake_length)
        snake_positions.pop();
};

const update_ennemy = () => {

}

/**
 * Check if the snake collided with an active boid
 */
const check_boids_collision = () => {
    for (let i = 0; i < boids.length; i++) {
        const boid = boids[i];
        const snake_head = snake_positions[0];

        // Calcul de la distance entre la tête du Snake et le Boid
        let distance = Math.hypot(snake_head.x - boid.x, snake_head.y - boid.y);

        // Si la tête touche le Boid, on le mange
        if (distance < snake_width / 2 + 7) { // 7 étant le rayon du Boid

            if (level <= 3) {
                snake_length += 10; // Augmenter la taille du Snake
            }

            boids.splice(i, 1); // Supprimer le Boid mangé
            boids.push(new Boid(canvas_size, boids)); // Ajouter un nouveau Boid

            // Augmenter le score de 100 et l'afficher
            score += 100;
            scoreElement.textContent = score;

            break; // Sortir de la boucle pour éviter des erreurs d'index
        }
    }
};


const draw = () => {
    context.fillStyle = "#222";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let point of snake_positions) {
        context.fillStyle = `rgb(0, 255, 0)`;
        context.beginPath();
        context.arc(point.x, point.y, snake_width / 2, 0, Math.PI * 2);
        context.fill();
    }

    for (let boid of boids)
        boid.draw(context);

    context.fillStyle = ennemy.color;
    context.beginPath();
    context.arc(
        ennemy.position.x,
        ennemy.position.y,
        snake_width * 1.3, // Twice the snake's width
        0,
        Math.PI * 2
    );
    context.fill();

    console.log("Started pathfinding");
    let path = astar(ennemy.position, snake_positions[0]);
    console.log("Pathfinding ended.");

    context.fillStyle = "blue";
    context.beginPath();
    context.arc(
        path[0].x,
        path[0].y,
        10,
        0,
        Math.PI * 2
    );
    context.fill();
}

const game_loop = () => {
    update_snake();

    check_boids_collision();
    for (let boid of boids)
        boid.update(boids);

    draw();

    if (score == objective) {
        level++;
        compute_objective();
    }

    if (game_running)
        requestAnimationFrame(game_loop);
}



start_button.addEventListener("click", () => {
    game_running = true;
    accueil.style.display = "none";
    canvas.style.display = "block";

    snake_positions = [{
        x: Math.random() * (canvas_size - 200) + 100,
        y: Math.random() * (canvas_size - 200) + 100,
    }];

    const player_pos = snake_positions[0];
    ennemy.position.x = canvas_size - player_pos.x;
    ennemy.position.y = canvas_size - player_pos.y;

    create_boids();
    game_loop();
});

document.getElementById("restartButton").addEventListener("click", () => {
    document.getElementById("gameOverScreen").style.display = "none";
    accueil.style.display = "flex";
    canvas.style.display = "none";
});
