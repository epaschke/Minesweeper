let gameState = {}
let gameFunctions = {}

$( document ).ready(() => {
  //get storage from state or set new game state
  if (!localStorage.getItem("gameState") || JSON.parse(localStorage.getItem("gameState")).gameOver){
    gameState = {
      board: gameFunctions.newGame(9, 10),
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

  //start game
  gameFunctions.startGame();

  //prevent right click pulling up a menu
  $('#board')[0].oncontextmenu = function() { return false; }
  //on a cell click
  $('#board').mousedown('.cell', (e) => {
    const coords = e.target.id.split('-');

    //if game wasn't started yet
    if (!gameState.gameStarted){
      //place bombs
      gameFunctions.setCellStates(coords);
      //start timer
      gameState.timer = setInterval(function() {
        $('#timer').text((parseInt($("#timer").text()) + 1).toString());
        gameState.timerVal++;
      }, 1000);
      gameState.gameStarted = true;
    }

    //if game isn't over
    if (!gameState.gameOver){
      //save square by coords
      const square = gameState.board[coords[0]][coords[1]];
      switch(e.which){
        //left click
        case 1:
          //if square has not already been clicked or flagged
          if ($(`#${e.target.id}`).hasClass('unclicked')){
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
              gameFunctions.filterGame(coords);
            }
            //square is a bomb
            else if (square.bomb) {
              gameState.gameOver = true;
              //end game
              gameFunctions.checkEnd();
              $(`#${e.target.id}`).removeClass('unclicked').addClass('bomb').css('background-color', "red");
            }
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
      gameFunctions.checkEnd();
      localStorage.setItem("gameState", JSON.stringify(gameState));
    }
  });

  //start new game of certain difficulty
  $(".difficulty").click((e) => {
    //clear old states
    clearInterval(gameState.timer);
    $('#timer').text('0');

    let size = [];
    //establish size based on click
    switch(e.target.id){
      case 'beginner':
        size = [9, 10];
        break;
      case 'intermediate':
        size = [16, 40];
        break;
      case 'advanced':
        size = [20, 80];
        break;
      default: //default is beginner
        size = [9, 10];
    }
    //new game state
    gameState = {
      board: gameFunctions.newGame(size[0], size[1]),
      bombs: size[1],
      size: size[0],
      gameOver: false,
      gameStarted: false,
      timer: null,
      timerVal: 0
    };

    localStorage.setItem("gameState", JSON.stringify(gameState));
    //start game here
    gameFunctions.startGame();
  })
});


//GAME FUNCTIONS

//generate random number with a max size
gameFunctions.generate = (size) => Math.floor(Math.random() * Math.floor(size));

//fn to create new game
gameFunctions.newGame = (size, bombs) => {
  let tempGame = [];
  //create board of size with number of bombs
  for (let i = 0; i < size; i++){
    tempGame.push([]);
    for (let j = 0; j < size; j++){
      tempGame[i][j] = { state: 'unclicked', bomb: false, value: null };
    };
  };
  //return created board
  return tempGame;
}

//set bombs and values
gameFunctions.setCellStates = (firstClick) => {
  //placing bombs
  let placed = 0;
  //do not place bombs on first clicked square
  firstClick = [parseInt(firstClick[0]), parseInt(firstClick[1])];
  //randomly place bombs until all are placed
  while (placed < gameState.bombs) {
    let possible = [gameFunctions.generate(gameState.size), gameFunctions.generate(gameState.size)];
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
      //only count if square is not a bomb itself
      if (!gameState.board[i][j].bomb){
        let bordering = [];
        //push all adjacent squares into array
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
        //filter out bombs/non-bomb
        let bombCount = bordering.filter(f => f !== undefined ? f.bomb : false);
        //set bomb count to be a value
        gameState.board[i][j].value = bombCount.length;
      }
    }
  }
}

//fn to prepare game board
gameFunctions.startGame = () => {
  $("#board").empty();
  $('#message').text('');

  //map gameState to displayed board
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

  //set timer to saved value if reloading game
  if (gameState.gameStarted && !gameState.gameOver) {
    $("#timer").text(gameState.timerVal);
    //create timer fn and increment timerVal
    gameState.timer = setInterval(function() {
      gameState.timerVal++;
      $('#timer').text(gameState.timerVal.toString());
      localStorage.setItem("gameState", JSON.stringify(gameState));
    }, 1000);
  }
}

//fn to check if game is over
gameFunctions.checkEnd = () => {
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
    //count number of squares left that are not bombs, reduce to a boolean
    let gameIsOver = gameState.board.map(e => {
        return e.filter(c => {
          return (c.state === 'unclicked' && !c.bomb) || (c.state === 'flagged' && !c.bomb);
        }).length;
    }).reduce((acc, val) => { return acc + parseInt(val); }, 0) === 0;

    //if there are no unclicked squares left, player wins!
    if (gameIsOver) {
      //clear interval and game state
      clearInterval(gameState.timer);
      gameState.bombs = 0;
      //update messsage
      $("#message").text("Game over. You won!");
      //map over game board and put flags on unflagged bombs
      gameState.board.map((e, row) => {
        e.map((cell, col) => {
          if (cell.bomb && cell.state === 'unclicked'){
            $(`#${row}-${col}`).removeClass('unclicked').addClass("flagged");
          }
        })
      });
    }
    gameState.gameOver = gameIsOver;
  }
}

//filter out adjacent blanks
gameFunctions.filterGame = (coords) => {
  coords = [parseInt(coords[0]), parseInt(coords[1])];
  //check East square
  if (coords[1] + 1 < gameState.size){
    gameFunctions.checkCoord(coords[0], coords[1] + 1);
  }
  //check West square
  if (coords[1] - 1 >= 0){
    gameFunctions.checkCoord(coords[0], coords[1] - 1);
  }
  //check North South
  if (coords[0] - 1 >= 0){
    //check North square
    gameFunctions.checkCoord(coords[0] - 1, coords[1]);

    //check North corners
    if (coords[1] - 1 >= 0){
      gameFunctions.checkCoord(coords[0] - 1, coords[1] - 1);
    }
    if (coords[1] + 1 < gameState.size){
      gameFunctions.checkCoord(coords[0] - 1, coords[1] + 1);
    }
  }
  if (coords[0] + 1 < gameState.size) {
    //check South square
    gameFunctions.checkCoord(coords[0] + 1, coords[1]);

    //check South corners
    if (coords[1] - 1 >= 0){
      gameFunctions.checkCoord(coords[0] + 1, coords[1] - 1);
    }
    if (coords[1] + 1 < gameState.size){
      gameFunctions.checkCoord(coords[0] + 1, coords[1] + 1);
    }
  }
}

//check/change single coordinate
gameFunctions.checkCoord = (coord0, coord1) => {
  let square = gameState.board[coord0][coord1];
  //if square has already been visited
  if (square.state === 'clicked' || square.state === 'val') {
    return;
  }
  //if square has been flagged
  if (square.state === 'flagged') {
    //skip current square and keep going
    gameFunctions.filterGame([coord0, coord1]);
  //if square is blank (not near a bomb)
  } else if (square.value === 0) {
      //set square to clicked state
      square.state = 'clicked';
      $(`#${coord0}-${coord1}`).removeClass('unclicked').addClass('clicked');
      //call filter game with current square to check adjacents
      gameFunctions.filterGame([coord0, coord1]);
  //if square is unclicked and near a bomb
  } else if (square.value > 0) {
    //set square to display its value
    square.state = 'val';
    $(`#${coord0}-${coord1}`).removeClass('unclicked').addClass('val').addClass('c' + square.value);
    $(`#${coord0}-${coord1}`).text(square.value.toString());
    //do not call filter game again
  }
}
