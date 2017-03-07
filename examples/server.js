var express = require('express');
var levelexpress = require('../index');
var app = express();

app.use('/',levelexpress({
  db : {
    name:"obec_students",
  }
}));


app.listen(80, function () {
  console.log('Server listening on port %d', this.address().port);
});
