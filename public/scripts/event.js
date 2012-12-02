$(document).ready(function() {

  var gId = window.location.href.split("?")[0];
  gId = gId.substr(gId.indexOf("/", 10)); //"/event/3413899+Divider+at+La+Cantine+de+Belleville+on+1+December+2012"

  (function populateEventPage(gId) {

    var TRACKS_PER_ARTIST = 5;

    var youtube = new YoutubeSearch();
    var distance = new LevenshteinDistance();

    var tracks = [];

    window.playem = new GigfmPlayer();

    function whenDone() {
      console.log("done");
      window.playTrack = function (embedLink) {
        window.playem.playAll(embedLink.parentNode);
      }
      window.playem.playAll();
    }

    function addTrack(artist, trackName, embed) {
      $("#tracklist").append([
        '<li data-i="'+tracks.length+'" onclick="window.playem.playAll('+tracks.length+');">',
        '<div class="play"></div>',
        '<div><a>' + artist.name + " - " + trackName + '</a></div>',
        "</li>"
      ].join('\n'));

      window.playem.addTrack("https://youtube.com/v/" + embed.id, {
        i: tracks.length,
        title: artist.name + " - " + trackName,
      });

      tracks.push(embed);
    }

    function addArtist(artist, trackHandler, cb) {
      artist.fetchTopTracks(function(topTracks){
        if (!topTracks || !topTracks.length)
          return cb();
        var nbTracks = TRACKS_PER_ARTIST;
        (function next() {
          var trackName = topTracks.shift();
          if (!trackName || nbTracks == 0)
            cb();
          else {
            var q = artist.name + " " + trackName;
            youtube.query(q, function(res) {
              //console.log("yt res", res);
              if (res && res.length) {
                var res = res[0];
                var d = distance.compute(q, res.name);
                if (d < 10) {
                  trackHandler(artist, trackName, res);
                  --nbTracks;
                }
                else
                  console.log("skipped", q, "=>", res.name, "(", d, ")")
              }
              next();
            });
          }
        })();
      });
    }

    function addTickets(artistName) {
      var apiKey = "zfqPVm6YaETWj5fS";
      var url = "http://api.songkick.com/api/3.0/events.json?apikey="+apiKey+"&artist_name="+encodeURIComponent(artistName)+"&location=clientip"; //location=ip:94.228.36.39
      $.getJSON(url, function(res) {
        console.log("songkick", res);
        try {
          $("#buy").attr("href", res.resultsPage.results.event[0].uri);
        }
        catch (e) {
          $("#buy").hide();
        }
      });
    }

    var day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    function renderDate(d) {
      var mn = d.getMinutes();
      if ((""+mn).length < 2)
        mn = "0" + mn;
      return day[d.getDay()] + ", " + month[d.getMonth()] + " " + d.getDate() + "th, " + d.getHours() + ":" + mn;
    }

    var lastfm = new Lastfm();
    new lastfm.LastfmGig({gId:gId}, function(gig) {
      document.title = gig.name;
      $("h1").text(gig.name);
      $("#date").text(renderDate(gig.date));
      if (gig.venue) {
        $("h4").text(gig.venue.name);
        $("#adresse p").text(gig.venue.street + ", " + gig.venue.city);
        var venue = encodeURIComponent((gig.venue.name || gig.venue.street) + ", " + (gig.venue.city || ""));
        var url = "https://maps.google.fr/maps?q=" + venue.replace(/\%20/g, "+") + "&output=embed&iwloc=near";
        $("#map iframe").attr("src", url);
      }
      else
        $("#adresse").hide();
      if (gig.artists && gig.artists.length) {
        addTickets(gig.artists[0].name);
        for (var i in gig.artists)
          $("#artists").append("<li>"+gig.artists[i].name+"</li>");
        (function next() {
          var artist = gig.artists.shift();
          if (!artist)
            whenDone();
          else
            addArtist(artist, addTrack, next);
        })();
      }
      else
        whenDone();
    });

  })(gId);

});
