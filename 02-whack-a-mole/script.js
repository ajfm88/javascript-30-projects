const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const moles = document.querySelectorAll('.mole');
const start = document.querySelector('.start');
let lastHole;
let timeUp = false;
let score = 0;

function randTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function randHole(holes) {
  const idx = Math.floor(Math.random() * holes.length)
  const hole = holes[idx]
  if (hole == lastHole) {
    return randHole(holes)
  }
  lastHole =  hole;
  return hole
}

function peep() {
  const time = randTime(200, 1000)
  const hole = randHole(holes)
  hole.classList.add('up')
  setTimeout(() => {
    hole.classList.remove('up')
    if (!timeUp) peep();
  }, time);
}

function startgame() {
  scoreBoard.textContent = 0;
  timeUp = false;
  score = 0
  peep();
  setTimeout(() => timeUp = true, 15000);
}

function bonk(e) {
  console.log(this);
  console.log(e);
  if (!e.isTrusted) return;
  score++;
  this.classList.remove('up');
  scoreBoard.textContent = score;
}

moles.forEach(mole => mole.addEventListener('click', bonk));
start.addEventListener('click', function() {
  this.classList.add('clicked')
  setTimeout(() => {
  this.classList.remove('clicked')
  }, 100)
});