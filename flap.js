var playButton = document.getElementById('playButton');
var gameOver = document.getElementById('gameOver');
var finalScore = document.getElementById('finalScore');
var restartButton = document.getElementById('restartButton');
var canvas = document.getElementById('score');
var ctx = canvas.getContext('2d');

var flapSound = new Audio('sounds/sfx_wing.mp3');
var pointSound = new Audio('sounds/sfx_point.mp3');
var dieSound = new Audio('sounds/sfx_die.mp3');

var birdImage = new Image();
birdImage.src = 'img/flappy.png';
var bgImage = new Image();
bgImage.src = 'img/background.png';

//Game state where you can change physic for the bird and pipes
var game = {
  running: false,
  score: 0,
  pipes: [],
  frame: 0,
  animationId: null,
  gravity: 0.10,
  speed: 1.2,
  pipeGap: 130,
  pipeWidth: 50,
  spawnInterval: 170,
  minPipeSeparation: 220,
};


var bird = {
  x: 60,
  y: 240,
  size: 30,
  velY: 0,
  angle: 0,
};

playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);


function startGame() {
  if (game.running) return;

  game.running = true;
  game.score = 0;
  game.pipes = [];
  game.frame = 0;
// Resets the bird posiiton and velocity + angle
  bird.x = 60;
  bird.y = 240;
  bird.velY = 0;
  bird.angle = 0;

  playButton.style.display = 'none';
  gameOver.style.display = 'none';

  if (game.animationId) cancelAnimationFrame(game.animationId);
  game.animationId = requestAnimationFrame(gameLoop);
}


function endGame() {
  game.running = false;
  if (game.animationId) cancelAnimationFrame(game.animationId);
  dieSound.currentTime = 0;
  dieSound.play();

  finalScore.textContent = 'Final Score: ' + game.score;
  gameOver.style.display = 'flex';
  playButton.disabled = false;
}


function spawnPipe() {
  var minY = 60;
  var maxY = canvas.height - 60 - game.pipeGap;
  var top = Math.random() * (maxY - minY) + minY;
  game.pipes.push({ x: canvas.width, y: top, passed: false });
}

function jump() {
  if (!game.running) return;

  // How far the bird jumps and the speed of it
  bird.velY = -4.2;
  bird.angle = -25;
  flapSound.currentTime = 0;
  flapSound.play();
}

document.addEventListener('click', function (event) {
  if (event.target === playButton || event.target === restartButton) return;
  if (!game.running) return;
  jump();
});

document.addEventListener('keydown', function (event) {
  if (event.code === 'Space') {
    if (!game.running) return;
    event.preventDefault();
    jump();
  }
});



function gameLoop() {
  update();
  draw();

  if (game.running) {
    game.animationId = requestAnimationFrame(gameLoop);
  }
}

//Game logic for bird, pipe spawn and collision

function update() {
  bird.velY += game.gravity;
  bird.y += bird.velY;

  bird.angle = Math.min((bird.velY * 5), 80);

  if (bird.y > canvas.height - bird.size) {
    bird.y = canvas.height - bird.size;
    endGame();
    return;
  }

  if (bird.y < 0) {
    bird.y = 0;
    bird.velY = 0;
  }
//Pipe spawn
  if (game.frame % game.spawnInterval === 0) {
    var tooClose = game.pipes.some(function (p) {
      return canvas.width - p.x < game.minPipeSeparation;
    });
    if (!tooClose) {
      spawnPipe();
    }
  }

//pipe movement and collision
  for (var i = 0; i < game.pipes.length; i++) {
    var p = game.pipes[i];
    p.x -= game.speed;
    var birdCenterY = bird.y + bird.size / 2;

    if (!p.passed && p.x + game.pipeWidth < bird.x) {
      p.passed = true;
      game.score++;
      pointSound.currentTime = 0;
      pointSound.play();
    }
//collision if whenever the bird hit ground or pipe
    var collisionX = bird.x + bird.size > p.x && bird.x < p.x + game.pipeWidth;
    var collisionY = birdCenterY < p.y || birdCenterY > p.y + game.pipeGap;

    if (collisionX && collisionY) {
      endGame();
      return;
    }
  }

  game.pipes = game.pipes.filter(function (p) {
    return p.x + game.pipeWidth > 0;
  });

  game.frame++;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //background
  if (bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draws pipes
  ctx.fillStyle = 'green';
  game.pipes.forEach(function (p) {
    ctx.fillRect(p.x, 0, game.pipeWidth, p.y);
    ctx.fillRect(p.x, p.y + game.pipeGap, game.pipeWidth, canvas.height - (p.y + game.pipeGap));
  });

  // Draws bird and the rotation as the falling
  if (birdImage.complete) {
    ctx.save();
    var centerX = bird.x + bird.size / 2;
    var centerY = bird.y + bird.size / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((bird.angle * Math.PI) / 180);
    ctx.drawImage(birdImage, -bird.size / 2, -bird.size / 2, bird.size, bird.size);
    ctx.restore();
  } else {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(bird.x + bird.size / 2, bird.y + bird.size / 2, bird.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'black';
  ctx.font = '20px Times New Roman';
  ctx.fillText('Score: ' + game.score, 10, 30);
}
