class Boid {
    constructor(canvasSize) {
        this.canvasSize = canvasSize;
        this.x = Math.random() * canvasSize;
        this.y = Math.random() * canvasSize;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.maxSpeed = 2;
        this.minSpeed = 0.5; // Évite que le boid s'arrête complètement
        this.viewDistance = 50;
        this.separationDistance = 40;
        this.borderPadding = 10;
    }

    getNeighbors(boids) {
        return boids.filter(boid => {
            if (boid === this) return false;
            let dist = Math.hypot(boid.x - this.x, boid.y - this.y);
            return dist < this.viewDistance;
        });
    }

    cohesion(boids) {
        let neighbors = this.getNeighbors(boids);
        if (neighbors.length === 0) return { x: 0, y: 0 };

        let centerX = 0, centerY = 0;
        for (let boid of neighbors) {
            centerX += boid.x;
            centerY += boid.y;
        }
        centerX /= neighbors.length;
        centerY /= neighbors.length;

        return {
            x: (centerX - this.x) * 0.005,
            y: (centerY - this.y) * 0.005
        };
    }

    separation(boids) {
        let neighbors = this.getNeighbors(boids);
        let moveX = 0, moveY = 0;

        for (let boid of neighbors) {
            let dist = Math.hypot(boid.x - this.x, boid.y - this.y);
            if (dist < this.separationDistance && dist > 0) {
                moveX += (this.x - boid.x) / dist;
                moveY += (this.y - boid.y) / dist;
            }
        }
        return { x: moveX * 0.05, y: moveY * 0.05 };
    }

    alignment(boids) {
        let neighbors = this.getNeighbors(boids);
        if (neighbors.length === 0) return { x: 0, y: 0 };

        let avgVx = 0, avgVy = 0;
        for (let boid of neighbors) {
            avgVx += boid.vx;
            avgVy += boid.vy;
        }
        avgVx /= neighbors.length;
        avgVy /= neighbors.length;

        return {
            x: (avgVx - this.vx) * 0.05,
            y: (avgVy - this.vy) * 0.05
        };
    }

    handleBorderCollision() {
        if (this.x < this.borderPadding) {
            this.vx = Math.abs(this.vx);
        } else if (this.x > this.canvasSize - this.borderPadding) {
            this.vx = -Math.abs(this.vx);
        }
        if (this.y < this.borderPadding) {
            this.vy = Math.abs(this.vy);
        } else if (this.y > this.canvasSize - this.borderPadding) {
            this.vy = -Math.abs(this.vy);
        }
    }

    limitSpeed() {
        let speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        } else if (speed < this.minSpeed) {
            this.vx = (this.vx / speed) * this.minSpeed;
            this.vy = (this.vy / speed) * this.minSpeed;
        }
    }

    update(boids) {
        let cohesionForce = this.cohesion(boids);
        let separationForce = this.separation(boids);
        let alignmentForce = this.alignment(boids);

        this.vx += cohesionForce.x + separationForce.x + alignmentForce.x;
        this.vy += cohesionForce.y + separationForce.y + alignmentForce.y;

        this.limitSpeed();
        this.x += this.vx;
        this.y += this.vy;

        this.handleBorderCollision();
    }

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
        ctx.fill();
    }
}

export { Boid };
