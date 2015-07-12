var game = angular.module('gameApp', [
  'ngRoute',
  'btford.socket-io'
]).factory('socket', function (socketFactory) {
  var myIoSocket = io.connect('http://192.168.1.21:3250');

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});

game.factory('terminal', function (){
  return {par1: '0'};
});

game.factory('permissions', function (){
  var permissions = {
    'user': '',

    'setCombination': function(){
      return (this.user === 'host')? true: false;
    },

    'play': function(){
      return (this.user === 'guest')? true: false;
    }
  };

  return permissions;
});

game.factory('mplayerID', function (){
  return { 'socketID': 0, 'status': 'guest' };
});

game.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/welcome', {
        templateUrl: 'app/views/welcome.html',
        controller: 'connectCtrl'
      }).
      when('/game', {
        templateUrl: 'app/views/game.html',
        controller: 'connectCtrl'
      }).
      otherwise({
        redirectTo: '/welcome'
      });
  }]);
