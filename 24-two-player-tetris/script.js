Array.prototype.shuffle = function(){
	o = this;
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
function random(min, max, step){
	if(max === undefined){
		max = min;
		min = 0;
	}
	if(step === undefined)step = 1;
	return Math.round(Math.random()*(max-min))+min;
}
function coin(){
	return random(1) === 0;
}
function findFallSpeed(level){
	return 60-(level-1)*8
}
function findGoal(level){
	return 4*level;
}
function makeGarbage(map){
	map.shift();
	var garbage = [];
	for(var i = 0; i < mapWidth; i ++)garbage.push(8);
	garbage[random(garbage.length-1)] = 0;
	map.push(garbage);
}
function opponent(player){
	if(player.name === 'player1')return p2;
	if(player.name === 'player2')return p1;
}

function Player(id, playing, testing){
	if(playing === undefined)playing = false;
	if(testing === undefined)testing = false;
	this.score = 0;
	this.displayScore = 0;
	this.level = defaults.level;
	this.lines = 0;
	this.goal = findGoal(this.level);
	this.map = [];
	this.bag = [];
	this.bag.list = [];
	this.bag.initialized = false;
	this.held = undefined;
	this.canHold = true;
	this.name = 'player'+id;
	this.playing = playing;
	this.testing = testing;
	this.wins = 0;
	this.blink = true;
	this.blinkTimer = 0;
	this.blinkLimit = 30;
	this.garbage = 0;
	this.startGarbage = 4;
	this.ai = true;
	this.dead = false;
	this.deadTimer = 0;
	this.deadLimit = 0;
	this.idle = false;
	this.idleTimer = 0;
	this.idleLimit = 60;
	for(var i = 0; i < mapHeight; i ++){
		this.map.push([]);
		for(var j = 0; j < mapWidth; j ++){
			this.map[i][j] = 0;
		}
	}
	for(var i = 0; i < this.startGarbage; i ++)makeGarbage(this.map);
	this.killTile = function(){
		var x;
		var y;
		var clear = true;
		for(var i = 0; i < mapHeight; i ++){
			for(var j = 0; j < mapWidth; j ++){
				if(this.map[i][j] !== 0)clear = false;
			}
		}
		if(clear){
			this.dead = false;
			this.idle = true;
			return;
		}
		do {
			x = random(0, mapWidth-1);
			y = random(0, mapHeight-1);
		} while(this.map[y][x] === 0);
		this.map[y][x] = 0;
		if(this.name === 'player1')new Sprite(blockDestruction, (x-5)*blockSize, (y+6)*blockSize, blockSize, blockSize);
		if(this.name === 'player2')new Sprite(blockDestruction, (x+15)*blockSize, (y+6)*blockSize, blockSize, blockSize);
		display.flip();
	}
	this.reset = function(){
		for(var i = 0; i < mapHeight; i ++){
			for(var j = 0; j < mapWidth; j ++){
				this.map[i][j] = 0;
			}
		}
		this.idle = false;
		this.dead = false;
		this.held = undefined;
		this.fallDelayMax = findFallSpeed(this.level);
		this.garbage = 0;
		this.score = 0;
		this.displayScore = 0;
		this.level = defaults.level;
		this.lines = 0;
		this.goal  = findGoal(this.level);
		for(var i = 0; i < this.startGarbage; i ++)makeGarbage(this.map);
		bag.init(this);
		bag.draw(this);
		wasDown['left'] = false;
		wasDown['right']= false;
		wasDown['up']   = false;
		wasDown['down'] = false;
		wasDown['w'] = false;
		wasDown['a']= false;
		wasDown['s']   = false;
		wasDown['d'] = false;
		wasDown['space'] = false;
		wasDown['enter'] = false;
		this.canHold = true;
		display.flip();
	}
	this.update = function(){
		this.blinkTimer ++;
		if(this.blinkTimer >= this.blinkLimit){
			if(this.blink)this.blink = false;
			else this.blink = true;
			display.flip();
			this.blinkTimer = 0;
		}
		if(this.playing){
			if(this.idle){
				this.idleTimer ++;
				if(this.idleTimer >= this.idleLimit){
					this.idleTimer = 0;
					this.idle = false;
					if(!this.ai)this.playing = false;
					else this.reset();
				}
			}
			if(this.dead){
				this.deadTimer ++;
				if(this.deadTimer >= this.deadLimit){
					this.deadTimer = 0;
					this.killTile();
					this.killTile();
					this.killTile();
					this.killTile();
					this.killTile();
					this.killTile();
					this.killTile();
					this.killTile();
				}
			}
			if(!this.dead && !this.idle){
				if(this.shape.ai){
					this.shape.aiTimer ++;
					if(this.shape.aiTimer >= this.shape.aiLimit){
						this.shape.aiTimer = 0;
						this.shape.aiLimit = 0;
						//this.shape.aiLimit = random(5, 25);
						this.shape.goBestMove();
					}
				}
				if(this.shape.locking){
					this.shape.lockDelay --;
					if(this.shape.lockDelay < 0){
						this.shape.lockDelay = this.shape.lockDelayMax;
						this.shape.lock();
					}
				}
				this.shape.fallDelay --;
				if(this.shape.fallDelay < 0){
					this.shape.fallDelay = this.shape.fallDelayMax;
					this.shape.move(0, 1);
				}
				var beforeScore = Math.round(this.displayScore);
				this.displayScore += (this.score-this.displayScore)/1;
				var afterScore = Math.round(this.displayScore);
				if(beforeScore != afterScore)display.flip();
			}
		}
	}
}

var mapWidth  = 10;
var mapHeight = 22;
var frameRate = 100/6;
var defaults = {};
defaults.level = 1;
defaults.lockDelay = 10;
var p1 = new Player(1, true);
var p2 = new Player(2, true);

var sprites = [];
var paused = false;
function oob(x, y, map, top){
	if(top === undefined)top = false;
	if(!top)return x < 0 || x > map[0].length-1 || y < 0 || y > map.length-1;
	return x < 0 || x > map[0].length-1 || y > map.length-1;
}
var display = {};
display.width  = 32;
display.height = 30;
display.flip = function(){
	ctx.fillStyle = 'black';
	ctx.fill();
	for(var i = 1; i < display.height-9; i ++){
		for(var j = 0; j < display.width; j ++){
			ctx.drawImage(bg, j*blockSize, i*blockSize, blockSize, blockSize);
		}
	}
	var gridOffsetX = 0;
	var gridOffsetY = 1;
	var x;
	var y;
	for(var i = 0; i < display.height; i ++){
		gridY = i+gridOffsetY;
		if(gridY < mapHeight){
			for(var j = 0; j < display.width; j ++){
				gridX = j+gridOffsetX;
				if(gridX < mapWidth){	
					x = blockSize
					y = blockSize*6;	
					if(p1.playing){
						k = p1.map[gridY][gridX];
						if(paused)k = 0;
						if(k > 0 && !p1.dead && !p1.idle){
							for(var l = 0; l < p1.shape.destinations.length; l ++){
								var t = p1.shape.destinations[l];
								if(gridX === t.x && gridY === t.y){
									ctx.drawImage(blockDestination, t.x*blockSize+x, t.y*blockSize+y, blockSize, blockSize);
								}
							}
						}
						drawBlock(gridX*blockSize+x, gridY*blockSize+y, k);
						if(k == 0 && !paused && !p1.dead && !p1.idle){
							for(var l = 0; l < p1.shape.destinations.length; l ++){
								var t = p1.shape.destinations[l];
								if(gridX === t.x && gridY === t.y){
									ctx.drawImage(blockDestination, t.x*blockSize+x, t.y*blockSize+y, blockSize, blockSize);
								}
							}
						}
					} else {
						k = 0;
						drawBlock(gridX*blockSize+x, gridY*blockSize+y, k);
					}
					x = blockSize*21
					y = blockSize*6;
					if(p2.playing){
						if(p2.shape != undefined){
							k = p2.map[gridY][gridX];
							if(paused)k = 0;
							if(k > 0 && !p2.dead && !p2.idle){
								for(var l = 0; l < p2.shape.destinations.length; l ++){
									var t = p2.shape.destinations[l];
									if(gridX === t.x && gridY === t.y){
										ctx.drawImage(blockDestination, t.x*blockSize+x, t.y*blockSize+y, blockSize, blockSize);
									}
								}
							}
							drawBlock(gridX*blockSize+x, gridY*blockSize+y, k);
							if(k == 0 && !paused && !p2.dead && !p2.idle){
								for(var l = 0; l < p2.shape.destinations.length; l ++){
									var t = p2.shape.destinations[l];
									if(gridX === t.x && gridY === t.y){
										ctx.drawImage(blockDestination, t.x*blockSize+x, t.y*blockSize+y, blockSize, blockSize);
									}
								}
							}
						}
					} else {
						k = 0;
						drawBlock(gridX*blockSize+x, gridY*blockSize+y, k);
					}
				}
			}
		}
	}
	ctx.drawImage(matrix, 0, blockSize*6, (mapWidth+2)*blockSize, (mapHeight+gridOffsetY)*blockSize);
	ctx.drawImage(matrix, blockSize*20, blockSize*6, (mapWidth+2)*blockSize, (mapHeight+gridOffsetY)*blockSize);
	x = (mapWidth+2)*blockSize;

	drawString(208, 352, 'WINS');
	drawString(208, 400, 'LEVEL');
	drawString(208, 448, 'GOAL');

	ctx.drawImage(box, 0, 0, 96, 96);
	ctx.drawImage(box, blockSize*6, 0, 96, 96);
	if(p1.playing && p1.bag.initialized)drawBlockSample(blockSize, blockSize, p1.bag.next);
	if(p1.held !== undefined){
		drawBlockSample(blockSize*7, blockSize, p1.held);
	}
	drawString(blockSize, blockSize, 'NEXT');
	drawString(blockSize*7, blockSize, 'HOLD');
	drawNumber(blockSize, 464, Math.round(p1.displayScore), 8);
	drawNumber(208, 368, p1.wins, 2);
	drawNumber(208, 416, p1.level, 2);
	drawNumber(208, 464, p1.goal-p1.lines, 2);

	
	ctx.drawImage(box, (display.width-6)*blockSize, 0, 96, 96);
	ctx.drawImage(box, (display.width-12)*blockSize, 0, 96, 96);
	if(p2.playing && p2.bag.initialized)drawBlockSample((display.width-5)*blockSize, blockSize, p2.bag.next);
	if(p2.held !== undefined){
		drawBlockSample((display.width-11)*blockSize, blockSize, p2.held);
	}
	drawString((display.width-5)*blockSize, blockSize, 'NEXT');
	drawString((display.width-11)*blockSize, blockSize, 'HOLD');
	drawNumber((display.width-9)*blockSize, 464, Math.round(p2.displayScore), 8);
	drawNumber(272, 368, p2.wins, 2);
	drawNumber(272, 416, p2.level, 2);
	drawNumber(272, 464, p2.goal-p2.lines, 2);

	if(!paused){
		for(var i = 0; i < sprites.length; i ++){
			var t = sprites[i];
			ctx.drawImage(t.sheet, t.spriteX, t.spriteY, t.width, t.height, t.x+6*blockSize, t.y, t.width, t.height);
		}
	} else {
		drawString(blockSize*3, blockSize*17, 'PAUSED');
		drawString(blockSize*23, blockSize*17, 'PAUSED');
	}
	if(p1.ai)drawString(blockSize*4, blockSize*10, 'DEMO');
	if((p1.ai || !p1.playing) && p1.blink && !paused){
		drawString(blockSize, blockSize*17, 'PUSH SPACE');
	}
	if(p2.ai)drawString(blockSize*24, blockSize*10, 'DEMO');
	if((p2.ai || !p2.playing) && p2.blink && !paused){
		drawString(blockSize*21, blockSize*17, 'PUSH ENTER');
	}
	if((p1.dead || p1.idle) && !p1.ai)drawString(blockSize, blockSize*17, 'GAME OVER!');
	if((p2.dead || p2.idle) && !p2.ai)drawString(blockSize*21, blockSize*17, 'GAME OVER!');
	drawString(blockSize*13, 0, 'TETRIS');
}

var blockIndex = 1;
var blockSize = 16;

var blockDestruction = new Image();
blockDestruction.src = 'https://i.imgur.com/3K3A2SG.png';
var blockDestination = new Image();
blockDestination.src = 'https://i.imgur.com/JUR9rFL.png';

var blockSamples = new Image();
blockSamples.src = 'https://i.imgur.com/g548Q3O.png';
var blockSamplesCoords = {
	'I':{x:0,  y:0, width:4, height:4},
	'O':{x:4,  y:0, width:4, height:4},
	'J':{x:8,  y:0, width:4, height:4},
	'L':{x:12, y:0, width:4, height:4},
	'Z':{x:16, y:0, width:4, height:4},
	'T':{x:20, y:0, width:4, height:4},
	'S':{x:24, y:0, width:4, height:4},
}
function drawBlockSample(x, y, name){
	ctx.drawImage(
		blockSamples, 
		blockSamplesCoords[name].x*blockSize, 
		blockSamplesCoords[name].y*blockSize, 
		blockSamplesCoords[name].width*blockSize, 
		blockSamplesCoords[name].height*blockSize, 
		x, 
		y, 
		blockSamplesCoords[name].width*blockSize, 
		blockSamplesCoords[name].height*blockSize
		);
}

var matrix = new Image();
matrix.src = 'https://i.imgur.com/wGcmvNU.png';

var box = new Image();
box.src = 'https://i.imgur.com/p0fWLYe.png';

var chars = new Image();
chars.src = 'https://i.imgur.com/87f3UkH.png';
var charsCoords = {};
var charsOrder = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ! ';
var x = 0;
var y = 0;
var charsWidth = 160;
var charsHeight= 72;
for(var i = 0; i < charsOrder.length; i ++){
	if(x > charsWidth/blockSize-1){
		x = 0;
		y ++;
	}
	var c = charsOrder.charAt(i);
	charsCoords[c] = {};
	charsCoords[c].x = x;
	charsCoords[c].y = y;
	x ++;
}
function drawString(x, y, string){
	for(var i = 0; i < string.length; i ++){
		var c = string.charAt(i);
		if(c != ' '){
			ctx.drawImage(
				chars, 
				charsCoords[c].x*blockSize, 
				charsCoords[c].y*(blockSize+2), 
				blockSize, 
				blockSize,
				x+blockSize*i, 
				y, 
				blockSize, 
				blockSize
				);
		}
	}
}
function drawNumber(x, y, number, place){
	string = number.toString();
	if(string.length > place){
		string = '';
		for(var i = 0; i < place; i ++)string += '0';
	}
	while(string.length < place)string = '0'+string;
	for(var i = 0; i < string.length; i ++){
		var c = string.charAt(i);
		ctx.drawImage(chars, charsCoords[c].x*blockSize, charsCoords[c].y*(blockSize+2), blockSize, blockSize, x+blockSize*i, y, blockSize, blockSize)
	}
}

var bg = new Image();
bg.src = 'https://i.imgur.com/zeQpekQ.png';

var blocks = new Image();
blocks.src = 'https://i.imgur.com/GrIgPHU.png';
function drawBlock(x, y, index){
	ctx.drawImage(blocks, blockSize*index, 0, blockSize, blockSize, x, y, blockSize, blockSize)
}

var canvas = document.createElement('canvas');
canvas.id = 'canvas';
canvas.width = blockSize*display.width;
canvas.height = blockSize*display.height;
document.body.appendChild(canvas);

var ctx = canvas.getContext('2d');
ctx.rect(0, 0, canvas.width, canvas.height);

var origin = {x:3, y:0};

var colors = {'red':1, 'orange':2, 'yellow':3, 'green':4, 'cyan':5, 'blue':6, 'purple':7};
var shapeNames = ['O', 'T', 'J', 'L', 'I', 'S', 'Z'];
var bag = {};
bag.init = function(player){
	player.bag.initialized = true;
	player.bag.list = [];
	player.bag.list.length = 0;
	for(var i = 0; i < shapeNames.length; i ++)player.bag.list.push(shapeNames[i]);
	player.bag.list.shuffle();
	for(var i = 0; i < random(0, shapeNames.length-1); i ++)player.bag.list.shift();
	player.bag.next = player.bag.list[0];
}
bag.draw = function(player){
	new Shape(player.bag.next, player);
	player.bag.list.shift();
	if(player.bag.list.length === 0){
		for(var i = 0; i < shapeNames.length; i ++)player.bag.list.push(shapeNames[i]);
		player.bag.list.shuffle();
	}
	player.bag.next = player.bag.list[0];
}
var shapes = {
	'O':{tiles:[[{x:1, y:0}, {x:2, y:0}, {x:1, y:1}, {x:2, y:1}]], color:'orange'},
	'T':{tiles:[
		[{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
		[{x:1, y:0}, {x:1, y:1}, {x:2, y:1}, {x:1, y:2}],
		[{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:1, y:2}],
		[{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:1, y:2}],
		], color:'blue'},
	'J':{tiles:[
		[{x:0, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
		[{x:1, y:0}, {x:2, y:0}, {x:1, y:1}, {x:1, y:2}],
		[{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:2, y:2}],
		[{x:1, y:0}, {x:1, y:1}, {x:0, y:2}, {x:1, y:2}],
		], color:'yellow'},
	'L':{tiles:[
		[{x:2, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
		[{x:1, y:0}, {x:1, y:1}, {x:1, y:2}, {x:2, y:2}],
		[{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:0, y:2}],
		[{x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:1, y:2}],
		], color:'green'},
	'I':{tiles:[
		[{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:3, y:1}],
		[{x:2, y:0}, {x:2, y:1}, {x:2, y:2}, {x:2, y:3}],
		[{x:0, y:2}, {x:1, y:2}, {x:2, y:2}, {x:3, y:2}],
		[{x:1, y:0}, {x:1, y:1}, {x:1, y:2}, {x:1, y:3}],
		], color:'red'},
	'S':{tiles:[
		[{x:1, y:0}, {x:2, y:0}, {x:0, y:1}, {x:1, y:1}],
		[{x:1, y:0}, {x:1, y:1}, {x:2, y:1}, {x:2, y:2}],
		[{x:1, y:1}, {x:2, y:1}, {x:0, y:2}, {x:1, y:2}],
		[{x:0, y:0}, {x:0, y:1}, {x:1, y:1}, {x:1, y:2}],
		], color:'purple'},
	'Z':{tiles:[
		[{x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:2, y:1}],
		[{x:2, y:0}, {x:1, y:1}, {x:2, y:1}, {x:1, y:2}],
		[{x:0, y:1}, {x:1, y:1}, {x:1, y:2}, {x:2, y:2}],
		[{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:0, y:2}],
		], color:'cyan'},
};
function Sprite(sheet, x, y, width, height, interval, loop){
	var self = this;
	if(interval === undefined)interval = 'none';
	if(loop === undefined)loop = false;
	this.x = x;
	this.y = y;
	this.spriteX = this.width*this.index;
	this.spriteY = 0;
	this.sheet = sheet;
	this.width = width;
	this.height= height;
	this.index = 0;
	this.frames = this.sheet.width/this.width;
	this.loop  = loop;
	this.kill = function(){
		for(var i = 0; i < sprites.length; i ++){
			var t = sprites[i];
			if(t.width === this.width && t.height === this.height && t.index === this.index && t.frames === this.frames){
				sprites.splice(i, 1);
				clearInterval(this.interval);
				return;
			}
		}
	}
	this.update = function(){
		this.spriteX = this.width*this.index;
		this.index ++;
		if(this.index == this.frames){
			if(loop)this.index = 0;
			else this.kill();
		}
	}
	sprites.push(this);
	this.update();
}
function calculateScore(map){
	var score = 0;
	var aggregateHeight = 0;
	var completeLines = 0;
	var holes = 0;
	var holeDepth = 0;
	var bumpiness = 0;
	var column = [];
	var segments = [];
	var tiles = [];
	var chainMap = [];
	for(var i = 0; i < mapHeight; i ++){
		chainMap.push([]);
		for(var j = 0; j < mapWidth; j ++)chainMap[i].push({filled:false});
	}
	for(var i = 0; i < mapHeight; i ++){
		for(var j = 0; j < mapWidth; j ++){
			if(map[i][j] === 0)break;
			if(j === mapWidth-1){
				completeLines ++;
				// map.splice(i, 1);
				// var temp = [];
				// map.unshift(temp);
				// for(var k = 0; k < mapWidth; k ++)temp.push(0);
			}
		}
	}
	if(completeLines > 0){
		for(var i = 0; i < mapHeight; i ++){
			for(var j = 0; j < mapWidth; j ++){
				var t;
				if(oob(j, i, map))t = 0;
				else t = map[i][j];
				if(t != 0 && !chainMap[i][j].filled){
					floodFill(j, i, map, chainMap, tiles);
					segments.push(tiles)
					tiles = [];
					tiles.length = 0;
				}
			}
		}
		for(var i = 0; i < segments.length; i ++){
			var s = segments[i];
			for(var j = 0; j < s.length; j ++){
				var t = s[j];
				map[t.y][t.x] = 0;
			}
			var done = false;
			var diters = 0;
			while(!done){
				diters ++;
				for(var j = 0; j < s.length; j ++){
					t = s[j];
					t.y ++;
				}
				for(var j = 0; j < s.length; j ++){
					t = s[j];
					if(t.y > mapHeight-1 || map[t.y][t.x] != 0){
						done = true;
					}
				}
				if(done){
					for(var j = 0; j < s.length; j ++){
						t = s[j];
						t.y --;
					}
				}
			}
			for(var j = 0; j < s.length; j ++){
				var t = s[j];
				map[t.y][t.x] = t.id;
			}
		}
	}
	for(var j = 0; j < mapWidth; j ++){
		column[j] = {};
		column[j].height = 0;
		for(var i = 0; i < mapHeight; i ++){
			if(map[i][j] > 0){
				column[j].height = mapHeight-i;
				aggregateHeight += column[j].height;
				break;
			}
		}
	}
	for(var j = 1; j < mapWidth; j ++){
		bumpiness += Math.abs(column[j].height-column[j-1].height);
	}
	for(var j = 0; j < mapWidth; j ++){
		column[j].holes = 0;
		column[j].holeDepth = 0;
		var streak = 0;
		var depth = 0;
		for(var i = mapHeight-1; i >= 0; i --){
			if(map[i][j] > 0){
				column[j].holes += streak;
				streak = 0;
			} else {
				streak ++;
			}
		}
		if(column[j].holes > 0){
			for(var i = mapHeight-1; i >= 0; i --){
				if(map[i][j] == 0){
					column[j].holeDepth = Math.abs(column[j].height-(mapHeight - 1 - i)-1);
					break;
				}
			}
		}
		holes += column[j].holes;
		holeDepth += column[j].holeDepth;
	}
	//score = -0.66569*aggregateHeight + -0.46544*bumpiness + 0.99275*completeLines + -0.24077*holes;
	if(aggregateHeight >= mapHeight-4 || holes > 0)score = -aggregateHeight + -bumpiness + completeLines + -100000*holes;
	else score = -aggregateHeight + -bumpiness + 100*completeLines + -10000*holes;
	for(var j = 0; j < mapWidth; j ++)if(map[0][j] > 0)score = -999999999;
	return {total:score, aggregateHeight:aggregateHeight, bumpiness:bumpiness, completeLines:completeLines, holes:holes, holeDepth:holeDepth};
}
function floodFill(x, y, map, chainMap, tiles){
	chainMap[y][x].filled = true;
	tiles.push({x:x, y:y, id:map[y][x]});
	for(var i = -1; i <= 1; i ++){
		var ry = y+i;
		for(var j = -1; j <= 1; j ++){
			var rx = x+j;
			if(Math.abs(x-rx) + Math.abs(y-ry) === 1 && !oob(rx, ry, map) && map[ry][rx] !== 0 && !chainMap[ry][rx].filled){
				floodFill(rx, ry, map, chainMap, tiles);
			}
		}
	}
}
function Shape(type, owner){
	owner.shape = this;
	this.x = origin.x;
	this.y = origin.y;
	this.width = 0;
	this.height = 0;
	this.type = type;
	this.rotationIndex = 0;
	this.initializing = true;
	this.destinations = [];
	this.segments = [];
	this.tiles = [];
	this.chainMap = [];
	this.fallDelayMax = findFallSpeed(owner.level);
	this.fallDelay = this.fallDelayMax;
	this.lockDelayMax = defaults.lockDelay;
	this.lockDelay = this.lockDelayMax;
	this.locked = false;
	this.locking = false;
	this.o = opponent(owner);
	this.ai = owner.ai;
	this.aiTimer = 0;
	this.aiLimit = 5;
	this.aiRotates = 0;
	this.aiRotatesMax = 4;
	this.bestMove = undefined;
	this.findBest = function(type, map, tetris, lookahead){
		if(lookahead === undefined)lookahead = false;
		this.clear();
		var moves = [];
		var valid = false;
		var startX = this.x;
		var startY = this.y;
		var tempMap = [];
		for(var i = 0; i < mapHeight; i ++){
			tempMap.push([]);
			for(var j = 0; j < mapWidth; j ++){
				tempMap[i].push(map[i][j]);
			}
		}
		var beforeScore = calculateScore(tempMap);
		if(beforeScore.aggregateHeight > 7*mapWidth){
			tetris = false;
			//console.log('Stack is too tall; temporarily deactivating TETRIS mode')
		}
		if(beforeScore.holes > 0){
			tetris = false;
			//console.log('There are holes in the stack; temporarily deactivating TETRIS mode')
		}
		for(var j = 0; j < shapes[type].tiles.length; j ++){
			this.x = -2;
			while(this.x < mapWidth){
				var destinations = [];
				destinations.length = 0;
				valid = true;
				for(var i = 0; i < shapes[type].tiles[j].length; i ++){
					var t = shapes[type].tiles[j][i];
					var x = t.x+this.x;
					var y = t.y+this.y;
					if(oob(x, y, tempMap) || (tetris && x == mapWidth-1) || tempMap[y][x] > 0){
						valid = false;
						break;
					}
				}
				if(valid){
					var airborne = true;
					var tx = this.x;
					var ty = this.y;
					while(airborne){
						ty += 1;
						for(var i = 0; i < shapes[type].tiles[j].length; i ++){
							var t = shapes[type].tiles[j][i];
							if(t.y+ty < 0)continue;
							if(t.y+ty > mapHeight-1 || tempMap[t.y+ty][t.x+tx] !== 0){
								airborne = false;
								ty -= 1;
								break;
							}
						}
					}
					for(var i = 0; i < shapes[type].tiles[j].length; i ++){
						var t = shapes[type].tiles[j][i];
						var x = t.x+tx;
						var y = t.y+ty;
						tempMap[y][x] = colors[shapes[type].color];
						destinations.push({x:x, y:y});
					}
					prospect = {spots:destinations, x:tx, y:ty, rotation:j, score:calculateScore(tempMap)};
					moves.push(prospect);
					for(var i = 0; i < destinations.length; i ++){
						var t = destinations[i];
						tempMap[t.y][t.x] = 0;
					}
				}
				this.x ++;
			}
		}
		if(lookahead){
			for(var i = 0; i < moves.length; i ++){
				var m = moves[i];
				for(var j = 0; j < m.spots; j ++){
					var s = m.spots[j];
					tempMap[s.y][s.x] = 8;
					m.score += findBest(owner.bag.next, tempMap, tetris, false).score;
					tempMap[s.y][s.x] = 0;
				}
			}
		}
		var bestMove = {};
		var scores = [];
		for(var i = 0; i < moves.length; i ++){
			var m = moves[i];
			var score = m.score.total;
			scores.push(score);
		}
		scores.sort(function(a, b){return b-a});
		for(var i = 0; i < moves.length; i ++){
			if(moves[i].score.total === scores[0])bestMove = {x:moves[i].x, y:moves[i].y, rotation:moves[i].rotation, score:moves[i].score};
		}
		this.x = startX;
		this.y = startY;
		this.restore();
		if(bestMove.score.holes > beforeScore.holes && tetris){
			//console.log('Best move creates a hole; temporarily deactivating TETRIS mode.')
			return this.findBest(type, map, false, lookahead)
		}
		return bestMove;
	}
	this.goBestMove = function(){
		var moved = false;
		var lookahead = owner.name === 'player1';
		if(this.bestMove === undefined){
			this.bestMove = this.findBest(this.type, owner.map, true, lookahead);
		}
		if(!owner.testing){
			if(this.rotationIndex != this.bestMove.rotation){
				this.rotate(1);
				moved = true;
			}
			if(this.x < this.bestMove.x)moved = this.move( 1, 0);
			else
			if(this.x > this.bestMove.x)moved = this.move(-1, 0);
			if(this.x === this.bestMove.x && this.rotationIndex == this.bestMove.rotation){
				this.dash( 0, 1);
				this.lock();
				moved = true;
			}
			if(!moved){
				if(this.aiRotates >= this.aiRotatesMax){
					this.bestMove = undefined;
				} else {
					this.rotate(1);
					this.aiRotates ++;
					//console.log("Move blocked, rotating")
				}
			}
		} else {
			this.clear();
			this.x = this.bestMove.x;
			this.rotationIndex = this.bestMove.rotation;
			this.restore();
			this.update();
			this.dash( 0, 1);
			this.lock();
		}

	}
	this.check = function(){
		// for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
		// 	var t = shapes[this.type].tiles[this.rotationIndex][i];
		// 	var x = t.x+this.x;
		// 	var y = t.y+this.y;
		// 	if(oob(x, y, owner.map) || owner.map[y][x] > 0){
		// 		this.lock();
		// 	}
		// }
	}
	this.clear = function(){
		for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
			var t = shapes[this.type].tiles[this.rotationIndex][i];
			var x = t.x+this.x;
			var y = t.y+this.y;
			if(!oob(x, y, owner.map)){
				owner.map[y][x] = 0;
			}
		}
	}
	this.restore = function(){
		for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
			var t = shapes[this.type].tiles[this.rotationIndex][i];
			var x = t.x+this.x;
			var y = t.y+this.y;
			if(!oob(x, y, owner.map)){
				owner.map[y][x] = colors[shapes[this.type].color];
			}
		}
	}
	this.update = function(){
		this.clear();
		var tx = this.x;
		var ty = this.y;
		this.destinations = [];
		this.destinations.length = 0;
		var valid = true;
		while(valid){
			ty += 1;
			for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
				var t = shapes[this.type].tiles[this.rotationIndex][i];
				if(t.y+ty < 0)continue;
				if(t.y+ty > mapHeight-1 || owner.map[t.y+ty][t.x+tx] !== 0){
					valid = false;
					ty -= 1;
					break;
				}
			}
		}
		for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
			var t = shapes[this.type].tiles[this.rotationIndex][i];
			var x = t.x+this.x;
			var y = t.y+this.y;
			if(!oob(x, y, owner.map)){
				owner.map[y][x] = colors[shapes[this.type].color];
			}
			this.destinations.push({x:t.x+tx, y:t.y+ty});
		}
		this.finalX = tx;
		this.finalY = ty;
		display.flip();
	}
	this.hold = function(){
		if(owner.canHold){
			this.lockDelay = this.lockDelayMax;
			for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
				var t = shapes[this.type].tiles[this.rotationIndex][i];
				var x = t.x+this.x;
				var y = t.y+this.y;
				if(!oob(x, y, owner.map)){
					owner.map[y][x] = 0;
				}
			}
			if(owner.held === undefined){
				owner.held = this.type;
				bag.draw(owner);
			} else {
				new Shape(owner.held, owner);
				owner.held = this.type;
			}
			owner.canHold = false;
			display.flip();
		}
	}
	this.size = function(){
		this.width = 0;
		this.height = 0;
		var x1 = 0;
		var x2 = 0;
		var y1 = 0;
		var y2 = 0;
		for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
			var t = shapes[this.type].tiles[this.rotationIndex][i];
			if(t.x < x1)x1 = t.x;
			if(t.x > x2)x2 = t.x;
			if(t.y < y1)y1 = t.y;
			if(t.y > y2)y2 = t.y;
		}
		this.width = Math.abs(x1-x2);
		this.height = Math.abs(y1-y2);
	}
	this.rotate = function(difference){
		if(difference === undefined)difference = 1;
		var targetIndex = this.rotationIndex+difference;
		if(targetIndex >= shapes[this.type].tiles.length)targetIndex = 0;
		if(targetIndex < 0)targetIndex = shapes[this.type].tiles.length-1;
		for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
			var t = shapes[this.type].tiles[this.rotationIndex][i];
			var x = t.x+this.x;
			var y = t.y+this.y;
			if(!oob(x, y, owner.map)){
				owner.map[y][x] = 0;
			}
		}
		var ox = 0;
		var oy = 0;
		var iters = 0;
		var outside = true;
		var valid = true;
		while(outside){
			outside = false;
			for(var i = 0; i < shapes[this.type].tiles[targetIndex].length; i ++){
				var t = shapes[this.type].tiles[targetIndex][i];
				if(oob(t.x+this.x+ox, t.y+this.y+oy, owner.map) || (t.y+this.y+oy !== -1 && owner.map[t.y+this.y+oy][t.x+this.x+ox] !== 0)){
					outside = true;
					break;
				}
			}
			if(!outside){
				valid = true;
				break;
			}
			if(iters === 0){
				ox = 0;
				oy = -1;
			}else
			if(iters === 1){
				ox = 0;
				oy = 1;
			}else
			if(iters === 2){
				ox = -1;
				oy = 0;
			}else
			if(iters === 3){
				ox = 1;
				oy = 0;
			}else
			if(iters === 4){
				ox = -2;
				oy = 0;
			}else
			if(iters === 5){
				ox = 2;
				oy = 0;
			}else{
				valid = false;
				break;
			}
			iters ++;
		}
		if(valid){
			this.lockDelay = this.lockDelayMax;
			this.locking = false;
			this.x += ox;
			this.y += oy;
			this.rotationIndex = targetIndex;
			this.size();
		}
		this.update();
		wasDown['up'] = false;
		wasDown['w'] = false;
	}
	this.dash = function(dx, dy){
		if(dx === 0 && dy > 0){
			for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
				var t = shapes[this.type].tiles[this.rotationIndex][i];
				var x = t.x+this.x;
				var y = t.y+this.y;
				if(!oob(x, y, owner.map)){
					owner.map[y][x] = 0;
				}
			}
			owner.score += Math.abs(this.y-this.finalY)*2;
			this.x = this.finalX;
			this.y = this.finalY;
			this.update();
		} else {
			while(true)if(!this.move(dx, dy))break;
			if(!this.locked)this.update();
		}
	}
	this.move = function(dx, dy, points){
		if(points === undefined)points = 0;
		var moved = false;
		if(this.locked){
			return;
		}
		var tx = this.x + dx;
		var ty = this.y + dy;
		var valid = true;
		this.clear();
		for(var i = 0; i < shapes[this.type].tiles[this.rotationIndex].length; i ++){
			var t = shapes[this.type].tiles[this.rotationIndex][i];
			if(oob(t.x+tx, t.y+ty, owner.map, true) || (t.y+this.y !== -1 && owner.map[t.y+ty][t.x+tx] !== 0)){
				if(dy === 1 && (t.y+ty > mapHeight-1 || owner.map[t.y+ty][t.x+tx] !== 0)){
					this.locking = true;
					wasDown['down'] = false;
					wasDown['s'] = false;
				}
				valid = false;
				break;
			}
		}
		if(valid){
			if(dx === 0 && dy === 1)owner.score += points;
			this.x = tx;
			this.y = ty;
			moved = true;
			this.lockDelay = this.lockDelayMax;
			this.locking = false;
			this.locked = false;
		}
		this.update();
		if(!(dx === 0 && dy === 0))if(this.initializing)this.initializing = false;
		return moved;
	}
	this.lock = function(){
		this.locked = true;
		this.locking = false;
		var gameOver = false;
		var chain = 0;
		var checking = true;
		var iters = 0;
		while(checking){
			iters ++;
			checking = false;
			for(var i = 0; i < mapHeight; i ++){
				var k = 0;
				for(var j = 0; j < mapWidth; j ++){
					var t;
					if(oob(j, i, owner.map))t = 0;
					else t = owner.map[i][j];
					if(t != 0){
						if(i === 0){
							gameOver = true;
						}
					}
					if(t != 0 && k === j)k ++;
					else k = 0;
					if(j === mapWidth-1 && k > 0){
						chain ++;
						owner.goal --;
						owner.map.splice(i, 1);
						var temp = [];
						owner.map.unshift(temp);
						for(var l = 0; l < mapWidth; l ++){
							temp.push(0);
							if(owner.name === 'player1')new Sprite(blockDestruction, (l-5)*blockSize, (i+6)*blockSize, blockSize, blockSize);
							if(owner.name === 'player2')new Sprite(blockDestruction, (l+15)*blockSize, (i+6)*blockSize, blockSize, blockSize);
						}
						checking = true;
					}
				}
			}
			if(chain > 0){
				this.segments = [];
				this.segments.length = 0;
				this.tiles = [];
				this.tiles.length = 0;
				this.chainMap = [];
				this.chainMap.length = 0;
				for(var i = 0; i < mapHeight; i ++){
					this.chainMap.push([]);
					for(var j = 0; j < mapWidth; j ++)this.chainMap[i].push({filled:false});
				}
				for(var i = 0; i < mapHeight; i ++){
					for(var j = 0; j < mapWidth; j ++){
						var t;
						if(oob(j, i, owner.map))t = 0;
						else t = owner.map[i][j];
						if(t != 0 && !this.chainMap[i][j].filled){
							floodFill(j, i, owner.map, this.chainMap, this.tiles);
							this.segments.push(this.tiles)
							this.tiles = [];
							this.tiles.length = 0;
						}
					}
				}
				for(var i = 0; i < this.segments.length; i ++){
					var s = this.segments[i];
					for(var j = 0; j < s.length; j ++){
						var t = s[j];
						owner.map[t.y][t.x] = 0;
					}
					var done = false;
					var diters = 0;
					while(!done){
						diters ++;
						for(var j = 0; j < s.length; j ++){
							t = s[j];
							t.y ++;
						}
						for(var j = 0; j < s.length; j ++){
							t = s[j];
							if(t.y > mapHeight-1 || owner.map[t.y][t.x] != 0){
								done = true;
							}
						}
						if(done){
							for(var j = 0; j < s.length; j ++){
								t = s[j];
								t.y --;
							}
						}
					}
					for(var j = 0; j < s.length; j ++){
						var t = s[j];
						owner.map[t.y][t.x] = t.id;
					}
				}
			}
		}
		if(gameOver){
			gameOver = false;
			owner.dead = true;
			if(this.o.playing && !(this.o.ai && !owner.ai) && !(owner.ai && !this.o.ai)){
				this.o.dead = true;
				this.o.wins ++;
			}
			return;
		} else {
			if(chain === 1)owner.score += 100 * owner.level;
			if(chain === 2)owner.score += 300 * owner.level;
			if(chain === 3)owner.score += 500 * owner.level;
			if(chain === 4)owner.score += 800 * owner.level;
			if(chain >=  5)owner.score += 1000 * (chain-4) * owner.level;
			if(this.o.playing){
				if(chain >= 2){
					if((owner.ai && this.o.ai) || (!owner.ai && !this.o.ai)){
						this.o.garbage += chain-1;
					}
				}
			}
			if(owner.goal <= 0){
				owner.goal = findGoal(owner.level) - owner.goal;
				owner.level ++;
				this.fallDelayMax = findFallSpeed(owner.level);
			}
			while(owner.garbage > 0){
				owner.garbage --;
				makeGarbage(owner.map);
			}
			display.flip();
			owner.canHold = true;
			bag.draw(owner);
			wasDown['left'] = false;
			wasDown['right']= false;
			wasDown['up']   = false;
			wasDown['down'] = false;
			wasDown['w'] = false;
			wasDown['a']= false;
			wasDown['s']   = false;
			wasDown['d'] = false;
		}
	}
	this.size();
	this.check();
	this.update();
}
keyDown = {};
keyDown['left'] = false;
keyDown['right']= false;
keyDown['up']   = false;
keyDown['down'] = false;
keyDown['p'] 	= false;
keyDown['w'] 	= false;
keyDown['a']	= false;
keyDown['s']   	= false;
keyDown['q'] 	= false;
keyDown['\''] 	= false;
keyDown['leftShift']= false;
keyDown['rightShift']= false;
keyDown['space']= false;
keyDown['enter']= false;
wasDown = {};
wasDown['left'] = false;
wasDown['right']= false;
wasDown['up']   = false;
wasDown['down'] = false;
wasDown['p'] 	= false;
wasDown['w'] 	= false;
wasDown['a']	= false;
wasDown['s']   	= false;
wasDown['d'] 	= false;
wasDown['q'] 	= false;
wasDown['\''] 	= false;
wasDown['leftShift']= false;
wasDown['rightShift']= false;
wasDown['space']= false;
wasDown['enter']= false;
function keydown(e){
	switch(e.keyCode){
		case 37:
			if(!wasDown['left'] && !keyDown['left'])wasDown['left'] = true;
			keyDown['left'] = true;
			break;
		case 39:
			if(!wasDown['right'] && !keyDown['right'])wasDown['right'] = true;
			keyDown['right'] = true;
			break;
		case 38:
		 	if(!wasDown['up'] && !keyDown['up'])wasDown['up'] = true;
			keyDown['up'] = true;
			break;
		case 40:
			if(!wasDown['down'] && !keyDown['down'])wasDown['down'] = true;
			keyDown['down'] = true;
			break;
		case 65:
			if(!wasDown['a'] && !keyDown['a'])wasDown['a'] = true;
			keyDown['a'] = true;
			break;
		case 68:
			if(!wasDown['d'] && !keyDown['d'])wasDown['d'] = true;
			keyDown['d'] = true;
			break;
		case 87:
		 	if(!wasDown['w'] && !keyDown['w'])wasDown['w'] = true;
			keyDown['w'] = true;
			break;
		case 83:
			if(!wasDown['s'] && !keyDown['s'])wasDown['s'] = true;
			keyDown['s'] = true;
			break;
		case 80:
			if(!wasDown['p'] && !keyDown['p'])wasDown['p'] = true;
			keyDown['p'] = true;
			break;
		case 81:
			if(!wasDown['q'] && !keyDown['q'])wasDown['q'] = true;
			keyDown['q'] = true;
			break;
		case 222:
			if(!wasDown['\''] && !keyDown['\''])wasDown['\''] = true;
			keyDown['\''] = true;
			break;
		case 13:
			if(!wasDown['enter'] && !keyDown['enter'])wasDown['enter'] = true;
			keyDown['enter'] = true;
			break;
		case 16:
			if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT){
				keyDown['leftShift'] = true;
			} else if (e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT){
				keyDown['rightShift'] = true;
			}
			break;
		case 32:
			if(!wasDown['space'] && !keyDown['space'])wasDown['space'] = true;
			keyDown['space'] = true;
			break;
	}
	if(!paused){
		if(wasDown['space']){
			if(p1.ai){
				p1.ai = false;
				p1.reset();
			} else {
				p1.shape.dash( 0, 1);
			}
			wasDown['space'] = false;
		}
		if(wasDown['enter']){
			if(p2.ai){
				p2.ai = false;
				p2.reset();
			} else {
				p2.shape.dash( 0, 1);
			}
			wasDown['enter'] = false;
		}
		if(p1.playing && !p1.ai){
			if(wasDown['a'])p1.shape.move(-1, 0);
			if(wasDown['d'])p1.shape.move( 1, 0);
			if(wasDown['w'])p1.shape.rotate();
			if(wasDown['s']){
				if(p1.shape.locking)p1.shape.lock();
				else p1.shape.move( 0, 1);
			}
			if(keyDown['leftShift']){
				p1.shape.hold();
			}
		}
		if(p2.playing && !p2.ai){
			if(wasDown['left'])p2.shape.move(-1, 0);
			if(wasDown['right'])p2.shape.move( 1, 0);
			if(wasDown['up'])p2.shape.rotate();
			if(wasDown['down']){
				if(p2.shape.locking)p2.shape.lock();
				else p2.shape.move( 0, 1, 1);
			}
			if(keyDown['rightShift'])p2.shape.hold();
		}
	}
	if(wasDown['p']){
		if(!paused){
			paused = true;
		} else {
			paused = false;
		}
		display.flip();
		wasDown['p'] = false;
	}
}
function keyup(e){
	switch(e.keyCode){
		case 37:
			keyDown['left'] = false;
			wasDown['left'] = false;
			break;
		case 39:
			keyDown['right'] = false;
			wasDown['right'] = false;
			break;
		case 38:
			keyDown['up'] = false;
			wasDown['up'] = false;
			break;
		case 40:
			keyDown['down'] = false;
			wasDown['down'] = false;
			break;
		case 65:
			keyDown['a'] = false;
			wasDown['a'] = false;
			break;
		case 68:
			keyDown['d'] = false;
			wasDown['d'] = false;
			break;
		case 87:
			keyDown['w'] = false;
			wasDown['w'] = false;
			break;
		case 83:
			keyDown['s'] = false;
			wasDown['s'] = false;
			break;
		case 80:
			keyDown['p'] = false;
			wasDown['p'] = false;
			break;
		case 81:
			keyDown['q'] = false;
			wasDown['q'] = false;
			break;
		case 222:
			keyDown['\''] = false;
			wasDown['\''] = false;
			break;
		case 16:
			if(keyDown['leftShift'])keyDown['leftShift'] = false;
			if(keyDown['rightShift'])keyDown['rightShift'] = false;
			break;
		case 13:
			keyDown['enter'] = false;
			wasDown['enter'] = false;
			break;
		case 32:
			keyDown['space'] = false;
			wasDown['space'] = false;
			break;
	}
}
if(p1.playing){
	bag.init(p1);
	bag.draw(p1);
}
if(p2.playing){
	bag.init(p2);
	bag.draw(p2);
}
document.onkeydown = keydown;
document.onkeyup   = keyup;
function onEnterFrame(){
	if(!paused){
		p1.update();
		p2.update();
	}
	var updated = false;
	for(var i = 0; i < sprites.length; i ++){
		var sprite = sprites[i];
		sprite.update();
		updated = true;
	}
	if(updated)display.flip();
}
var enterFrame = setInterval(onEnterFrame, frameRate);