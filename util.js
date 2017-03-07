var levelup = require('levelup');
var config = require('./config');
var fs = require('fs');
var levelindex = require('leveldb-index');
var levellog = require('leveldb-log');
var sublevel = require('level-sublevel');

var db = null;

var get_db = function(options, cb) {
  if (typeof cb === 'undefined') {
    cb = options;
    options = {
      'valueEncoding': 'json'
    };
  }
  var name = config.db.name;
  if (!db) {
    db = sublevel(levelup(config.db_path + '/' + name, options));
    db = levelindex(levellog(db));
      config.db.index.forEach(function(attr) {
        db.ensureIndex(attr.name,attr.map,function() {
          console.log(attr.name+' indexing complete');
        });
      });
    cb(null, db);
  } else {
    cb(null, db);
  }
};

var put = function(key, value, cb) {
  this.get_db(function(err, db) {
    if (err) {
      cb({
        'ok': false,
        'message': err
      });
    } else {
      db.put(key, value, function(err) {
        if (err) {
          cb({
            'ok': false,
            'message': err
          });
        } else {
          cb({
            'ok': true,
            'key': key
          });
        }
      });
    }
  });
};

var del = function(key, cb) {
  this.get_db(function(err, db) {
    if (err) {
      cb({
        'ok': false,
        'message': err
      });
    } else {
      db.del(key, function(err) {
        if (err) {
          cb({
            'ok': false,
            'message': err
          });
        } else {
          cb({
            'ok': true,
            'key': key
          });
        }
      });
    }
  });
};

module.exports.get_db = get_db;
module.exports.put = put;
module.exports.del = del;
