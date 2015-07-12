game.controller('connectCtrl', ['$scope', 'socket', 'mplayerID', 'permissions',
  function ($scope, socket, mplayerID, permissions ) {

    gameBoard.drowBoard();
    var secondPlayer;

    $scope.connectionBtn = 'Connectiong ...' + mplayerID.socketID;

    socket.on('welcome', function (data) {
        $scope.welcomeMsg = data.name;
        window.terminal.echo('///--- '+data.name+' ---///');
    });

    var hiddeFunction = function(){
      $('.hidde-comb').addClass('hidde-comb-animate');
    };

    socket.on('multiplayer', function (data) {
        permissions.user = data.status;

        $scope.multiplayerUser = 'You will play with '+data.name;
        window.terminal.echo('------------------------------');
        window.terminal.echo('You will play with '+data.name+' ('+mplayerID.status+')');
        // Connected players name and socet id
        secondPlayer = data;
        mplayerID.socketID = data.socketID;
        mplayerID.status = data.status;
        //end

        $scope.playersNameMsg = data.name;

    });



  }]);

game.controller('gameCtrl', ['$scope', '$http', '$element', 'socket', 'mplayerID', 'permissions', '$route',
  function ($scope, $http, $element, socket, mplayerID, permissions, $route) {
    var pinboxSelection = '';
    var unlocledRow = 11;
    var unlockButton = 0;
    _combination = [0,0,0,0];
    _combinationSet = [];

    /*
    * Coming from the players app
    */
    socket.on('pin-down', function (data) {
      window.terminal.echo('---------> user moved pin somewhere');
      window.terminal.echo(data.position);
      pinboxSelection = data.pinID;
      $scope.setPinOnBoard(data.position, 'recived');

    });

    socket.on('check', function (data) {
      window.terminal.echo('---------> user checking his combination. ??????');
      $scope.setResult(data.row);

    });

    socket.on('set-combination', function (data) {
      window.terminal.echo('---------> host user set combination. ******');
      window.terminal.echo(data.combination);
      _combinationSet = data.combination;
      unlocledRow = 1;
      _combination = [0,0,0,0];
      $element.find('.resid11-5 .go-button').css('display', 'none');
      if(permissions.play()){
        unlocledRow = 1;
        window.terminal.echo('You can play.');
      }
    });
    /*
    * End
    */

    $scope.$on('$routeChangeSuccess', function(next, current) {
      initGame();
    });



    var initGame = function(){
      if(permissions.setCombination()){
        unlocledRow = 11;
        window.terminal.echo('We unlocked the row on '+unlocledRow+'th, because you have: '+permissions.setCombination());
      }else{
        unlocledRow = 20;
        $('.hidde-comb').css('width', '100%');
        window.terminal.echo('We locked the row on '+unlocledRow+'th');
      }
    };

    $scope.testMesage = mplayerID.socketID;


    $scope.selectPin = function(num){
      if(pinboxSelection !== num){
        if(pinboxSelection === ''){
          pinboxSelection = num;
          $element.find('.pinbox-item-'+num).css('border', '#A39F9F solid 1px');
        }else{
          $element.find('.pinbox-item-'+pinboxSelection).css('border', 'none');
          $element.find('.pinbox-item-'+num).css('border', '#A39F9F solid 1px');
          pinboxSelection = num;
        }
        $element.find('.pinbox-item-'+num).css('border', '#A39F9F solid 1px');
      }
    };

    $scope.setPinOnBoard = function(position, source = ''){
      if( position[0] === unlocledRow || source === 'recived' ){
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

        if(mplayerID.status === 'guest'){
          socket.emit('pin-down',{
            'pinID': pinboxSelection,
            'position': [position[0], position[1]],
            'socketID': mplayerID.socketID
          });
        }
      }



    };

    $scope.setResult = function(val){
      window.terminal.echo('Checking combination....');
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
             window.terminal.echo('You won! :-)');
             $scope.popupMsg = 'YOU WON!';
             $('#win-model').openModal();
        }else{
          window.terminal.echo('Not the right combination.');
          if(val === 7){
            window.terminal.echo('Sorry, you lost! :-(');
            $scope.popupMsg = 'YOU LOST!';
            $('#win-model').openModal();
          }
        };

        /*
        * Win status can be:
        *       0 -> not right comb. and go to another
        *       1 -> player won
        *       2 -> player lost (you won)
        */
        if(mplayerID.status === 'guest'){
          window.terminal.echo('you pressed check button.');
          if(win){
            var winStatus = win;
          }else{
            if(val === 7){
              var winStatus = 2;
              };
          };
          socket.emit('check',{
            'row': val,
            'win': winStatus,
            'socketID': mplayerID.socketID
          });
        };

    };
  };

    $scope.setCombinationInGame = function(){
        if(unlockButton === 1) {
          _combinationSet = _combination.slice(0);
          unlocledRow = 1;
          _combination = [0,0,0,0];
          $element.find('.resid11-5 .go-button').css('display', 'none');
          if(permissions.setCombination()){
            /*
            * Send combination to guest player
            */
            socket.emit('set-combination',{
              'combination': _combinationSet,
              'socketID': mplayerID.socketID
            });
            unlocledRow = 20;
            window.terminal.echo('You can watch!');
          }
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
      var ballSize = board.pointWidth / 2;
      var ballSizeMargin = ballSize / 2;
      $('.spin-ball').width(ballSize).height(ballSize).css({
        'margin-left': ballSizeMargin+'px',
        'margin-top': ballSizeMargin+'px'
      });

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
      var numT = 7
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
              color = '#F79941';
              break;
          case 2:
              color = '#CB262D';
              break;
          case 3:
              color = '#5F80C3';
              break;
          case 4:
              color = '#47B683';
              break;
          case 5:
              color = '#AD59A3';
              break;
          case 6:
              color = '#818598';
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
