var levelup = require('levelup');
var levelindex = require('leveldb-index');
var levellog = require('leveldb-log');
var sublevel = require('level-sublevel');
var path = require('path');
var express = require('express');
var JSONStream = require('JSONStream');

function leveldb(config) {  
  var options = {
   'valueEncoding': 'json'
  };
  var name = config.db.name;  
  var self=this;
  this.db = sublevel(levelup(path.join('./databases',name), options));
  this.db = levelindex(levellog(this.db));
  if(config.db.index) {
    config.db.index.forEach(function(attr) {
      self.db.ensureIndex(attr.name,attr.map,function() {
        console.log(attr.name+' indexing complete');
      });
    });
  }
}


leveldb.prototype.get = function(db, req, res) {    
  var key = req.params.id ? req.params.id : '';            
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
};


leveldb.prototype.log = function(db, req, res) {
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
};

leveldb.prototype.compact = function(db, req, res) {
  if(db.compactLog) {
    db.compactLog(req.query,function(err,compact) {
      res.json({'ok':true,'compacted':compact});
    });
  }
};

leveldb.prototype.query = function(db, req, res) {
  var index = req.params.index;
  db.indexes[index].createIndexStream(req.body)
    .pipe(JSONStream.stringify())
    .pipe(res);
};

leveldb.prototype.putdata = function(db,req, res) {
  var _key = req.params.id ? req.params.id : uuid.v1();
  var _key = _key.replace(/-/g, '');
  var _value = req.body;
  delete _value.apikey;
  db.put(_key, value, function(err) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      res.json({
        'ok': true,
        'key': key
      });
    }
  });
};
  
leveldb.prototype.daletedata = function(db,req, res) {
  var _key = req.params.id;
  db.del(_key, function(err) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      res.json({
        'ok': true,
        'key': key
      });
    }
  });
};

var leveldb_express = function(config) {
  var router = express.Router();
  var db_controller = new leveldb(config);
  //GET METHOD
  router.get('/data/:id?', db_controller.get.bind(null,db_controller.db));
  router.get('/log', db_controller.log.bind(null,db_controller.db));
  router.get('/compact', db_controller.compact.bind(null,db_controller.db));
  //POST METHOD
  router.post('/query/:index', db_controller.query.bind(null,db_controller.db));
  router.post('/data/:id?', db_controller.putdata.bind(null,db_controller.db));
  //DELETE METHOD
  router.delete('/data/:id?', db_controller.daletedata.bind(null,db_controller.db));
  return router;
}

module.exports = leveldb_express;

