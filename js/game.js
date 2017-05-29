window.addEventListener('load', pageLoaded);

var game = {
    playing: false,
    running: false,
    stage: null,
    q: null
};

var tiles = null;
var player = null;
var enemies = null;
var items = null;

function pageLoaded() {
    createStage();

    createPreloader();
}

/* PRELOADER */

function createPreloader() {
    game.q = new createjs.LoadQueue(true);

    // TODO: Progress

    game.q.on("complete", gameLoaded);

    game.q.loadManifest([
        "js/player.js",
        {id:"tiles", src: "tiles-01.png"},
        {id:"sprites", src: "sprites-01.png"},
        {id:"levels", src: "levels.json"}
    ]);

}

// TODO: PRELOAD PROGRESS


function gameLoaded() {
    console.log("Everything is loaded");

    // build levels
    // - for now, just use game.q.levels
    game.levels = game.q.getResult("levels");

    // prepare tiles
    game.tiles = new createjs.SpriteSheet( {
        "images": [game.q.getResult("tiles")],
        "frames": {"width":64, "height":64, "regX": 0, "regY":0},
         "animations": {
            "space":[0],
            "floor":[1],
            "bluedoor_closed": [23],
            "bluedoor_opened": [27],
            "bluedoor_open": [23,27,"bluedoor_opened"],
            "reddoor_closed": [33],
            "reddoor_opened": [37],
            "reddoor_open": [33,37,"reddoor_opened"]
        },
        "framerate": 5
    });


    // prepare sprites
    game.sprites = new createjs.SpriteSheet( {
        "images": [game.q.getResult("sprites")],
        "frames": {"width":32, "height":32, "regX": 16, "regY":16},
        "animations": {
            "p_stopped": [0],
            "p_move": [0,2],
            "guard": [10],
            "hunter": [20],
            "patroller": [30],
            "traveller": [31],
            "chaser": [21],
            "sentry":[22],
            "key": [11],
            "shot_double": [1],
            "shot_single": [2]
        },
        "framerate": 10
    });


    initGame();
}

function initGame() {
    // register keyboard
    window.addEventListener("keydown", keyPressed);
    window.addEventListener("keyup", keyReleased);

    game.level = 0;

    createPlayer();

    startGame();
}

/* keys */

var keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};


function keyPressed( event ) {
//    console.log("keypressed: ", event);
    if( event.key == "ArrowRight" ) {
        keys.right = true;
        event.preventDefault();
    } else if( event.key == "ArrowLeft" ) {
        keys.left = true;
        event.preventDefault();
    } else if( event.key == "ArrowUp" ) {
        keys.up = true;
        event.preventDefault();
    } else if( event.key == "ArrowDown" ) {
        keys.down = true;
        event.preventDefault();
    } else if( event.key == " ") {
        keys.space = true;
        event.preventDefault();
    }
}

function keyReleased( event ) {
//    console.log("keyreleased: ", event);
    if( event.key == "ArrowRight" ) {
        keys.right = false;
        event.preventDefault();
    } else if( event.key == "ArrowLeft" ) {
        keys.left = false;
        event.preventDefault();
    } else if( event.key == "ArrowUp" ) {
        keys.up = false;
        event.preventDefault();
    } else if( event.key == "ArrowDown" ) {
        keys.down = false;
        event.preventDefault();
    } else if( event.key == " ") {
        keys.space = false;
        event.preventDefault();
    }
}

function createStage() {
    game.stage = new createjs.Stage("canvas");

    let canvas = document.querySelector("#canvas");
    game.stage.width = canvas.width;
    game.stage.height = canvas.height;

    createjs.Ticker.setFPS(60);
    createjs.Ticker.on("tick", ticker);
}


function createPlayer() {
    player = new Player("p_stopped");
}



function startGame() {
    buildLevel( game.level );

    game.stage.addChild( player);
    game.playing = true;
}

function levelCompleted() {
    console.log("LEVEL COMPLETED");
    game.playing = false;
    // TODO: Goto next level
    game.level++;
    game.stage.removeAllChildren();

    startGame();
}

function buildLevel( level ) {
    createTiles( level );
    createEnemies( level );
    createItems( level );

    setPlayerStart( level );
}

function setPlayerStart( level ) {
    // For now, position the player at the first Entry found in the map
    // TODO: Look for an entry-object in the tiles instead
    let map = game.levels[level].map
    for( let y=0; y < map.length; y++) {
        for( let x=0; x < map[y].length; x++ ) {
            if( map[y][x] == 8 ) {
                player.x = x*64+38 + player.w/2;
                player.y = y*64+17 + player.h/2;
                break;
            }
        }
    }
}

function createTiles( level ) {
    tiles = [];

    let map = game.levels[level].map;

    for( let y=0; y < map.length; y++) {
        tiles[y] = [];
        for( let x=0; x < map[y].length; x++ ) {

            let type = map[y][x];

            let tile = new createjs.Sprite(game.tiles, type);
            tile.type = type;
            tile.gotoAndStop(type);
            tile.gridX = x;
            tile.gridY = y;

            tile.x = x * 64;
            tile.y = y * 64;

            tiles[y][x] = tile;

            game.stage.addChild(tile);
        }
    }
}



function createEnemies( level ) {
    let enemylist = game.levels[level].enemies;

    enemies = [];

    if( enemylist ) {
        enemylist.forEach( data => {
            let enemy = createEnemy(data);
            game.stage.addChild(enemy);
            enemies.push( enemy );
        });
    }
}



function createEnemy( data ) {
    var enemy = null;

    switch( data.type ) {
        case "guard":
            enemy = new Enemy("guard");
            enemy.setOffset(data.offset);
            enemy.setGridPosition(data.grid.x, data.grid.y);
            break;

        case "chaser":
            enemy = new Enemy("chaser");
            enemy.setOffset(data.offset);
            enemy.setGridPosition(data.grid.x, data.grid.y);
            break;
    }

    return enemy;
}


class Enemy extends createjs.Sprite {
    constructor( spritename ) {
        super( game.sprites, spritename);
        this.type=spritename;
        this.w = 16;
        this.h = 24;

        this.speed = 1;
        this.direction = "left";
    }

    setOffset(offset) {
        this.offset = offset;
    }

    setGridPosition(gridx, gridy) {
        this.x = gridx*64 + this.offset.x + this.w/2;
        this.y = gridy*64 + this.offset.y + this.h/2;
    }

    move() {
        let dx = 0;
        let dy =0;

        switch( this.direction ) {
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

        if( canMoveTo( this, this.x+dx, this.y+dy ) ) {
            this.x += dx;
            this.y += dy;

            // TODO: react after move ...
        } else {
            // can't move - if this is a guard, then change direction
            if( this.type == "guard" ) {
                if( this.direction == "left" ) {
                    this.direction = "right";
                } else {
                    this.direction = "left";
                }
            } else if( this.type == "chaser") {
                let directions = ["left", "right", "up", "down"];
                // remove existing direction from list
                directions.filter( dir => dir != this.direction);
                // find new random direction
                this.direction = directions[ Math.floor(Math.random()*directions.length)];
            }
        }

    }

}




function createItems( level ) {
    items = [];

    let itemlist = game.levels[level].items;
    if( itemlist ) {
        itemlist.forEach( data => {
            var item = null;

            switch( data.type ) {
                case "key":
                    item = new createjs.Sprite(game.sprites,"key");
                    item.type = "key";
                    item.h = 15;
                    item.w = 17;
                    break;
                              }

            item.x = data.grid.x*64 + data.offset.x + item.w/2;
            item.y = data.grid.y*64 + data.offset.y + item.h/2;

            game.stage.addChild( item );
            items.push(item);

        } );
    }
}


function getTileAtPixels( xpos, ypos ) {
    x = Math.floor(x/64);
    y = Math.floor(y/64);

    return getTileAt(x,y);
}

function getTileAt( x, y ) {
    return tiles[y][x];
}


function canWalkOnTile(object, xpos, ypos ) {
    let gridx = Math.floor(xpos/64);
    let gridy = Math.floor(ypos/64);

    let tile = getTileAt(gridx,gridy);
    let tileX = xpos - gridx * 64;
    let tileY = ypos - gridy * 64;


    let canwalk = false;

    if(!tile) {
        return false;
    }

     switch(tile.type) {
        // plain floor
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        case 14:
        case 15:
        case 16:
        case 17: canwalk = true;
                 break;
        // plain walls
        case 10:
        case 11:
        case 12:
        case 20:
        case 21:
        case 22:
        case 30:
        case 31:
        case 32:
        case 40:
        case 41:
        case 42:
        case 50:
        case 51:
        case 52: canwalk = false;
            break;
        // doors
        // doors - only partly walkable (requires relative x and y pos)
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:canwalk = true;
             break;

        case 33: // walkable if player has a key
             if( player.getItem("key") ) {
                 canwalk = true;
             }
             break
        case 34:
        case 35:
        case 36:
        case 37:
        case 38: canwalk = true;
            break;
                }

    return canwalk;

}

/* return if the given position is valid for the object */
function canMoveTo( object, xpos, ypos ) {
    let validposition = true;

    // find the list of tile-coordinates that the object touches (from the given position)
    // top left
    let top = ypos-object.h/2;
    let left = xpos-object.w/2;
    let bot = ypos+object.h/2;
    let right = xpos+object.w/2;

    // find tile at x, y
    // add Relative x and y for tiles that can be partly walked on
    validposition = canWalkOnTile(object,left, top) && canWalkOnTile(object,left, bot) &&
                    canWalkOnTile(object,right, top) && canWalkOnTile(object,right, bot);

    return validposition;
}

/* called after an object has been moved - takes care of what happens then */
function movedTo(object, xpos, ypos) {
    let top = ypos-object.h/2;
    let left = xpos-object.w/2;
    let bot = ypos+object.h/2;
    let right = xpos+object.w/2;

    walkOnTile(object,left,top);
    walkOnTile(object,left,bot);
    walkOnTile(object,right,top);
    walkOnTile(object,right,bot);
}

function walkOnTile(object,xpos,ypos) {
    let gridx = Math.floor(xpos/64);
    let gridy = Math.floor(ypos/64);

    let tile = getTileAt(gridx,gridy);
    let tileX = xpos - gridx * 64;
    let tileY = ypos - gridy * 64;

    if( tile ) {
        switch(tile.type) {
            case 9:
                levelCompleted();
                break;
            case 33: // TODO: Open door
                break;
            default:
                // nothing else happens
                        }
    }
}

function hitTest( objA, objB ) {
    if( objB.x-objB.regX < objA.x-objA.regX+objA.w &&
        objB.x-objB.regX+objB.w > objA.x-objA.regX &&
        objB.y-objB.regY+objB.h > objA.y-objA.regY &&
        objB.y-objB.regY < objA.y-objA.regY+objA.h ) {
        return true;
    } else {
        return false;
    }
}


function ticker( event ) {

    if( game.playing ) {

        if( player ) {
            // move player
            if( keys.left ) {
                player.moveLeft();
            } else if( keys.right ) {
                player.moveRight();
            } else

            if( keys.up ) {
                player.moveUp();
            } else if( keys.down ) {
                player.moveDown();
            } else {
                // no movement at all
                player.stopMoving();
            }
        }

        if( enemies ) {
            // move enemies, and test for collisions
            enemies.forEach( enemy => {
                enemy.move();

                // test collision with player
                if( hitTest( enemy, player) ) {
                    player.hitBy( enemy );
                }
            });
        }

        if( items ) {
            // check if touching any item
            items.forEach( item => {
                if( hitTest(player, item) ) {
                    player.pickUp( item );
                }
            })
        }

    }

    // update stage
    game.stage.update( event );
}
