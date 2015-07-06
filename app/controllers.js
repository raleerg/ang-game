game.controller('connectCtrl', ['$scope',
  function ($scope, socket) {

    gameBoard.drowBoard();
    $scope.welcomeMsg = 'Welcome User!';


  }]);

game.controller('gameCtrl', ['$scope', '$http', '$element',
  function ($scope, $http, $element) {
    var pinboxSelection = '';
    var unlocledRow = 11;
    var unlockButton = 0;
    _combination = [0,0,0,0];
    _combinationSet = [];


    $scope.selectPin = function(num){
      if(pinboxSelection !== num){
        if(pinboxSelection === ''){
          pinboxSelection = num;
          $element.find('.pinbox-item-'+num).css('background', '#000');
        }else{
          $element.find('.pinbox-item-'+pinboxSelection).css('background', '#d1d1d1');
          $element.find('.pinbox-item-'+num).css('background', '#000');
          pinboxSelection = num;
        }
        $element.find('.pinbox-item-'+num).css('background', '#000');
      }
    };

    $scope.setPinOnBoard = function(position){
      if( position[0] === unlocledRow ){
        var openGoButton = 1;
        var color = gameBoard.getColor(pinboxSelection);
        $element.find('.pinid'+position[0]+'-'+position[1]+' .spin-ball').css('background', color);
        _combination[position[1]-1] = pinboxSelection;
        for(var i = 0; i < _combination.length; i++){
          if(_combination[i] === 0) { openGoButton = 0; };
        }

        if(openGoButton === 1) {
          unlockButton = 1;
          $element.find('.resid'+position[0]+'-5 .go-button').css('display', 'block');
        }else{
          unlockButton = 0;
          $element.find('.resid'+position[0]+'-5 .go-button').css('display', 'none');
        }
      }
    };

    $scope.setResult = function(val){
      var win = 1;
      if( val === unlocledRow && unlockButton === 1 ){
        unlocledRow = 20; // lock every row while setting results
        var result = [];
        var combCopy = _combination;
        var _combinationSetCopy = _combinationSet.slice(0);

        // find and save same color and same place
        for(var i = 0; i < combCopy.length; i++){
          if(combCopy[i] === _combinationSetCopy[i]) {
            result.push(1);
            combCopy[i] = 10;
            _combinationSetCopy[i] = 11;
          };
        }

        // find and  save same color and wrong place
        if(combCopy){
          var findIt;
          for(var i = 0; i < _combinationSetCopy.length; i++){
            findIt = 0;
            for(var j = 0; j < combCopy.length; j++){
                if( _combinationSetCopy[i] === combCopy[j] && findIt === 0 ){
                  result.push(2);
                  _combinationSetCopy[i] = 11;
                  combCopy[j] = 10;
                  findIt = 1;
                  win = 0;
                }
            }
          }
        }

        if(result.length < 4){
          for(var i = result.length; i < 4; i++){
            result.push(0);
            win = 0;
          }
        }

        gameBoard.setResult(val, result);
        $element.find('.resid'+val+'-5 .go-button').css('display', 'none');

        unlocledRow = val+1;
        _combination = [0,0,0,0];

        if(win){
            //Materialize.toast('<span>You Won!</span><a class=&quot;btn-flat yellow-text&quot; href=&quot;#!&quot;>next<a>', 10000);
             $scope.popupMsg = 'YOU WON!';
             $('#win-model').openModal();
        }else{
          if(val === 10){
            $scope.popupMsg = 'YOU LOST!';
            $('#win-model').openModal();
          }
        };

    };
  };

    $scope.setCombinationInGame = function(){
    /*  var color, id;

      for(var i = 0; i < _combinationSet.length; i++){
          color = gameBoard.getColor(_combinationSet[i]);
          id = i+1
          $element.find('.comb'+ id +' .spin-ball').css('background', color);
      }*/
        if(unlockButton === 1) {
          _combinationSet = _combination.slice(0);
          unlocledRow = 1;
          _combination = [0,0,0,0];
          $element.find('.resid11-5 .go-button').css('display', 'none');
        }
    };

    $scope.hiddeComb = function(){
      if(_combinationSet.length){
        if(!$( ".hidde-comb" ).width()){
          $( ".hidde-comb" ).animate({
            width: "100%"
          }, 900 );
        }else{
          $( ".hidde-comb" ).animate({
            width: "0%"
          }, 900 );
        }
      };
    };

    //setCombinationInGame();
    $scope.selectPin(1);


  }]);

var gameBoard = {
    _boardPercentage: 70,
    _screenWidth: window.innerWidth,
    _screenHeight: window.innerHeight,

    drowBoard: function(){
      var board = this.getBoardSize(this._screenWidth, this._screenHeight, this._boardPercentage);

      $('#game-table').width(board.boardWidth).height(board.boardHeight).css('padding-top', board.boardPadding + 'px');
      $('#combination').width(board.boardWidth).css({
        'padding-top': board.boardPadding + 'px',
        'padding-bottom': board.boardPadding + 'px'
      });
      $('.pin').width(board.pointWidth).height(board.pointWidth).css('margin-left', board.boardPadding + 'px');
      $('.board-row').css({
        'padding-bottom': board.boardPadding + 'px'
      });
      $('#pinbox').width(board.pinboxWidth).height(board.pinboxHeight);
      $('#pinbox .pin').css('margin-top', board.boardPadding + 'px');
      $('.spin-ball').width(board.pointWidth).height(board.pointWidth);

      resPercentage = 20;
      var resPointsSize = Math.round((resPercentage / 100) * board.pointWidth);
      var resPading = (board.pointWidth - (resPointsSize * 2)) / 3;
      $('.res').width(resPointsSize).height(resPointsSize).css({
          'margin-left': resPading+'px',
          'margin-top': resPading+'px'
        });
      $('.go-button, .set-button').width(board.pointWidth).height(board.pointWidth);
      $('.hidde-comb').height(board.pointWidth+(board.boardPadding*2));
    },

    getBoardSize: function(screenWidth, screenHeight, boardPercentage){
      var numT = 10
      var numPoints = 4

      var boardWidth = Math.round((boardPercentage / 100) * screenWidth);
      var boardPadding = Math.round((2 / 100) * boardWidth);
      var pointWidth = (boardWidth - boardPadding * ( numPoints + 2 )) / (numPoints+1);
      var boardHeight = (pointWidth * numT) + ((numT + 1) * boardPadding);
      var pinboxWidth = pointWidth + (2 * boardPadding);
      var pinboxHeight = (pointWidth * 7) + ((7 + 1) * boardPadding);
      return { 'boardWidth': boardWidth, 'boardHeight': boardHeight, 'boardPadding': boardPadding, 'pointWidth': pointWidth, 'pinboxWidth': pinboxWidth, 'pinboxHeight': pinboxHeight };
    },

    getColor: function(colorID){
        var color = '#d1d1d1';
        switch(colorID) {
          case 1:
              color = '#CC3300';
              break;
          case 2:
              color = '#009900';
              break;
          case 3:
              color = '#663300';
              break;
          case 4:
              color = '#0099FF';
              break;
          case 5:
              color = '#A7A7A7';
              break;
          case 6:
              color = '#5C005C';
              break;
        }
        return color;
    },

    setResult: function(resID, result){
      var color, key;
      for(var i = 0; i <= 4; i++){
        switch (result[i]) {
          case 1:
            color = '#fff';
            break;
          case 2:
            color = '#000';
            break;
          default:
            color = '#a7a7a7';
        }
        key = i + 1;
        $('.resid'+resID+'-5 .res-'+key).css('background', color);
      }
    }
};
