import { Boid } from "./Boids.js"

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const start_button = document.getElementById("startButton");

const canvas_size = 600;
canvas.width = canvas_size;
canvas.height = canvas_size;

/**
 * Defining game parameters and draw rules
 */
const snake_width = 10;
let snake_length = 300;
const head_proportion = (snake_length / 100) * 10;
let non_boids_speed = 0.5;
const boids_number = 10;
const max_turn_angle = Math.PI / 80; // ~5 degrees max turn per frame
let current_direction = Math.PI / 2;

/**
 * Mouse placed at the center when starting game
 */
const center = canvas_size / 2;
let mouse_x = center + 100;
let mouse_y = center + 100;
let prev_mouse_x = mouse_x;
let prev_mouse_y = mouse_y;

/**
 * Game flags
 */
let game_running = false;

/**
 * Game data
 */
let boids = [];
let snake_positions = [];

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
        boids.push(new Boid(canvas_size));
}

const check_snake_death = () => {
    const snake_head = snake_positions[0];

    for (let i = head_proportion + 1; i < snake_positions.length; i++) {
        const position = snake_positions[i];
        const distance = Math.hypot(snake_head.x - position.x, snake_head.y - position.y);

        if (distance < non_boids_speed) {
            console.log("Game over");
            game_running = false;
        }
    }
}

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

/**
 * Check if the snake collided with an active boid
 */
const check_boids_collision = () => {
    for (let i = 0; i < boids.length; i++) {

        const boid = boids[i];
        const snake_head = snake_positions[0];

        let distance = Math.hypot(snake_head.x - boid.x, snake_head.y - boid.y);

        if (distance < non_boids_speed) {
            snake_length += 5;
            boids.splice(i, 1);
            boids.push(new Boid());
            break;
        }
    }
}

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
}

const game_loop = () => {
    update_snake();

    check_boids_collision();
    for (let boid of boids)
        boid.update(boids);

    draw();

    if (game_running)
        requestAnimationFrame(game_loop);
}

start_button.addEventListener("click", () => {
    game_running = true;
    start_button.style.display = "none";
    canvas.style.display = "block";

    snake_positions = [{
        x: mouse_x,
        y: mouse_y
    }];

    create_boids();
    game_loop();
});