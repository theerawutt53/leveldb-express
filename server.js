var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var session = require('express-session');
var passport = require('passport');
var authorization = require('express-authorization');
var path = require('path');
var https = require('https');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
    
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

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  login._getUser(id, done);
});

var ensureLogin_jwt = function (req, res, next) {
  passport.authenticate('jwt', { session: false })(req,res,next);
};


var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = config.jwt_options.cert;

passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
  done(null, jwt_payload);
}));

app.use('/',ensureLogin_jwt, service_interface);

app.listen(PORT, function () {
  console.log('Server listening on port %d', this.address().port);
});

