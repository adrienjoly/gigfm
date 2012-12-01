function Lastfm() {

	var lastfm = this;
	var apiKey = "9c5df33c08281a3dbd68378f4027728e";
	var apiPrefix = "http://ws.audioscrobbler.com/2.0/?api_key="+apiKey+"&format=json";

	this.LastfmArtist = function(name) {
		var self = this;
		this.id = name.replace(/\s/g, "+");
		this.name = name;

		function parseArtist(artist) {
			
		}

		var reqUrl = apiPrefix + "&method=artist.getinfo&artist="+this.id;
		$.getJSON(reqUrl, function(res){
			if (res && res.artist)
				parseArtist(res.artist);
			console.log("artist", self.name, reqUrl, res);
		});
	}

	this.LastfmGig = function(a) {
		var self = this;
		this.a = a;
		this.name = a.innerText;
		this.gId = a.href.substr(a.href.indexOf("/", 10));
		this.id = this.gId.split("/").pop().split("+")[0];

		if (this.gId.indexOf("/venue/") == 0)
			return null;

		function parseEvent(event) {
			if (typeof event.artists.artist == "string")
				self.artists = [
					new lastfm.LastfmArtist(event.artists.artist)
				];
			else
				self.artists = event.artists.artist.map(function(name, i){
					return new lastfm.LastfmArtist(name);
				});
		}

		var reqUrl = apiPrefix + "&method=event.getinfo&event="+this.id;
		$.getJSON(reqUrl, function(res){
			if (res && res.event)
				parseEvent(res.event);
			console.log("event", self.name, reqUrl, res);
		});
	}
}


function GigDetector() {

	var lastfm = new Lastfm();

	this.getGigLinks = function() {
		/*
		var elts = document.getElementsByTagName("a");
		for (var j=0; j<elts.length; ++j)
			toDetect.push(elts[j]);
		*/
		return $("a.url").map(function(i, a) {
			//var gId = a.href.substr(a.href.indexOf("/", 10));
			//return {i:i, a:a, name:a.innerText, gId:gId};
			return new lastfm.LastfmGig(a);
		});
	}
/*
	this.run = function(addThumb, whenDone) {
		console.log("Detecting Gigs...");
		var nEmbeds = 0;

		function addEmbedThumb(e, p, callback) {
			var src = e.href || e.src || e.data;
			if (src) {
				p(src, function(embed){
					if (embed) {
						embed.title = embed.title || e.textNode || e.title || e.alt || p.label;
						console.log("found", src, embed.title);
					}
					callback && callback(embed);
				}, e);
			}
			else
				callback && callback();
		}

		function detectEmbed(e, callback) {
			//console.log("detectEmbed", e.href || e.src || e.data);
			var remaining = prov.length;
			var detected = null;
			for (var p=0; p<prov.length; ++p)
				addEmbedThumb(e, prov[p], function(embed) {
					nEmbeds += embed ? 1: 0;
					if (embed)
						addThumb(detected = embed);
					if (0 == --remaining)
						callback(detected);
				});
		}

		var toDetect = [];
		var elts = document.getElementsByTagName("a");
		for (var j=0; j<elts.length; ++j)
			toDetect.push(elts[j]);

		(function processNext() {
			if (!toDetect.length)
				whenDone(nEmbeds);
			else
				detectEmbed(toDetect.shift(), processNext);
		})();
	}
	*/
}
