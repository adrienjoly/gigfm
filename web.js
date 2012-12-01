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



app.get('/', function (req, res) {
  res.render("index.ejs", {
      layout: false,
      req: req
    });
});

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
  console.log("token: ", token);
  lastfm.fetchSessionKey(token, function(sk){
    console.log("session key: ", sk);
    res.redirect('/gigs?sk='+sk); 
  });
  /*
  lastfm.getArtists("cher", function(res){
    console.log(res);
  });
  */
});

var day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function renderDate(d) {
  return day[d.getDay()] + ", " + month[d.getMonth()] + " " + d.getDate() + "th";
}

function parseEvent(event, cb) {
  var self = {};
  self.gId = event.url.substr(event.url.indexOf("/", 10));
  self.name = event.title;
  self.date = renderDate(new Date(event.startDate));
  self.desc = event.description;
  self.url = event.website || event.url;
  if (event.tags && event.tags.tag)
    self.tags = event.tags.tag;
  if (event.image) {
    //console.log(typeof event.image, event.image)
    if (typeof event.image == "string")
      self.img = event.image;
    else
      for(var i=0; i<event.image.length; ++i)
        self.img = event.image[i]["#text"];
  }
  if (event.venue) {
    self.venue = {
      id: event.venue.id,
      name: event.venue.name,
      url: event.venue.website || event.venue.url,
    };
    if (event.venue.location) {
      self.venue.city = event.venue.location.city;
      self.venue.street = event.venue.location.street;
      self.venue.country = event.venue.location.country;
      self.venue.postalcode = event.venue.location.postalcode;
      if (event.venue.location["geo:point"])
        self.venue.latlng = [
          event.venue.location["geo:point"]["geo:lat"],
          event.venue.location["geo:point"]["geo:long"]
        ];
    }
  }
  if (typeof event.artists.artist == "string")
    self.artists = [ event.artists.artist ];
  else
    self.artists = event.artists.artist;
  return self;
}

function prepareGigs(gigs) {
  gigs = gigs.events.event; //.slice(0, 3);
  gigs = gigs.map(parseEvent);
  console.log("gigs", gigs);
  return gigs;
}

app.get('/gigs', function(req, res) {
  var sk = req.query["sk"];
  lastfm.fetchRecommendedGigs(sk, function(gigs) {
    res.render("gigs.ejs", {
      layout: false,
      req: req,
      gigs: prepareGigs(gigs)
    });
    //res.send(gigs);
  });
});

