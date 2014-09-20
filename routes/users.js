module.exports = [
  {
    url: '/users',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      srv.db.find({}, 'users', {})
      .then(function (users) {
        for (var i = 0; i < users.length; i++) {
          delete users[i]._id;
          delete users[i].password;
        }
        res.send(users);
      }, function (err) { next(err); });
    }
  },
  {
    url: '/admins/:name',
    method: 'put',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.status(401).send(new srv.err('Sudo required.'));
      if (typeof req.params.name === 'undefined')
        return res.status(400).send(new srv.err('Please specify a name.'));
      srv.db.update({name: req.params.name}, {$set: {admin: true}}, 'users', {})
      .then(function () {
        var log = new srv.log(req, req.session.user.name + ' granted administrative access to ' + req.params.name, 'ADMIN_GRANTED');
        log.store();
        res.send();
      }, function (err) { next(err); });
    }
  },
  {
    url: '/admins/:name',
    method: 'delete',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.status(401).send(new srv.err('Sudo required.'));
      if (typeof req.params.name === 'undefined')
        return res.status(400).send(new srv.err('Please specify a name.'));
      if (req.params.name === 'root' || req.params.name === req.session.user.name)
        return res.status(400).send(new srv.err('You cannot revoke administrative access from this user.'));
      srv.db.update({name: req.params.name}, {$set: {admin: false}}, 'users', {})
      .then(function () {
        var log = new srv.log(req, req.session.user.name + ' revoked administrative access from ' + req.params.name, 'ADMIN_REVOKED');
        log.store();
        res.send();
      }, function (err) { next(err); });
    }
  },
  {
    url: '/users/:name',
    method: 'delete',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.status(401).send(new srv.err('Sudo required.'));
      if (typeof req.params.name === 'undefined')
        return res.status(400).send(new srv.err('Please specify a name.'));
      if (req.params.name === req.session.user.name)
        return res.status(400).send(new srv.err('You cannot delete yourself in the console.'));
      srv.db.remove({name: req.params.name}, 'users', {})
      .then(function () {
        var log = new srv.log(req, req.session.user.name + ' deleted user ' + req.params.name, 'USER_DELETED_ADMIN');
        log.store();
        res.send();
      }, function (err) { next(err); });
    }
  }
];
