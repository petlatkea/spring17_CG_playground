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

    turnTowards( other ) {
        var dx = other.x - this.x;
        var dy = other.y - this.y;


        if( Math.abs(dx) > Math.abs(dy) ) {
            // move horisontally

            // left or right?
            if( dx < 0 ) {
                this.direction = "left";
                this.rotation = 180;
            } else {
                this.direction = "right";
                this.rotation = 0;
            }


        } else {
            // move vertically

            // up or down?
            if( dy < 0) {
                this.direction = "up";
                this.rotation = -90;
            } else {
                this.direction = "down";
                this.rotation = 90;
            }

        }

    }

}



class Guard extends Enemy {
    constructor() {
        super("guard");

        var thisguard = this;

        var WalkingRight = {
            move: function () {
                if (!thisguard.tryToMove()) {
                    // change state to waiting
                    thisguard.currentState = WaitingRight;
                    console.log("Transition to state WaitingRight");
                    // turn the guard
                    createjs.Tween.get(thisguard).to({
                        rotation: 180
                    }, 200);
                    thisguard.direction = "left";
                }
            }
        }

        var WaitingRight = {
            firsttime: 0,
            move: function () {
                if (this.firsttime == 0) {
                    // this is the first time!
                    this.firsttime = Date.now();
                } else {
                    // we have been called before!

                    // how long time has gone since firsttime
                    if (Date.now() - this.firsttime > 700) {
                        // enough time has passed - go to next state
                        thisguard.currentState = WalkingLeft;
                        console.log("Transition to state WalkingLeft");
                        this.firsttime = 0;
                    }
                }
            }
        }

        // --------

        var WalkingLeft = {
            move: function () {
                if (!thisguard.tryToMove()) {
                    // change state to waiting
                    thisguard.currentState = WaitingLeft;
                    console.log("Transition to state WaitingLeft");
                    // turn the guard
                    createjs.Tween.get(thisguard).to({
                        rotation: 0
                    }, 200);
                    thisguard.direction = "right";
                }
            }
        }

        var WaitingLeft = {
            firsttime: 0,
            move: function () {
                if (this.firsttime == 0) {
                    // this is the first time!
                    this.firsttime = Date.now();
                } else {
                    // we have been called before!

                    // how long time has gone since firsttime
                    if (Date.now() - this.firsttime > 700) {
                        // enough time has passed - go to next state
                        thisguard.currentState = WalkingRight;
                        console.log("Transition to state WalkingRight");
                        this.firsttime = 0;
                    }
                }
            }
        }


        this.currentState = WalkingRight;
        this.direction = "right";
        this.rotation = 0;

        // ------






    }

    move() {
        this.currentState.move();
    }

}

class Chaser extends Enemy {
    constructor() {
        super("chaser");

        var thischaser = this;

        var NewRandomTarget = {
            enterState() {},

            move() {
                var xcord = Math.random()*game.stage.canvas.width;
                var ycord = Math.random()*game.stage.canvas.height;

                var target = {
                    x: xcord,
                    y: ycord
                };

                Searching.target = target;

                // change state
                thischaser.currentState = Searching;
                thischaser.currentState.enterState();
            }

        }


        var Searching = {

            enterState() {
                thischaser.gotoAndPlay("chaser_searching");
                thischaser.speed = 1;
            },

            move() {
                // calculate the distance to the player
                var a = player.x - thischaser.x;
                var b = player.y - thischaser.y;
                var c = Math.sqrt(a * a + b * b);

                if (c < 100) {
                    thischaser.currentState = Chasing;
                    thischaser.currentState.enterState();
                } else {
                    // continue searching

                    // calculate distance to target
                    var dist = Math.hypot(thischaser.x - this.target.x, thischaser.y-this.target.y);

                    thischaser.turnTowards( this.target );

                    // Do searching move ...
                    if(!thischaser.tryToMove() || dist < 10) {
                        // can't move
                        thischaser.currentState = NewRandomTarget;
                        thischaser.currentState.enterState();
                    }

                }
            }
        }

        var Chasing = {

            enterState() {
                thischaser.gotoAndPlay("chaser_chasing");
                thischaser.speed = 2;
            },

            move() {
                // calculate the distance to the player
                var dist = Math.hypot(thischaser.x-player.x, thischaser.y-player.y);

                if( dist > 200 ){
                    // stop chasing, and go searching
                    thischaser.currentState = NewRandomTarget;
                    thischaser.currentState.enterState();
                } else {

                    thischaser.turnTowards( player );

                    // TODO: When the player is at 45 degreees,
                    // the chaser will flip between horiz and vert - Figure out how to solve.

                    // Do searching move ...
                    if (thischaser.tryToMove()) {
                        // moving went okay
                    } else {
                      // can't move ...
                    }

                }
            }
        }


        this.currentState = NewRandomTarget;
        this.currentState.enterState();

    }





    move() {
        this.currentState.move();
    }
}
