/**
 * last.fm api model
 * @author adrienjoly
 */

var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');

var apiHost = "ws.audioscrobbler.com";
var apiPrefix = "/2.0/?";

function md5(data) {
	return crypto.createHash('md5').update(data).digest("hex");
};

function LastFM(apiKey, apiSecret) {

	// http://www.lastfm.fr/api/webauth
	function sign(p) {
		var keys = Object.keys(p);
		keys.sort();
		var chain = "";
		for (var i in keys)
			chain += keys[i] + p[keys[i]];
		return md5(chain + apiSecret);
	}

	this.submitRequest = function(p, cb, signed) {
		p.api_key = apiKey;
		if (signed)
			p.api_sig = sign(p);
		p.format = "json";
		var path = apiPrefix + querystring.stringify(p);
		console.log("submitting "+path+" request to last.fm ...");
		return req = http.request({
			host: apiHost,
			path: path,
			method: "GET",
		}, function (res) {
			res.setEncoding('utf-8');
			console.log("-> statusCode", res.statusCode);
			//if (res.statusCode == 401) // try again, with correct auth string
			//	!auth && exports.submitRequest(path, /*null*/"pouet", cb);
			//else
			{
				var json = "";
				res.addListener('data', function(chunk) {
					json += chunk.toString();
				});
				res.addListener('end', function() {
					try {
						json = JSON.parse(json);
					} catch(e) {};
					cb(json);
				});
			}
		})
		.end();
	};

	// http://www.lastfm.fr/api/show/artist.getTopTracks
	this.getTopTracks = function(artistName, cb) {
		this.submitRequest({
			method: "artist.gettoptracks",
			artist: artistName
		}, cb);
	}

	// http://www.lastfm.fr/api/show/user.getInfo
	this.getUserInfo = function(handle, cb) {
		this.submitRequest({
			method: "user.getinfo",
			user: handle
		}, function(res) {
			cb((res || {}).user);
		});
	}

	// http://www.lastfm.fr/api/show/auth.getSession
	// Note: "Session keys have an infinite lifetime by default. You are recommended to store the key securely."
	this.fetchSession = function(token, cb) {
		this.submitRequest({
			method: "auth.getSession",
			token: token
		}, function(res) {
			cb((res || {}).session); ///*res.split(/\<[\/]?key\>/g)[1]*/
		}, true);
	}

	// http://www.lastfm.fr/api/show/user.getRecommendedEvents
	this.fetchRecommendedGigs = function(sk, cb) {
		this.submitRequest({
			method: "user.getRecommendedEvents",
			sk: sk
		}, function(res) {
			cb(res);
		}, true);
	}

	this.fetchGig = function(gId, cb) {
		var gId = gId.split("/").pop().split("+")[0];
		this.submitRequest({
			method: "event.getinfo",
			event: gId
		}, function(res) {
			cb(res);
		}, true);		
	}
}

module.exports.LastFM = LastFM;
	