(function (angular) {
angular.module('shiverview')
.controller('consoleOverviewCtrl', ['$scope', '$http', '$rootScope', '$location', 'user', function ($scope, $http, $rootScope, $location, user) {
  $scope.user = user.get();
  if (typeof $scope.user === 'undefined')
    $location.path('/users/signin');
  else if (typeof $scope.user.then === 'function') {
    $scope.user.success(function () {
      $scope.user = user.get();
      if (!$scope.user.admin)
        $location.path('/users/profile');
    })
    .error(function () { $location.path('/users/signin'); });
  }
  else if ($scope.user.admin !== true)
    $location.path('/users/profile');
  $scope.updateStatus = function () {
    $scope.statusLoaded = false;
    $http({
      url: '/console/status',
      method: 'get'
    })
    .success(function (status) {
      status.buildDate = new Date(new Date().getTime() - status.uptime * 1000);
      $scope.status = status;
      $scope.statusLoaded = true;
    })
    .error(function (err) {
      $rootScope.$broadcast('errorMessage', err.message);
    });
  };
  $scope.updateStatus();
}])
.controller('consoleUsersCtrl', ['$scope', '$http', '$rootScope', 'user', function ($scope, $http, $rootScope, user) {
  var successHandler = function () {
    $rootScope.$broadcast('successMessage', 'Changes saved successfully.');
    $scope.updateUsers();
  };
  var errorHandler = function (err) {
    if (err.message === 'Sudo required.') return user.sudo();
    $rootScope.$broadcast('errorMessage', err.message);
    $scope.usersLoaded = true;
  };
  $scope.setAdmin = function (name) {
    $http({
      url: '/console/admins/' + name,
      method: 'put'
    })
    .success(successHandler)
    .error(errorHandler);
    $scope.usersLoaded = false;
    $scope.message = 'Saving changes...';
  };
  $scope.revokeAdmin = function (name) {
    $http({
      url: '/console/admins/' + name,
      method: 'delete'
    })
    .success(successHandler)
    .error(errorHandler);
    $scope.usersLoaded = false;
    $scope.message = 'Saving changes...';
  };
  $scope.removeUser = function (name) {
    $http({
      url: '/console/users/' + name,
      method: 'delete'
    })
    .success(successHandler)
    .error(errorHandler);
    $scope.usersLoaded = false;
    $scope.message = 'Saving changes...';
  };
  $scope.updateUsers = function () {
    $scope.usersLoaded = false;
    $http({
      url: '/console/users',
      method: 'get'
    })
    .success(function (users) {
      $scope.users = users;
      $scope.usersLoaded = true;
    })
    .error(function (err) {
      $rootScope.$broadcast('errorMessage', err.message);
      $scope.usersLoaded = true;
    });
  };
  $scope.updateUsers();
}])
.controller('consoleModulesCtrl', ['$scope', '$http', '$rootScope', 'user', function ($scope, $http, $rootScope, user) {
  var successHandler = function () {
    $rootScope.$broadcast('successMessage', 'Changes applied successfully.');
    $scope.updateModules();
  };
  var errorHandler = function (err) {
    if (err.message === 'Sudo required.') return user.sudo();
    $rootScope.$broadcast('errorMessage', err.message);
    $scope.modulesLoaded = true;
  };
  $scope.loadModule = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.newModuleName === 'undefined')
      return;
    var payload = $scope.newModuleName.split(':');
    if (payload.length === 1)
      payload.push('');
    $http({
      url: '/console/modules/' + payload[0],
      method: 'put',
      data: {ref: payload[1]}
    })
    .success(successHandler)
    .error(errorHandler);
    $scope.modulesLoaded = false;
    $scope.message = 'Applying changes...';
  };
  $scope.updateModule = function (name) {
    $http({
      url: '/console/modules/' + name,
      method: 'post',
      data: {action: 'update'}
    })
    .success(successHandler)
    .error(errorHandler);
    $scope.modulesLoaded = false;
    $scope.message = 'Applying changes...';
  };
  $scope.unloadModule = function (name) {
    $http({
      url: '/console/modules/' + name,
      method: 'delete'
    })
    .success(successHandler)
    .error(errorHandler);
    $scope.modulesLoaded = false;
    $scope.message = 'Applying changes...';
  };
  $scope.updateModules = function () {
    $scope.modulesLoaded = false;
    $http({
      url: '/console/modules',
      method: 'get'
    })
    .success(function (modules) {
      $scope.modules = modules;
      $scope.modulesLoaded = true;
    })
    .error(function (err) {
      $rootScope.$broadcast('errorMessage', err.message);
      $scope.modulesLoaded = true;
    });
  };
  $scope.updateModules();
}])
.controller('consoleLogsCtrl', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
  var getTime = function (str) {
    if (typeof str !== 'string' || str.length < 1)
      return 0;
    var relativePatt = /-([0-9]+[YMdhms])+/;
    if (relativePatt.test(str)) {
      var now = new Date().getTime();
      var matches = str.match(/[0-9]+[YMdhms]/g);
      for (var i = 0; i < matches.length; i++) {
        var unit = matches[i].charAt(matches[i].length - 1);
        var value = matches[i].substr(0, matches[i].length - 1);
        switch (unit) {
          case 'Y':
            now -= value * 365 * 24 * 60 * 60 * 1000;
            break;
          case 'M':
            now -= value * 30 * 24 * 60 * 60 * 1000;
            break;
          case 'd':
            now -= value * 24 * 60 * 60 * 1000;
            break;
          case 'h':
            now -= value * 60 * 60 * 1000;
            break;
          case 'm':
            now -= value * 60 * 1000;
            break;
          case 's':
            now -= value * 1000;
        }
      }
      return now;
    } else
      return new Date(str).getTime();
  };
  $scope.updateLogs = function (e) {
    if (e) e.preventDefault();
    $scope.logsLoaded = false;
    var query = {};
    if (typeof $scope.queryInput === 'string') {
      var tag = /^[a-zA-Z0-9_.\-]+/.exec($scope.queryInput);
      var limit = /#[0-9]+/.exec($scope.queryInput);
      var range = /@-?[0-9YMdhms :\/]*~-?[0-9YMdhms :\/]*/.exec($scope.queryInput);
      if (tag)
        query.t = tag[0];
      if (limit)
        query.l = limit[0].substring(1);
      if (range) {
        range = range[0].substring(1).split('~');
        if (range[0].length > 0)
          query.start = getTime(range[0]);
        if (range[1].length > 0)
          query.end = getTime(range[1]);
      }
    }
    $http({
      url: '/console/logs',
      method: 'get',
      params: query
    })
    .success(function (logs) {
      $scope.logs = logs;
      $scope.logsLoaded = true;
    })
    .error(function (err) {
      $rootScope.$broadcast('errorMessage', err.message);
      $scope.logsLoaded = true;
    });
    $http({
      url: '/console/logs/tags',
      method: 'get'
    })
    .success(function (tags) {
      $scope.logTags = tags.sort();
    });
    $scope.logsLoaded = false;
  };
  $scope.prependQuery = function (str) {
    if (typeof $scope.queryInput === 'undefined')
      $scope.queryInput = str;
    else
      $scope.queryInput = $scope.queryInput.replace(/^[a-zA-Z0-9_.\-]*/, str);
  };
  $scope.updateLogs();
}]);
})(window.angular);
