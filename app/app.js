var game = angular.module('gameApp', [
  'ngRoute',
  'btford.socket-io'
]).factory('socket', function (socketFactory) {
  return socketFactory();
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
