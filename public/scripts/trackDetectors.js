	function YoutubeDetector() {
		console.log("Initializing Youtube Detector");
		var regex = ///https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/; //^https?\:\/\/(?:www\.)?youtube\.com\/[a-z]+\/([a-zA-Z0-9\-_]+)/
    	            /(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/;
		// HACK to skip non-video youtube links that are detected by the regex
		var toSkip = {"user":1, "videos":1, "movies":1, "my_videos":1, "my_subscriptions":1, "inbox":1, "account":1, "analytics":1, "my_videos_edit":1, "enhance":1, "audio":1, "music":1, "creators":1, "t":1, "dev":1, "testtube":1, "view_all_playlists":1};
		return function (url, cb) {
			//console.log("youtube url", url)
			var id = url.match(regex);
			//console.log("youtube url 2", id)
			if (id) {
				id = id.pop();
				if (!id || toSkip[id])
					return cb();
				var embed = {
					eid: id,
					url: url,
					img: "https://i.ytimg.com/vi/" + id + "/0.jpg",
					title: "Youtube video" // by default
				}
				var handlerId = 'youtubeHandler' + (new Date()).getTime();
				window[handlerId] = function(data) {
					//console.log("youtube api response", data);
					if (data && data.data)
						embed.title = data.data.title;
					cb(embed);
				};
				include("https://gdata.youtube.com/feeds/api/videos/"+id+"?v=2&alt=jsonc&callback="+handlerId);
			}
			else
				cb();
		};
	}

	function SoundCloudDetector() {
		console.log("Initializing SoundCloud Detector");
		var regex = /https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_]+\/[\w-_]+)/;
		// TODO: also support http://snd.sc/yp6VMo urls
		var scClientId = "9d5bbaf9df494a4c23475d9fde1f69b4";
		return function (url, cb) {
			var embed = {
				url: url,
				img: /*urlPrefix +*/ "/images/cover-soundcloud.jpg",
				title: "SoundCloud Track" // by default
			};
			function addMetadata(data) {
				//console.log("sc metadata: ", data);
				if (data && embed) {
					embed.img = data.artwork_url || embed.img;
					embed.title = data.title || embed.title;
				}
				cb(embed);
			}
			var id = url.match(regex);
			if (id) {
				id = id.pop();
				embed.eid = id;
				var callbackFct = "scCallback_" + id.replace(/[-\/]/g, "__");
				window[callbackFct] = addMetadata;
				var url = encodeURIComponent("https://soundcloud.com/"+id);
				//include('https://soundcloud.com/oembed?url='+url+'&format=js&iframe=true&callback=' + callbackFct);
				include('https://api.soundcloud.com/resolve.json?url='+url+'&client_id='+scClientId+'&callback=' + callbackFct);
			}
			else if (url.indexOf("soundcloud.com/player") != -1) {
				var trackUrl = decodeURIComponent(url.match(/url=([^&]*)/).pop()); // /url=([^&]*)&/
				var trackId = trackUrl.split("/").pop();
				var callbackFct = "scCallback_" + trackId.replace(/[-\/]/g, "__");
				window[callbackFct] = addMetadata;
				include("https://api.soundcloud.com/tracks/" + trackId + ".json?client_id="+scClientId+"&callback="+callbackFct);
			}
			else
				cb();
		};
	}

	function VimeoDetector() {
		console.log("Initializing Vimeo Detector");
		var regex = /https?:\/\/(?:www\.)?vimeo\.com\/(clip\:)?(\d+)/;
		return function (url, cb) {
			var embed = {
				url: url,
				title: "Vimeo video"
			};
			var id = url.match(regex);
			if (id) {
				embed.eid = id = id.pop();
				var callbackFct = "viCallback_" + id;
				window[callbackFct] = function(data) {
					if (data && data.length) {
						embed.name = data[0].title;
						embed.img = data[0].thumbnail_medium;
						cb(embed);
					}
					else
						cb();
				};
				include("https://vimeo.com/api/v2/video/" + id + ".json?callback="+callbackFct);
			}
			else
				cb();
		};
	}
/*
	function DailymotionDetector() {
		{
			label: "Dailymotion video",
			regex: /https?:\/\/(?:www\.)?dailymotion.com\/video\/([\w-_]+)/,
			getImg: function(id, cb) {
				cb("http://www.dailymotion.com/thumbnail/video/" + id);
			}
		},
		{
			label: "Dailymotion video",
			regex: /https?:\/\/(?:www\.)?dailymotion.com\/embed\/video\/([\w-_]+)/,
			getImg: function(id, cb) {
				var callbackFct = "dmCallback_" + id.replace(/[-\/]/g, "__");
				var url = encodeURIComponent("http://www.dailymotion.com/embed/video/"+id); // "k7lToiW4PjB0Rx2Pqxt";
				window[callbackFct] = function(data) {
					cb(data.thumbnail_url);
				};
				include("http://www.dailymotion.com/services/oembed?format=json&url=" + url + "&callback=" + callbackFct);
			}
		},
	}
*/

  //============================================================================
  var Mp3Detector = (function() {
    console.log("Initializing Mp3 Detector");    
    var reg = /([^\/]+)\.(?:mp3|ogg)$/;
    var cover = /*urlPrefix +*/ '/images/cover-audiofile.png';        
    function title(mp3Name, e) {
    }
    return function(url, cb, e) {
    	//if (e.tagName === 'audio' || e.tagName === 'source') return mp3Name;
    	var title = (url.match(reg) || []).pop();
    	if (title) console.log("mp3 title", title);
    	title = !title ? "" : e.title || e.innerText || e.textContent || title;
		cb(title.length < 5 ? null : {
			eid: url,
			url: url,
			img: cover,
			title: title
		});
    };
  })();
