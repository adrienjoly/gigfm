var async   = require('async');
var express = require('express');
var util    = require('util');

var lastfm  = require('lastfm');

var DEV = false;
var apiKey = DEV ? "74b103511369671daf6df03945cee796" : "9c5df33c08281a3dbd68378f4027728e";
var apiSecret = DEV ? "47f5770005bf9795612fd321abd8bcf8" : "6bc5cbaeef943d1ac2f84dfba8b51447";
lastfm = new lastfm.LastFM(apiKey, apiSecret);

var APP = {
  name: "gig.fm"
};

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

function renderAppPage(req, res, template, p) {
  var p = p || {};
  p.app = APP;
  p.layout = false;
  p.req = req;
  p.apiKey = apiKey;
  p.user = {
    name: (req.cookies || {}).gigfm_user || "James Garett",
    img: (req.cookies || {}).gigfm_uimg || "/images/avatar-1.png"
  }
  res.render(template, p);
}

function makeRenderer(template, p) {
  return function (req, res) {
    renderAppPage(req, res, template, p);
  }
}

app.get('/', makeRenderer("index.ejs"));
app.get('/event/*', makeRenderer("event.ejs"));
app.get('/festival/*', makeRenderer("event.ejs"));

app.get('/lastfmCallback', function(req, res) {
  lastfm.fetchSession(req.query["token"], function(session){
    res.cookie("gigfm_sk", session.key);
    res.cookie("gigfm_user", session.name);
    lastfm.getUserInfo(session.name, function(user){
      console.log("user", user);
      if (user && user.image)
        res.cookie("gigfm_uimg", user.image[0]["#text"]);
      res.redirect('/gigs');
      //res.redirect('/gigs?user='+session.name+'&sk='+session.key);
    });
  });
});

app.get('/gigs', function(req, res) {
  try {
    var sk = req.cookies.gigfm_sk || req.query["sk"];
    console.log("sk", sk, req.cookies);
    lastfm.fetchRecommendedGigs(sk, function(gigs) {
      renderAppPage(req, res, "gigs.ejs", { gigs: gigs });
    });
  }
  catch (e) {
    res.redirect("/");
  }
});

app.get('/test', function(req, res) {
  lastfm.getTopTracks("cher", function(json){
    res.json(json); 
  });
});

