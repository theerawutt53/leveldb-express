var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var session = require('express-session');
var passport = require('passport');
var authorization = require('express-authorization');
var path = require('path');
var https = require('https');

var service_interface = require('./routes/service_interface');
var config = require('./config');

var PORT = process.env.PORT || config.port;
var HOST = process.env.HOST || '';

var app = express();

app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(path.join(__dirname, 'views')));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  login._getUser(id, done);
});

app.use('/api', service_interface);
/*
app.listen(PORT, function () {
  console.log('Server listening on port %d', this.address().port);
});
*/
https.createServer(config.ssl_options, app).listen(PORT, HOST, null, function () {
  console.log('Server listening on port %d', this.address().port);
});
