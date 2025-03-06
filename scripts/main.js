import { Boid } from "./Boids.js"


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");

const canvasSize = 600;
canvas.width = canvasSize;
canvas.height = canvasSize;

const snakeSize = 10;
let snakeLength = 20;
let positions = [];
let mouseX = canvasSize / 2;
let mouseY = canvasSize / 2;
let lastMouseX = mouseX;
let lastMouseY = mouseY;
let gameRunning = false;

// --- Limitation de vitesse ---
const maxMouseSpeed = 8; // Vitesse max en pixels par frame

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

// --- Interpolation fluide ---
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

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

    let newHeadX = lerp(positions.length > 0 ? positions[0].x : mouseX, mouseX, 0.2);
    let newHeadY = lerp(positions.length > 0 ? positions[0].y : mouseY, mouseY, 0.2);
    positions.unshift({ x: newHeadX, y: newHeadY });

    while (positions.length > snakeLength) {
        positions.pop();
    }
}

// --- Vérification de la collision avec les boids ---
function checkBoidCollision() {
    for (let i = 0; i < boids.length; i++) {
        let dist = Math.hypot(positions[0].x - boids[i].x, positions[0].y - boids[i].y);
        if (dist < 10) {
            snakeLength += 5;
            boids.splice(i, 1);
            boids.push(new Boid());
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

// --- Démarrer le jeu ---
startButton.addEventListener("click", () => {
    gameRunning = true;
    startButton.style.display = "none";
    canvas.style.display = "block";
    createBoids();
    gameLoop();
});