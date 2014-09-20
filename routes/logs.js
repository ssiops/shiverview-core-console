module.exports = [
  {
    url: '/logs',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      var query = {};
      var opt = {limit: 10, sort: {_id: -1}};
      if (typeof req.query !== 'undefined') {
        if (typeof req.query.t !== 'undefined')
          query.tag = req.query.t;
        if (typeof req.query.l !== 'undefined')
          opt.limit = parseInt(req.query.l);
      }
      srv.db.find(query, 'logs', opt)
      .then(function (logs) { res.send(logs); }, function (err) { res.send(err); });
    }
  },
  {
    url: '/logs/tags',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (!req.session.user || !req.session.user.admin)
        return res.status(403).send(new srv.err('You do not have permission to perform this action.'));
      srv.db.aggregate([{$unwind:'$tag'},{$group:{_id:'$tag'}}], 'logs', {})
      .then(function (results) {
        var tags = [];
        for (var i = 0; i < results; i++)
          tags.push(results._id);
        res.send(tags);
      }, function (err) { next(err); });
    }
  }
];
