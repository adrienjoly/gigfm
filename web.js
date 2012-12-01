var async   = require('async');
var express = require('express');
var util    = require('util');

var lastfm  = require('lastfm');


// create an express webserver
var app = express.createServer(
  express.logger(),
  express.static(__dirname + '/public'),
  express.bodyParser(),
  express.cookieParser(),
  // set this to a secret value to encrypt session cookies
  express.session({ secret: process.env.SESSION_SECRET || 'secret123' })
);

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Listening on " + port);
});

app.dynamicHelpers({
  'host': function(req, res) {
    return req.headers['host'];
  },
  'scheme': function(req, res) {
    req.headers['x-forwarded-proto'] || 'http'
  },
  'url': function(req, res) {
    return function(path) {
      return app.dynamicViewHelpers.scheme(req, res) + app.dynamicViewHelpers.url_no_scheme(path);
    }
  },
  'url_no_scheme': function(req, res) {
    return function(path) {
      return '://' + app.dynamicViewHelpers.host(req, res) + path;
    }
  },
});

function renderIndex(req, res) {
  res.render("bookmarklet.ejs", {
      layout: false,
      req: req
    });
}

app.get('/', renderIndex);
app.post('/', renderIndex);

function renderEvent(req, res) {
  res.render("event.ejs", {
      layout: false,
      req: req
    });
}

app.get('/event/*', renderEvent);
app.get('/festival/*', renderEvent);

app.get('/lastfmCallback', function(req, res) {
  var token = req.query["token"];
  console.log("/lastfmCallback GET token", token);
  //lastfm.auth();
  lastfm.getArtists("cher", function(res){
    console.log(res);
  });
  res.send('token: ' + token);
});
