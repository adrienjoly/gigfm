/**
 * gigfm bookmarklet
 * @author adrienjoly
 **/

// prevents bug in firefox 3
if (undefined == window.console) 
	console = {log:function(){}};

console.log("-= gigfm bookmarklet =-");

(function(){
	
	function forEachElement (elementName, handler) {
		var els = document.getElementsByTagName(elementName);
		var l = 0 + els.length;
		var count = 0;
		for(var i = 0; i < l; i++)
			count += handler(els[i]);
		return count;
	}
	
	function findScriptHost(scriptPathName) {
		var host = null;
		forEachElement("script", function(element) {
			var gigfmPathPos = element.src.indexOf(scriptPathName);
			if(gigfmPathPos > -1)
				host = element.src.substr(0, gigfmPathPos);
		});
		return host;
	}
	
	// PARAMETERS
	
	var urlPrefix = findScriptHost("/scripts/bookmarklet.js") || "https://gigfm.herokuapp.com";
	var urlSuffix = "?" + (new Date()).getTime();
	var minH = 90;
	var minW = 90;
	
	var div = document.getElementById("gigfmBookmarklet");
	if (!div) {
		document.body.appendChild(document.createElement('div')).id = "gigfmBookmarklet";
		div = document.getElementById("gigfmBookmarklet");
	}
	div.innerHTML = [
		'<div id="gigfmHeader">',
			'<a target="_blank" href="'+urlPrefix+'"><img src="'+urlPrefix+'/images/logo-s.png"></a>',
			'<div onclick="document.body.removeChild(document.getElementById(\'gigfmBookmarklet\'))"><img src="'+urlPrefix+'/images/btn-close.png"></div>',
		'</div>',
		'<div id="gigfmContent">',
			'<div id="gigfmLoading">',
				'<p>Extracting tracks,</p>',
				'<p>please wait...</p>',
				'<img src="'+urlPrefix+'/images/loader.gif" style="display:inline;">',
			'</div>',
		'</div>'
	].join('\n');

	function include(src, callback) {
		var ext = src.split(/[\#\?]/)[0].split(".").pop().toLowerCase();
		var inc;
		if (ext == "css") {
			inc = document.createElement("link");
			inc.rel = "stylesheet";
			inc.type = "text/css";
			inc.media = "screen";
			try {
				inc.href = src;
				document.getElementsByTagName("head")[0].appendChild(inc);
				callback && callback({loaded: true});
			}
			catch (exception) {
				callback ? callback(exception) : console.log(src + " include exception: ", exception);
			}
		}
		else {
			inc = document.createElement("script");
			var timer, interval = 500, retries = 10;
			function check() {
				var loaded = inc.readyState && (inc.readyState == "loaded" || inc.readyState == "complete" || inc.readyState == 4);
				//console.log("check timer", loaded, retries)
				if (loaded || --retries <= 0) {
					timer = timer ? clearInterval(timer) : null;
					callback && callback({loaded:loaded});
				}
			}
			timer = callback ? setInterval(check, interval) : undefined;
			inc.onload = inc.onreadystatechange = check;
			try {
				inc.src = src;
				document.getElementsByTagName("head")[0].appendChild(inc);
			}
			catch (exception) {
				timer = timer ? clearInterval(timer) : null;
				callback ? callback(exception) : console.log(src + " include exception: ", exception);
			}
		}
	};
	
	function getSelText() {
		var SelText = '';
		if (window.getSelection) {
			SelText = window.getSelection();
		} else if (document.getSelection) {
			SelText = document.getSelection();
		} else if (document.selection) {
			SelText = document.selection.createRange().text;
		}
		return SelText;
	}
	
	function showForm(thumb) {
		var text = getSelText();
		var src = urlPrefix+'/post/add?embed=' + encodeURIComponent(thumb.url)
			+ (thumb.title ? '&title=' + encodeURIComponent(thumb.title) : '')
			+ '&refUrl=' + encodeURIComponent(window.location.href)
			+ '&refTtl=' + encodeURIComponent(document.title)
			+ (text ? '&text=' + encodeURIComponent(text) : '');
		div.removeChild(contentDiv);
		div.innerHTML += '<iframe id="gigfmContent" src="'+src+'"></iframe>';
	}
	
	function renderThumb(thumb) {
		var divThumb = document.createElement("div");
		divThumb.setAttribute("id", thumb.id);
		divThumb.setAttribute("class", "gigfmThumb");
		var divCont = document.createElement("div");
		divCont.setAttribute("class", "gigfmCont");
		divCont.appendChild(thumb.element);
		var textNode = document.createTextNode(thumb.title);
		var title = document.createElement("p");
		title.appendChild(textNode);
		divThumb.appendChild(divCont);
		divThumb.appendChild(title);
		var btnShareIt = document.createElement("img");
		btnShareIt.setAttribute("src", urlPrefix + "/images/btn-shareit.png");
		divThumb.appendChild(btnShareIt);
		return divThumb;
	}

	var thumbCounter = 0;
	var eidSet = {}; // to prevent duplicates
	var lastThumb = null;
	var contentDiv;

	function addThumb(thumb) {
		thumb.id = 'gigfmThumb' + (thumbCounter++);
		thumb.element = document.createElement("img");
		thumb.element.src = thumb.img;
		var divThumb = renderThumb(thumb);
		divThumb.onclick = function() {showForm(thumb);};
		contentDiv.appendChild(divThumb);
	}
	
	var pagePrefix = window.location.href.split(/[#\?]/).shift();
	var posPrefix = pagePrefix.lastIndexOf("/");
	pagePrefix = pagePrefix.substr(0, posPrefix) + "/";
	var pageRoot = pagePrefix.substr(0, pagePrefix.indexOf("/", 10));
	
	function getUrl(path) {
		if (path && path.length > 0 && path.indexOf("://") == -1)
			return (path[0] == "/" ? pageRoot : pagePrefix) + path;
		else
			return path;
	}

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
				img: urlPrefix + "/images/cover-soundcloud.jpg",
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
    var cover = urlPrefix + '/images/cover-audiofile.png';        
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

  //============================================================================

	var prov = [
		new YoutubeDetector(),
		new SoundCloudDetector(),
		new VimeoDetector(),
		Mp3Detector
		//new DailymotionDetector()
	];

	function unwrapFacebookLink(src) {
		// e.g. http://www.facebook.com/l.php?u=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DKhXn0anD1lE&h=AAQFjMJBoAQFTPOP4HzFCv0agQUHB6Un31ArdmwvxzZxofA
		var fbLink = src.split("facebook.com/l.php?u=");
		if (fbLink.length>1) {
			fbLink = decodeURIComponent(fbLink.pop().split("&").shift());
			var result = fbLink.indexOf("//www.facebook.com/") == -1 ? fbLink : src;
			//console.log("unwrapped facebook link", result);
			return result;
		}
		return src;
	}
	
	function addEmbedThumb(e, p, callback) {
		var src = e.href || e.src || e.data;
		if (src) {
			src = unwrapFacebookLink(src);
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

	function initGigfmBookmarklet() {

		console.log("initGigfmBookmarklet...");

		var elementNames = ["iframe", "object", "embed", "a", "audio", "source"];
		var nEmbeds = 0;

		function whenDone() {
			document.getElementById("gigfmLoading").innerHTML = nEmbeds ? ""
				: "No tracks were found on this page, sorry...";
			if (nEmbeds == 1)
				showForm(lastThumb);
		}

		function detectEmbed(e, callback) {
			//console.log("detectEmbed", e.href || e.src || e.data);
			var remaining = prov.length;
			var detected = null;
			for (var p=0; p<prov.length; ++p)
				addEmbedThumb(e, prov[p], function(embed) {
					nEmbeds += embed ? 1: 0;
					if (embed && !eidSet[embed.eid])
						addThumb(detected = lastThumb = eidSet[embed.eid] = embed);
					if (0 == --remaining)
						callback(detected);
				});
		}

		contentDiv = document.getElementById("gigfmContent");
		detectEmbed({src:window.location.href}, function(found) {
			console.log("content page", found);
			if (found)
				showForm(lastThumb);
			else {
				var toDetect = [];
				for (var i in elementNames) {
					var elts = document.getElementsByTagName(elementNames[i]);
					for (var j=0; j<elts.length; ++j)
						toDetect.push(elts[j]);
				}
				function processNext() {
					if (!toDetect.length)
						whenDone();
					else
						detectEmbed(toDetect.shift(), processNext);
				}
				processNext();
			}	
		});
	}
	/*
	(function loadNext(){
		if (toInclude.length)
			include(urlPrefix + toInclude.shift() + urlSuffix, loadNext);
		else initGigfmBookmarklet();
	})();
	*/
	include(urlPrefix + "/stylesheets/bookmarklet.css" + urlSuffix, initGigfmBookmarklet);
})();