module.exports = [
  {
    url: '/status',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      res.send({
        system: process.platform + ' ' + process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        versions: process.versions
      });
    }
  }
]
.concat(require('./routes/users.js'))
.concat(require('./routes/modules.js'))
.concat(require('./routes/logs.js'));
