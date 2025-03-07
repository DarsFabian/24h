import { Boid } from "./Boids.js"

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");

const canvasSize = 600;
canvas.width = canvasSize;
canvas.height = canvasSize;

const snakeSize = 10;
let snakeLength = 100;
let positions = [];
let mouseX = canvasSize / 2;
let mouseY = canvasSize / 2;
let lastMouseX = mouseX;
let lastMouseY = mouseY;
let gameRunning = false;

// --- Speed parameters ---
const maxMouseSpeed = 8; // Pixels per frame
const snakeSpeed = 0.5;   // Pixels per frame

// --- BOIDS VARIABLES ---
const numBoids = 10;
let boids = [];

canvas.addEventListener("mousemove", (event) => {
    if (gameRunning) {
        const rect = canvas.getBoundingClientRect();
        let newMouseX = event.clientX - rect.left;
        let newMouseY = event.clientY - rect.top;

        let dx = newMouseX - lastMouseX;
        let dy = newMouseY - lastMouseY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxMouseSpeed) {
            let ratio = maxMouseSpeed / distance;
            newMouseX = lastMouseX + dx * ratio;
            newMouseY = lastMouseY + dy * ratio;
        }

        mouseX = newMouseX;
        mouseY = newMouseY;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
});

// --- Création des boids ---
function createBoids() {
    boids = [];
    for (let i = 0; i < numBoids; i++) {
        boids.push(new Boid(canvasSize));
    }
}

// --- Mise à jour du Snake ---
function updateSnake() {
    if (!gameRunning) return;

    const currentHead = positions[0] || { x: mouseX, y: mouseY };
    let dx = mouseX - currentHead.x;
    let dy = mouseY - currentHead.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let newHeadX, newHeadY;

    if (distance > 0) {
        if (distance > snakeSpeed) {
            const ratio = snakeSpeed / distance;
            newHeadX = currentHead.x + dx * ratio;
            newHeadY = currentHead.y + dy * ratio;
        } else {
            // Snap to mouse position when close
            newHeadX = mouseX;
            newHeadY = mouseY;
        }
    } else {
        newHeadX = currentHead.x;
        newHeadY = currentHead.y;
    }

    positions.unshift({ x: newHeadX, y: newHeadY });

    // Keep snake at correct length
    while (positions.length > snakeLength) {
        positions.pop();
    }
}

// --- Vérification de la collision avec les boids ---
function checkBoidCollision() {
    for (let i = 0; i < boids.length; i++) {
        let dist = Math.hypot(positions[0].x - boids[i].x, positions[0].y - boids[i].y);
        if (dist < 10) {
            snakeLength += 5; // Augmenter la taille du Snake

            // Supprimer l'ancien boid
            boids.splice(i, 1);

            // Ajouter un nouveau boid à une position aléatoire
            let newBoid = new Boid(canvasSize);
            boids.push(newBoid);

            break;
        }
    }
}


// --- Affichage ---
function draw() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner le Snake avec un effet de dégradé
    for (let i = 0; i < positions.length; i++) {
        let alpha = (i / positions.length) * 0.8 + 0.2;
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(positions[i].x, positions[i].y, snakeSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Dessiner les boids
    for (let boid of boids) {
        boid.draw(ctx);
    }
}

function gameLoop() {
    updateSnake();
    checkBoidCollision();

    for (let boid of boids)
        boid.update(boids);

    draw();
    if (gameRunning)
        requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", () => {
    gameRunning = true;
    startButton.style.display = "none";
    canvas.style.display = "block";

    // Initialize the snake with one segment at the mouse's starting position
    positions = [{ x: mouseX, y: mouseY }];

    createBoids();
    gameLoop();
});