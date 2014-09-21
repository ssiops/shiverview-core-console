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
    $http({
      url: '/console/status',
      method: 'get'
    })
    .success(function (status) {
      status.buildDate = new Date(new Date().getTime() - status.uptime * 1000);
      $scope.status = status;
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
  };
  $scope.setAdmin = function (name) {
    $http({
      url: '/console/admins/' + name,
      method: 'put'
    })
    .success(successHandler)
    .error(errorHandler);
  };
  $scope.revokeAdmin = function (name) {
    $http({
      url: '/console/admins/' + name,
      method: 'delete'
    })
    .success(successHandler)
    .error(errorHandler);
  };
  $scope.removeUser = function (name) {
    $http({
      url: '/console/users/' + name,
      method: 'delete'
    })
    .success(successHandler)
    .error(errorHandler);
  };
  $scope.updateUsers = function () {
    $http({
      url: '/console/users',
      method: 'get'
    })
    .success(function (users) {
      $scope.users = users;
    })
    .error(function (err) {
      $rootScope.$broadcast('errorMessage', err.message);
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
  };
  $scope.updateModule = function (name) {
    $http({
      url: '/console/modules/' + name,
      method: 'post',
      data: {action: 'update'}
    })
    .success(successHandler)
    .error(errorHandler);
  };
  $scope.unloadModule = function (name) {
    $http({
      url: '/console/modules/' + name,
      method: 'delete'
    })
    .success(successHandler)
    .error(errorHandler);
  };
  $scope.updateModules = function () {
    $http({
      url: '/console/modules',
      method: 'get'
    })
    .success(function (modules) {
      $scope.modules = modules;
    })
    .error(function (err) {
      $rootScope.$broadcast('errorMessage', err.message);
    });
  };
  $scope.updateModules();
}])
.controller('consoleLogsCtrl', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
  $scope.updateLogs = function (e) {
    if (e) e.preventDefault();
    var query = {};
    if (typeof $scope.queryInput === 'string') {
      var payload = $scope.queryInput.split(':');
      if (payload[0].length > 0)
        query.t = payload[0];
      if (payload.length > 1)
        query.l = payload[1];
    }
    $http({
      url: '/console/logs',
      method: 'get',
      params: query
    })
    .success(function (logs) {
      $scope.logs = logs;
    })
    .error(function (err) {
      $rootScope.$broadcast('errorMessage', err.message);
    });
  };
  $scope.updateLogs();
}]);
})(window.angular);
