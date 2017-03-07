var uuid = require('node-uuid');
var JSONStream = require('JSONStream');
var util = require('../util');

module.exports = {
   _log: function(req, res) {
    util.get_db( function(err, db) {
      if (err) {
        res.json({
          'ok': false,
          'message': err
        });
      } else {
        if (db.createLogStream) {
        db.createLogStream(req.query)
          .pipe(JSONStream.stringify())
          .pipe(res);
        } else {
         res.json({
          'ok': false,
          'message': 'This Database is not Support leveldb-log'
         });
        }
      }
    });
  },
  _compact: function(req, res) {
    util.get_db(function(err, db) {
      if (err) {
        res.json({
          'ok': false,
          'message': err
        });
      } else {
        if(db.compactLog) {
          db.compactLog(req.query,function(err,compact) {
            res.json({'ok':true,'compacted':compact});
          });
        }
      }
    });
  },
  _query: function(req, res) {
    var index = req.params.index;
    util.get_db(function(err, db) {
      if (err) {
        res.json({
          'ok': false,
          'message': err
        });
      } else {
        db.indexes[index].createIndexStream(req.body)
          .pipe(JSONStream.stringify())
          .pipe(res);
      }
    });
  },
  _getdata: function(req, res) {
    var key = req.params.id ? req.params.id : '';
    util.get_db(function(err, db) {
      if (err) {
        res.json({
          'ok': false,
          'message': err
        });
      } else {

        if (key == '') {
          if (req.query.limit) {
            var limit = parseInt(req.query.limit);            
            req.query.limit = limit ? limit : 50;
          }

          db.createReadStream(req.query)
            .pipe(JSONStream.stringify())
            .pipe(res);
        } else {
          db.get(key, function(err, value) {
            if (err) {
              res.json({
                'ok': false,
                'message': err
              });
            } else {
              res.json(value);
            }
          })
        }
      }
    });
  },
  _putdata: function(req, res) {
    var _key = req.params.id ? req.params.id : uuid.v1();
    var _key = _key.replace(/-/g, '');
    var _value = req.body;
    delete _value.apikey;

    util.put(_key, _value, function(result) {
      res.json(result);
    });
  },
  _daletedata: function(req, res) {
    var _key = req.params.id;

    util.del(db_name, _key, function(result) {
      res.json(result);
    });
  }
};
