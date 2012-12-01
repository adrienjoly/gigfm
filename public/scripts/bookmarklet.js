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
			'<a target="_blank" href="'+urlPrefix+'">gigFM</a>',
			'<div onclick="document.body.removeChild(document.getElementById(\'gigfmBookmarklet\'))"><img src="'+urlPrefix+'/images/btn-close.png"></div>',
		'</div>',
		'<div id="gigfmContent">',
			'<div id="gigfmLoading">',
				'<p>Extracting recommended concerts,</p>',
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
	
	function showForm(thumb) {
		/*
		var text = getSelText();
		var src = urlPrefix+'/post/add?embed=' + encodeURIComponent(thumb.url)
			+ (thumb.title ? '&title=' + encodeURIComponent(thumb.title) : '')
			+ '&refUrl=' + encodeURIComponent(window.location.href)
			+ '&refTtl=' + encodeURIComponent(document.title)
			+ (text ? '&text=' + encodeURIComponent(text) : '');
		div.removeChild(contentDiv);
		div.innerHTML += '<iframe id="gigfmContent" src="'+src+'"></iframe>';
		*/
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


  //============================================================================

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

		var prov = [
			new YoutubeDetector(),
			new SoundCloudDetector(),
			new VimeoDetector(),
			Mp3Detector
			//new DailymotionDetector()
		];

		console.log("initGigfmBookmarklet...");

		var elementNames = ["iframe", "object", "embed", "a", "audio", "source"];
		var nEmbeds = 0;

		function whenDone() {
			document.getElementById("gigfmLoading").innerHTML = nEmbeds ? ""
				: "No concerts were found on this page, sorry...";
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

	var toInclude = [
		"/stylesheets/bookmarklet.css",
		"/scripts/trackDetectors.js"
	];
	
	(function loadNext(){
		if (toInclude.length)
			include(urlPrefix + toInclude.shift() + urlSuffix, loadNext);
		else initGigfmBookmarklet();
	})();
	
	//include(urlPrefix + "/stylesheets/bookmarklet.css" + urlSuffix, initGigfmBookmarklet);
})();