var async = require('async');
var exec = require('child_process').exec;
var fse = require('fs.extra');

module.exports = [
  {
    url: '/modules',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      var apps = [];
      for (var app in srv.manager.apps) {
        apps.push({
          name: app,
          desc: srv.manager.apps[app].desc
        });
      }
      return res.send(apps);
    }
  },
  {
    url: '/modules/:name',
    method: 'put',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.status(401).send(new srv.err('Sudo required.'));
      if (typeof req.params.name === 'undefined')
        return res.status(400).send(new srv.err('Please specify a name.'));
      if (req.body.ref) {
        var command = 'npm install ';
        if (/^[a-zA-Z0-9]+\/.*/.test(req.body.ref))
          command += req.body.ref;
        else
          command += req.params.name + '@' + req.body.ref;
        exec(command, function (err) {
          if (err) return next(err);
          srv.manager.load(req.params.name, function (err) {
            if (err) return next(err);
            var log = new srv.log(req, req.session.user.name + ' loaded module ' + req.params.name, 'MODULE_LOADED');
            log.store();
            res.send();
          });
        });
      } else {
        srv.manager.load(req.params.name, function (err) {
          if (err) return next(err);
          res.send();
        });
      }
    }
  },
  {
    url: '/modules/:name',
    method: 'post',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.status(401).send(new srv.err('Sudo required.'));
      if (typeof req.params.name === 'undefined')
        return res.status(400).send(new srv.err('Please specify a name.'));
      if (typeof req.body.action === 'undefined')
        return res.status(400).send(new srv.err('Please specify an action.'));
      if (req.body.action === 'update') {
        async.series([
          function (callback) {
            srv.manager.unload(req.params.name, function (err) {
              callback(err);
            });
          },
          function (callback) {
            fse.rmrf(process.cwd() + '/node_modules/' + req.params.name, function (err) {
              callback(err);
            });
          },
          function (callback) {
            exec('npm install', function (err) {
              callback(err);
            });
          },
          function (callback) {
            srv.manager.load(req.params.name, function (err) {
              callback(err);
            });
          }
        ], function (err) {
          if (err) return next(err);
          var log = new srv.log(req, req.session.user.name + ' updated module ' + req.params.name, 'MODULE_UPDATE');
          log.store();
          res.send();
        });
      }
    }
  },
  {
    url: '/modules/:name',
    method: 'delete',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.status(401).send(new srv.err('Sudo required.'));
      if (typeof req.params.name === 'undefined')
        return res.status(400).send(new srv.err('Please specify a name.'));
      srv.manager.unload(req.params.name, function (err) {
        if (err) return next(err);
        var log = new srv.log(req, req.session.user.name + ' unloaded module ' + req.params.name, 'MODULE_UNLOADED');
        log.store();
        res.send();
      });
    }
  }
];
