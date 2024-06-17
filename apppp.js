const optionContainer = document.querySelector('.option-container');
const gameBoardContainer = document.querySelector('#gamesboard-container');
const flipButton = document.querySelector('#flip-button');
const startButton = document.querySelector('#start-button');
const infoDisplay = document.querySelector('#info');
const turnDisplay = document.querySelector('#turn-display');

let angle = 0;

function flip() {
  const optionShips = Array.from(optionContainer.children);
  angle = angle === 0 ? 90 : 0;
  optionShips.forEach(optionShip => optionShip.style.transform = `rotate(${angle}deg)`);
}

flipButton.addEventListener('click', flip);

// Board
const width = 10;

function createBoard(color, user) {
  const gameBoard = document.createElement('div');
  gameBoard.classList.add('game-board');
  gameBoard.style.backgroundColor = color;
  gameBoard.id = user;

  for (let i = 0; i < width * width; i++) {
    const block = document.createElement('div');
    block.classList.add('block');
    block.id = `${user}-${i}`;
    gameBoard.appendChild(block);
  }

  gameBoardContainer.append(gameBoard);
}

createBoard('yellow', 'player');
createBoard('pink', 'computer');

class Ship {
  constructor(name, length) {
    this.name = name;
    this.length = length;
  }
}

const destroyer = new Ship('destroyer', 2);
const submarine = new Ship('submarine', 3);
const cruiser = new Ship('cruiser', 3);
const battleship = new Ship('battleship', 4);
const carrier = new Ship('carrier', 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
  let validStart = isHorizontal
    ? startIndex % width <= width - ship.length
    : startIndex < width * width - width * (ship.length - 1);

  if (!validStart) return { valid: false, notTaken: false, shipBlocks: [] };

  let shipBlocks = [];

  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      shipBlocks.push(allBoardBlocks[startIndex + i]);
    } else {
      shipBlocks.push(allBoardBlocks[startIndex + i * width]);
    }
  }

  let valid = isHorizontal
    ? shipBlocks.every((_shipBlock, index) => startIndex % width <= width - (shipBlocks.length - (index + 1)))
    : shipBlocks.every((_shipBlock, index) => startIndex < width * width - width * (index + 1));

  const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'));
  return { shipBlocks, valid, notTaken };
}

function addShip(user, ship, startID) {
  const allBoardBlocks = Array.from(document.querySelectorAll(`#${user} .block`));
  let randomBoolean = Math.random() < 0.5;
  let isHorizontal = user === 'player' ? angle === 0 : randomBoolean;
  let randomStartIndex = Math.floor(Math.random() * width * width);

  let startIndex = startID ? parseInt(startID.split('-')[1]) : randomStartIndex;

  const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

  if (valid && notTaken) {
    shipBlocks.forEach(shipBlock => {  
      shipBlock.classList.add(ship.name);
      shipBlock.classList.add('taken');
    });
  } else {
    if (user === 'computer') addShip(user, ship);
    if (user === 'player') {
        notDropped = true;
    }
  }
}

ships.forEach(ship => addShip('computer', ship));

let draggedShip;
const optionShips = Array.from(optionContainer.children);
optionShips.forEach(optionShip => optionShip.addEventListener('dragstart', dragStart));

const allPlayerBlocks = document.querySelectorAll('#player .block');
allPlayerBlocks.forEach(playerBlock => {
  playerBlock.addEventListener('dragover', dragOver);
  playerBlock.addEventListener('drop', dropShip);
});

function dragStart(e) {
  draggedShip = e.target;
  notDropped = false;
}

function dragOver(e) {
  e.preventDefault();
}

function dropShip(e) {
  const startID = e.target.id;
  const ship = ships[parseInt(draggedShip.dataset.id)];
  addShip('player', ship, startID);
  if (!notDropped) {
    draggedShip.remove();
  }
}

function highlightArea(startID, ship) {
  const allBoardBlocks = Array.from(document.querySelectorAll('#player .block'));
  let isHorizontal = angle === 0;
  let startIndex = parseInt(startID.split('-')[1]);

  const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

  if (valid && notTaken) {
    shipBlocks.forEach(shipBlock => {
      shipBlock.classList.add('hover');
      setTimeout(() => shipBlock.classList.remove('hover'), 500);
    });
  }
}

let gameOver = false;
let playerTurn;

function startGame() {
  if (playerTurn === undefined) {
    if (optionContainer.children.length !== 0) {
      infoDisplay.textContent = 'Place all your pieces!';
    } else {
      const allBoardBlocks = document.querySelectorAll('#computer .block');
      allBoardBlocks.forEach(block => block.addEventListener('click', handleClick));
      playerTurn = true;
      turnDisplay.textContent = 'You shoot!';
      infoDisplay.textContent = 'The game begins!';
    }
  }
}

startButton.addEventListener('click', startGame);

let playerHits = [];
let computerHits = [];
const playerSunkShips = [];
const computerSunkShips = [];

function handleClick(e) {
  if (!gameOver) {
    if (e.target.classList.contains('taken')) {
      e.target.classList.add('boom');
      infoDisplay.textContent = 'You hit the enemy ship!';
      let classes = Array.from(e.target.classList);
      classes = classes.filter(className => !['block', 'boom', 'taken'].includes(className));
      playerHits.push(...classes);
      checkScore('player', playerHits, playerSunkShips);
    } else {
      infoDisplay.textContent = 'You missed!';
      e.target.classList.add('empty');
    }
    playerTurn = false;
    const allBoardBlocks = document.querySelectorAll('#computer .block');
    allBoardBlocks.forEach(block => block.replaceWith(block.cloneNode(true)));
    setTimeout(computerGo, 3000);
  }
}

function computerGo() {
  if (!gameOver) {
    turnDisplay.textContent = 'Enemy turn';
    infoDisplay.textContent = 'Enemy is thinking...';

    setTimeout(() => {
      let randomGo = Math.floor(Math.random() * width * width);
      const allBoardBlocks = document.querySelectorAll('#player .block');
      if (allBoardBlocks[randomGo].classList.contains('taken') && allBoardBlocks[randomGo].classList.contains('boom')) {
        computerGo();
        return;
      } else if (allBoardBlocks[randomGo].classList.contains('taken')) {
        allBoardBlocks[randomGo].classList.add('boom');
        infoDisplay.textContent = 'Enemy hit your ship!';
        let classes = Array.from(allBoardBlocks[randomGo].classList);
        classes = classes.filter(className => !['block', 'boom', 'taken'].includes(className));
        computerHits.push(...classes);
        checkScore('computer', computerHits, computerSunkShips);
      } else {
        infoDisplay.textContent = 'Enemy missed!';
        allBoardBlocks[randomGo].classList.add('empty');
      }
    }, 3000);

    setTimeout(() => {
      playerTurn = true;
      turnDisplay.textContent = 'Your turn';
      infoDisplay.textContent = 'Your turn';
      const allBoardBlocks = document.querySelectorAll('#computer .block');
      allBoardBlocks.forEach(block => block.addEventListener('click', handleClick));
    }, 3000);
  }
}

function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    if (userHits.filter(storedShipName => storedShipName === shipName).length === shipLength) {
      if (user === 'player') {
        infoDisplay.textContent = `You sunk the enemy's ${shipName}`;
        playerHits = userHits.filter(storedShipName => storedShipName !== shipName);
      }
      if (user === 'computer') {
        infoDisplay.textContent = `Enemy sunk your ${shipName}`;
        computerHits = userHits.filter(storedShipName => storedShipName !== shipName);
      }
      userSunkShips.push(shipName);
    }
  }

  checkShip('destroyer', 2);
  checkShip('submarine', 3);
  checkShip('cruiser', 3);
  checkShip('battleship', 4);
  checkShip('carrier', 5);

  console.log('playerHits', playerHits);
  console.log('playerSunkShips', playerSunkShips);

  if (playerSunkShips.length === 5) {
    infoDisplay.textContent = 'You sunk all the enemy ships. VICTORY!!!';
    gameOver = true;
  }
  if (computerSunkShips.length === 5) {
    infoDisplay.textContent = 'Enemy sunk all your ships. You LOST!';
    gameOver = true;
  }
}
