let gameState = {}
let generate = (size) => Math.floor(Math.random() * Math.floor(size));

//
$( document ).ready(() => {
  //get storage from state or set new game state
  if (!localStorage.getItem("gameState") || JSON.parse(localStorage.getItem("gameState")).gameOver){
    gameState = {
      board: newGame(9, 10),
      bombs: 10,
      size: 9,
      gameOver: false,
      gameStarted: false,
      timer: null,
      timerVal: 0
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
  } else {
    gameState = JSON.parse(localStorage.getItem("gameState"));
  }

  startGame();

  //prevent right click pulling up a menu
  $('#board')[0].oncontextmenu = function() { return false; }
  //on a cell click
  $('#board').mousedown('.cell', (e) => {
    const coords = e.target.id.split('-');

    if (!gameState.gameStarted){
      setCellStates(coords);
      //start timer
      gameState.timer = setInterval(function() {
        $('#timer').text((parseInt($("#timer").text()) + 1).toString());
        gameState.timerVal++;
      }, 1000);
      gameState.gameStarted = true;
    }

    if (!gameState.gameOver){
      //save square by coords
      const square = gameState.board[coords[0]][coords[1]];
      switch(e.which){
        //left click
        case 1:
          //square is near a bomb
          if (square.value > 0){
            $(`#${e.target.id}`).removeClass('unclicked').addClass('val');
            $(`#${e.target.id}`).text(square.value.toString()).addClass('c' + square.value);
            square.state = 'val';
          }
          //square is not near a bomb
          else if (square.value === 0){
            square.state = 'clicked';
            $(`#${e.target.id}`).removeClass('unclicked').addClass('clicked');
            //filter nearby squares
            filterGame(coords);
          }
          //square is a bomb
          else if (square.bomb) {
            gameState.gameOver = true;
            //end game
            checkEnd();
            $(`#${e.target.id}`).removeClass('unclicked').addClass('bomb').css('background-color', "red");
          }
          break;
        //right click
        case 3:
            //place flag
            if ($(`#${e.target.id}`).hasClass('unclicked')){
              $(`#${e.target.id}`).removeClass('unclicked').addClass('flagged');
              square.state = 'flagged';
              $('#bombs').text(--gameState.bombs);
            //get rid of flag
            } else if ($(`#${e.target.id}`).hasClass('flagged')){
              $(`#${e.target.id}`).removeClass('flagged').addClass('unclicked');
              square.state = 'unclicked';
              $('#bombs').text(++gameState.bombs);
            }
          break;
        default:
      }
      //check if game is over
      checkEnd();
      localStorage.setItem("gameState", JSON.stringify(gameState));
    }
  });

  //start new game
  $(".difficulty").click((e) => {
    //clear old states
    clearInterval(gameState.timer);
    $('#timer').text('0');

    let size = [];
    switch(e.target.id){
      case 'beginner':
        size = [9, 10];
        break;
      case 'intermediate':
        size = [16, 40];
        break;
      case 'advanced':
        size = [20, 100];
        break;
      default:
        size = [9, 10];
    }
    //new game state
    gameState = {
      board: newGame(size[0], size[1]),
      bombs: size[1],
      size: size[0],
      gameOver: false,
      gameStarted: false,
      timer: null,
      timerVal: 0
    };

    localStorage.setItem("gameState", JSON.stringify(gameState));
    startGame();
  })
});


//GAME FUNCTIONS

//fn to create new game
const newGame = (size, bombs) => {
  //make empty array
  let tempGame = [];
  for (let i = 0; i < size; i++){
    tempGame.push([]);
    for (let j = 0; j < size; j++){
      tempGame[i][j] = { state: 'unclicked', bomb: false, value: null };
    };
  };


  return tempGame;
}

const setCellStates = (firstClick) => {
  //placing bombs
  let placed = 0;
  firstClick = [parseInt(firstClick[0]), parseInt(firstClick[1])];
  while (placed < gameState.bombs) {
    let possible = [generate(gameState.size), generate(gameState.size)];
      let square = gameState.board[possible[0]][possible[1]];
      if (!square.bomb && possible[0] !== firstClick[0] && possible[1] !== firstClick[1]){
        square.bomb = true;
        square.value = -1;
        placed++;
      }
  }

  //count border bombs
  for (let i = 0; i < gameState.size; i++){
    for (let j = 0; j < gameState.size; j++){
      if (!gameState.board[i][j].bomb){
        let bordering = [];
        if (i > 0){
          bordering.push(gameState.board[i - 1][j - 1]);
          bordering.push(gameState.board[i - 1][j]);
          bordering.push(gameState.board[i - 1][j + 1]);
        }
        bordering.push(gameState.board[i][j - 1]);
        bordering.push(gameState.board[i][j + 1]);
        if (i < gameState.size - 1){
          bordering.push(gameState.board[i + 1][j - 1]);
          bordering.push(gameState.board[i + 1][j]);
          bordering.push(gameState.board[i + 1][j + 1]);
        }
        let bombCount = bordering.filter(f => f !== undefined ? f.bomb : false);
        gameState.board[i][j].value = bombCount.length;
      }
    }
  }
}

//fn to prepare game board
const startGame = () => {
  $("#board").empty();
  $('#message').text('');

  //map gameState to board
  gameState.board.map((e, row) => {
    $('#board').append(`<div id="r${row}" class="row"></div>`)
    e.map((cell, col) => {
      $(`#r${row}`).append(`<div id="${row}-${col}" class="cell ${cell.state}"></div>`);
      if (cell.state === 'val'){
        $(`#${row}-${col}`).text(cell.value.toString()).addClass('c' + cell.value);
      }
    })
  })
  $('#bombs').text(gameState.bombs);

  //fix timer if refreshing page
  if (gameState.gameStarted && !gameState.gameOver) {
    $("#timer").text(gameState.timerVal);
    gameState.timer = setInterval(function() {
      gameState.timerVal++;
      $('#timer').text(gameState.timerVal.toString());
      localStorage.setItem("gameState", JSON.stringify(gameState));
    }, 1000);
  }
}

//fn to check if game is over
const checkEnd = () => {
  //if user hit bomb
  if (gameState.gameOver) {
    clearInterval(gameState.timer);
    gameState.bombs = 0;
    //display bombs
    gameState.board.map((e, row) => {
      e.map((cell, col) => {
        if (cell.bomb && cell.state === 'unclicked'){
          $(`#${row}-${col}`).removeClass('unclicked').addClass("bomb");
        } else if (cell.state === 'flagged' && !cell.bomb){
          $(`#${row}-${col}`).text('X');
        }
      })
    });
  }
  //if user made move
  else {
    //count number of squares left that are not bombs
    let a = gameState.board.map(e => {
        return e.filter(c => {
          return (c.state === 'unclicked' && !c.bomb) || (c.state === 'flagged' && !c.bomb);
        }).length;
    }).reduce((a, v) => { return a + parseInt(v); }, 0) === 0;

    if (a) {
      clearInterval(gameState.timer);
      gameState.bombs = 0;
      $("#message").text("Game over. You won!");
      gameState.board.map((e, row) => {
        e.map((cell, col) => {
          if (cell.bomb && cell.state === 'unclicked'){
            $(`#${row}-${col}`).removeClass('unclicked').addClass("flagged");
          }
        })
      });
    }
    gameState.gameOver = a;
  }
}

const filterGame = (coords) => {
  coords = [parseInt(coords[0]), parseInt(coords[1])];
  //check S
  for (let i = coords[0] + 1; i < gameState.size; i++){
    console.log('s')
    let val = checkCoord(i, coords[1]);
    if (val === false) {
      console.log('break')
      break;
    }
  }
  //check N
  for (let i = coords[0] - 1; i >= 0; i--){
    console.log('n')
    let val = checkCoord(i, coords[1]);
    if (val === false) {
      console.log('break')
      break;
    }
  }
  //check E
  for (let i = coords[1] + 1; i < gameState.size; i++){
    console.log('e')
    let val = checkCoord(coords[0], i);
    if (val === false) {
      console.log('break')
      break;
    }
  }
  //check W
  for (let i = coords[1] - 1; i >= 0; i--){
    console.log('w')
    let val = checkCoord(coords[0], i);
    if (val === false) {
      console.log('break')
      break;
    }
  }
  //check corners
    if (coords[0] - 1 >= 0){
      if (coords[1] - 1 >= 0){
        checkCoord(coords[0] - 1, coords[1] - 1);
      }
      if (coords[1] + 1 < gameState.size){
        checkCoord(coords[0] - 1, coords[1] + 1);
      }
    }
    if (coords[0] + 1 < gameState.size) {
      if (coords[1] - 1 >= 0){
        checkCoord(coords[0] + 1, coords[1] - 1);
      }
      if (coords[1] + 1 < gameState.size){
        checkCoord(coords[0] + 1, coords[1] + 1);
      }
    }
}

let count = 0;
//check/change single coordinate
const checkCoord = (coord0, coord1) => {
  let square = gameState.board[coord0][coord1];
  console.log('checkcoord', square);
  count++;
  console.log(count);

  if (square.state === 'clicked' || square.state === 'val') {
    return false;
  }
  //if square is not near a bomb
  if (square.state === 'flagged') {
    return true;
  }
  if (square.value === 0) {
      square.state = 'clicked';
      $(`#${coord0}-${coord1}`).removeClass('unclicked').addClass('clicked');
      filterGame([coord0, coord1]);
      return true;
  //if square is near a bomb
  } else if (square.value > 0) {
    square.state = 'val';
    $(`#${coord0}-${coord1}`).removeClass('unclicked').addClass('val').addClass('c' + square.value);
    $(`#${coord0}-${coord1}`).text(square.value.toString());
    return false;
  }
}
