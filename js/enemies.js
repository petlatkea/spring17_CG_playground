function createEnemy(data) {
    var enemy = null;

    switch (data.type) {
        case "guard":
            enemy = new Guard();
            enemy.setOffset(data.offset);
            enemy.setGridPosition(data.grid.x, data.grid.y);
            break;

        case "chaser":
            enemy = new Chaser();
            enemy.setOffset(data.offset);
            enemy.setGridPosition(data.grid.x, data.grid.y);
            break;
    }

    return enemy;
}


class Enemy extends createjs.Sprite {
    constructor(spritename) {
        super(game.sprites, spritename);
        this.type = spritename;
        this.w = 16;
        this.h = 24;

        this.speed = 1;
        this.direction = "left";
    }

    setOffset(offset) {
        this.offset = offset;
    }

    setGridPosition(gridx, gridy) {
        this.x = gridx * 64 + this.offset.x + this.w / 2;
        this.y = gridy * 64 + this.offset.y + this.h / 2;
    }

    tryToMove() {
        let dx = 0;
        let dy = 0;

        switch (this.direction) {
            case "left":
                dx = -this.speed;
                dy = 0;
                break;
            case "right":
                dx = this.speed;
                dy = 0;
                break;
            case "up":
                dx = 0;
                dy = -this.speed;
                break;
            case "down":
                dx = 0;
                dy = this.speed;
                break;
        }

        if (canMoveTo(this, this.x + dx, this.y + dy)) {
            this.x += dx;
            this.y += dy;

            return true;
        } else {
            return false;
        }
    }
}



class Guard extends Enemy {
    constructor() {
        super("guard");
    }

    move() {
        if (this.tryToMove()) {
            // moving went okay
        } else {
            // can't move that way
            if (this.direction == "left") {
                this.direction = "right";
            } else {
                this.direction = "left";
            }
        }
    }
}

class Chaser extends Enemy {
    constructor() {
        super("chaser");
    }

    move() {
        if (this.tryToMove()) {
            // moving went okay
        } else {
            // can't move that way
            let directions = ["left", "right", "up", "down"];
            // remove existing direction from list
            directions.filter(dir => dir != this.direction);
            // find new random direction
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }
}
