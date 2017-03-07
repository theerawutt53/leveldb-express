var express = require('express');
var router = express.Router();
var controller = require('./service_controller');

//GET METHOD
router.get('/dbs', controller._listdbs);
router.get('/dbs/:dbs/:id?', controller._getdata);
router.get('/log/:db', controller._log);
router.get('/compactlog/:db', controller._compact);

//PUT METHOD
router.put('/dbs/:dbs', controller._createdb);

//POST METHOD
router.post('/dbs/:dbs/:id?', controller._putdata);
router.post('/query/:db/:index', controller._query);

//DELETE METHOD
router.delete('/dbs/:dbs/:id', controller._daletedata);
//router.delete('/dbs/:dbs', controller._daletedb);

module.exports = router;