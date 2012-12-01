function Lastfm() {

	var lastfm = this;
	var apiKey = "9c5df33c08281a3dbd68378f4027728e";
	var apiPrefix = "http://ws.audioscrobbler.com/2.0/?api_key="+apiKey+"&format=json";

	this.LastfmArtist = function(name) {
		var self = this;
		this.id = name.replace(/\s/g, "+");
		this.name = name;
		/*
		function parseArtist(artist) {}
		var reqUrl = apiPrefix + "&method=artist.getinfo&artist="+this.id;
		$.getJSON(reqUrl, function(res){
			if (res && res.artist)
				parseArtist(res.artist);
			console.log("artist", self.name, reqUrl, res);
		});
		*/

		// http://www.lastfm.fr/api/show/artist.getPodcast => Free MP3

		function parseTopTracks(tracks) {
			self.tracks = tracks.map(function(track){
				return track.name;
			});
			//console.log("tracks", self.tracks);
		}

		this.fetchTopTracks = function(cb) {
			var reqUrl = apiPrefix + "&method=artist.gettoptracks&artist="+this.id;
			//console.log(reqUrl);
			$.getJSON(reqUrl, function(res){
				//console.log(res.toptracks)
				if (res && res.toptracks && res.toptracks.track)
					parseTopTracks(res.toptracks.track.join ? res.toptracks.track : [res.toptracks.track]);
				cb(self.tracks);
			});
		};
	}

	this.LastfmGig = function(a, cb) {
		var self = this;
		//this.a = a;
		this.name = a.name || a.innerText;
		this.gId = a.gId || a.href.substr(a.href.indexOf("/", 10));
		this.id = this.gId.split("/").pop().split("+")[0];

		if (this.gId.indexOf("/venue/") == 0)
			return cb();

		function parseEvent(event, cb) {
			self.date = new Date(event.startDate);
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
				self.artists = [
					new lastfm.LastfmArtist(event.artists.artist)
				];
			else
				self.artists = event.artists.artist.map(function(name, i){
					return new lastfm.LastfmArtist(name);
				});
			cb(self);
		}

		var reqUrl = apiPrefix + "&method=event.getinfo&event="+this.id;
		$.getJSON(reqUrl, function(res){
			if (res && res.event)
				parseEvent(res.event, cb);
			else
				cb();
			//console.log("event", self.name, /*reqUrl, res*/ self);
		});
	}
}


function GigDetector() {

	var lastfm = new Lastfm();

	this.getGigLinks = function() {
		return $("a.url").map(function(i, a) {
			return new lastfm.LastfmGig(a);
		});
	};

	this.fetchGigLinks = function(gigHandler, onDone) {
		var nDetected = 0;
		var anchors = $("a.url");
		var links = [];
		for (var i = anchors.length - 1; i >= 0; i--)
			links.push(anchors[i]);
		(function next() {
			var link = links.pop();
			//console.log("next", link.innerText)
			if (!link)
				return onDone(nDetected);
			else
				new lastfm.LastfmGig(link, function(gig) {
					if (gig) {
						nDetected ++;
						gigHandler(gig);
					}
					next();
				});
		})();
	};
}
