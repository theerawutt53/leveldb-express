var express = require('express');
var router = express.Router();
var controller = require('./service_controller');

//GET METHOD
router.get('/data/:id?', controller._getdata);
router.get('/log', controller._log);
router.get('/compactlog', controller._compact);

//POST METHOD
router.post('/data/:id?', controller._putdata);
router.post('/query/:index', controller._query);

//DELETE METHOD
router.delete('/data/:id?', controller._daletedata);

module.exports = router;
