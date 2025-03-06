class Boid {
    constructor(canvasSize) {

        this.canvasSize = canvasSize;

        this.x = Math.random() * canvasSize;
        this.y = Math.random() * canvasSize;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.maxSpeed = 2;
    }

    // Règle de cohésion : Se rapprocher du centre des voisins
    cohesion(boids) {
        let centerX = 0, centerY = 0, count = 0;
        for (let boid of boids) {
            if (boid !== this) {
                centerX += boid.x;
                centerY += boid.y;
                count++;
            }
        }
        if (count > 0) {
            centerX /= count;
            centerY /= count;
            this.vx += (centerX - this.x) * 0.005;
            this.vy += (centerY - this.y) * 0.005;
        }
    }

    // Règle de séparation : Éviter les collisions avec les voisins
    separation(boids) {
        let avoidX = 0, avoidY = 0;
        for (let boid of boids) {
            if (boid !== this) {
                let dist = Math.hypot(this.x - boid.x, this.y - boid.y);
                if (dist < 20) { // Distance minimale
                    avoidX += this.x - boid.x;
                    avoidY += this.y - boid.y;
                }
            }
        }
        this.vx += avoidX * 0.02;
        this.vy += avoidY * 0.02;
    }

    // Règle d'alignement : Suivre la direction moyenne des voisins
    alignment(boids) {
        let avgVx = 0, avgVy = 0, count = 0;
        for (let boid of boids) {
            if (boid !== this) {
                avgVx += boid.vx;
                avgVy += boid.vy;
                count++;
            }
        }
        if (count > 0) {
            avgVx /= count;
            avgVy /= count;
            this.vx += (avgVx - this.vx) * 0.05;
            this.vy += (avgVy - this.vy) * 0.05;
        }
    }

    // Mise à jour du boid
    update(boids) {
        this.cohesion(boids);
        this.separation(boids);
        this.alignment(boids);

        let speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Bordures écran
        if (this.x < 0) this.x = this.canvasSize;
        if (this.x > this.canvasSize) this.x = 0;
        if (this.y < 0) this.y = this.canvasSize;
        if (this.y > this.canvasSize) this.y = 0;
    }

    // Affichage du boid
    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

export { Boid }