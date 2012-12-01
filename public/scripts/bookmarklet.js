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
			var timer, interval = 100, retries = 10;
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
	
	// PARAMETERS
	
	var urlPrefix = findScriptHost("/scripts/bookmarklet.js") || "https://gigfm.herokuapp.com";
	var urlSuffix = "?" + (new Date()).getTime();

	var pagePrefix = window.location.href.split(/[#\?]/).shift();
	pagePrefix = pagePrefix.substr(0, pagePrefix.lastIndexOf("/")) + "/";
	var pageRoot = pagePrefix.substr(0, pagePrefix.indexOf("/", 10));
	
	function getUrl(path) {
		if (path && path.length > 0 && path.indexOf("://") == -1)
			return (path[0] == "/" ? pageRoot : pagePrefix) + path;
		else
			return path;
	}

//============================================================================

	var minH = 90;
	var minW = 90;

	(function generateUI(){
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
	})();
	
	function showForm(thumb) {
		console.log("selected thumb", thumb)
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
	
//============================================================================

	var thumbCounter = 0;
	var contentDiv;

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
		//var btnShareIt = document.createElement("img");
		//btnShareIt.setAttribute("src", urlPrefix + "/images/btn-shareit.png");
		//divThumb.appendChild(btnShareIt);
		return divThumb;
	}

	function addThumb(thumb) {
		thumb.id = 'gigfmThumb' + (thumbCounter++);
		thumb.element = document.createElement("img");
		thumb.element.src = thumb.img;
		var divThumb = renderThumb(thumb);
		divThumb.onclick = function() {showForm(thumb);};
		contentDiv.appendChild(divThumb);
	}
	

  //============================================================================

	function initGigfmBookmarklet() {
		console.log("initGigfmBookmarklet...");
		function whenDone(nEmbeds) {
			console.log("done detection!");
			document.getElementById("gigfmLoading").innerHTML = nEmbeds ? ""
				: "No concerts were found on this page, sorry...";
		}
		contentDiv = document.getElementById("gigfmContent");
		//var trackDetector = new TrackDetector(include);
		//trackDetector.run(addThumb, whenDone);
		var gigDetector = new GigDetector();
		//gigDetector.run(addThumb, whenDone);
		console.log(gigDetector.getGigLinks());
	}

  //============================================================================

	var toInclude = [
		"/stylesheets/bookmarklet.css",
		"/scripts/jquery.min.js",
		"/scripts/GigDetector.js"
	//	"/scripts/TrackDetector.js"
	];
	
	(function loadNext(){
		if (toInclude.length) {
			var src = toInclude.shift();
			console.log("loading", src, "...");
			include(urlPrefix + src + urlSuffix, loadNext);
		}
		else initGigfmBookmarklet();
	})();

})();