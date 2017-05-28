class Player extends createjs.Sprite {
    constructor(spritename) {
        super(game.sprites, spritename);



        this.w = 19;
        this.h = 24;
        this.speed = 3;
        this.items = [];

        this.direction = "left";
    }

    stopMoving() {

    }

    moveDown() {
        this.turn("down");
        this.moveWith(0,this.speed);
    }

    moveUp() {
        this.turn("up");
        this.moveWith(0,-this.speed);
    }

    moveLeft() {
        this.turn("left");
        this.moveWith(-this.speed,0);
    }

    moveRight() {
        this.turn("right");
        this.moveWith(this.speed,0);
    }

    moveInDirection() {
        switch( this.direction ) {
            case "left":
                this.moveWith(-this.speed,0);
                break;
            case "right":
                this.moveWith(this.speed,0);
                break;
            case "down":
                this.moveWith(0,this.speed);
                break;
            case "up":
                this.moveWith(0,-this.speed);
                break;
        }
    }

    turn( direction ) {
        if( this.direction != direction ) {
            let rotation = this.rotation;
            if( direction == "left") {
                rotation = 180;
            } else if(direction == "right") {
                rotation = 0;
            } else if(direction == "down") {
                rotation = 90;
            } else if(direction == "up") {
                rotation = -90;
            }

            if( Math.abs(rotation - this.rotation) > 180 ) {
                rotation = (360-Math.abs(rotation)) * Math.sign(this.rotation);
            }

            createjs.Tween.get(this).to({rotation: rotation}, 200).call( function() {
                if( this.rotation >= 360 ) {
                    this.rotation-= 360;
                }
                if( this.rotation == -180 ) {
                    this.rotation = 180;
                }
            });

            this.direction = direction;
        }
    }

    moveWith( xoffset, yoffset ) {
        if( canMoveTo(this, this.x+xoffset, this.y+yoffset) ) {
            this.x += xoffset;
            this.y += yoffset;
            movedTo( this, this.x, this.y);
            return true;
        } else {
            return false;
        }
    }


    hitBy( opponent ) {
      console.log("Auch, I'm hit");
    }

    pickUp( item ) {
        this.items.push(item);

        console.log("Picked up " + item.type);
        // move outside of stage
        createjs.Tween.get(item)
            .to({x:game.stage.getBounds().width, y:game.stage.getBounds().height}, 1000 )
            .call( function() { game.stage.removeChild(item) });


    }

    getItem( itemName ) {
        return this.items.find( item => item.type == itemName );
    }

}
