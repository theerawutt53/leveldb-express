var levelup = require('levelup');
var levelindex = require('leveldb-index');
var levellog = require('leveldb-log');
var sublevel = require('level-sublevel');
var path = require('path');
var express = require('express');
var JSONStream = require('JSONStream');
var through2 = require('through2');
var request = require('request');
var diff = require('changeset');
var uuid = require('node-uuid');

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
    } else {
      req.query.limit = 50;
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
    var opt = {
      limit: 50
    };
    if (req.query.start) opt['start'] = req.query.start
    if (req.query.end) opt['end'] = req.query.end
    if (req.query.gt) opt['gt'] = req.query.gt
    if (req.query.lt) opt['lt'] = req.query.lt
    if (req.query.gte) opt['gte'] = req.query.gte
    if (req.query.lte) opt['lte'] = req.query.lte
    if (req.query.limit) {
      var limit = parseInt(req.query.limit);
      opt['limit'] = limit ? limit : 50;
    }
    db.createLogStream(opt)
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
   if(req.body.match) {
     req.body['start'] = req.body.match;
     req.body['end'] = req.body.match.slice();
     req.body['end'].push(undefined);
     delete req.body['match'];
  }
  db.indexes[index].createIndexStream(req.body)
    .pipe(JSONStream.stringify())
    .pipe(res);
};

leveldb.prototype.putdata = function(db,req, res) {
  var _key = req.params.id ? req.params.id : uuid.v1();
  var _key = _key.replace(/-/g, '');
  var _value = req.body;
  delete _value.apikey;
  db.put(_key, _value, function(err) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      res.json({
        'ok': true,
        'key': _key
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
        'key': _key
      });
    }
  });
};

leveldb.prototype.daletelog = function(db,req, res) {
  var _key = req.params.id;
  db.log.del(_key, function(err) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      res.json({
        'ok': true,
        'key': _key
      });
    }
  });
};

leveldb.prototype.sync = function(db,req, res){
  // {'url':'http://xxx.yyy/log/','token':'JWT xxxx','start':'xx'}
  var body = {'start':req.body.start};
  var records = 0;
  var last_sync = null;
  request({
    method:'GET',
    url:req.body.url,
    headers:{'Authorization':req.body.token},      
    json:true,
    body:body
  })
  .pipe(JSONStream.parse('*'))
  .pipe(through2.obj(function(chunk,enc,cb) {            
    try {            
      last_sync = chunk.key;
      var _value = diff.apply(chunk.value.changes,{});
      var key = chunk.value.key;
      records++;
      db.put(key,_value,cb);
    } catch(err) {      
      cb();
    };
  }))
  .on('finish',function() {
    res.json({'records':records,'last_sync':last_sync});
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
  router.post('/sync',db_controller.sync.bind(null,db_controller.db));
  router.post('/query/:index', db_controller.query.bind(null,db_controller.db));
  router.post('/data/:id?', db_controller.putdata.bind(null,db_controller.db));
  //DELETE METHOD
  router.delete('/data/:id?', db_controller.daletedata.bind(null,db_controller.db));
  router.delete('/log/:id', db_controller.deletelog.bind(null,db_controller.db));
  return router;
}

module.exports = leveldb_express;

