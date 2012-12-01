/**
* Player
* @author adrienjoly
**/

// configuration

var USE_SWFOBJECT = true; // ... to embed youtube flash player

// utility functions

if (undefined == window.console) 
	console = {log:function(){}};

YoutubePlayer = (function() {
	var EVENT_MAP = {
		/*YT.PlayerState.ENDED*/ 0: "onEnded",
		/*YT.PlayerState.PLAYING*/ 1: "onPlaying",
		/*YT.PlayerState.PAUSED*/ 2: "onPaused"
	};

	function YoutubePlayer(eventHandlers, embedVars) {
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Youtube";
		this.isReady = false;
		this.trackInfo = {};
		var that = this;

		window.onYoutubeStateChange = function(newState) {
			//console.log(that.embedVars.playerId + " state:", newState);
			if (newState == 1)
				that.trackInfo.duration = that.element.getDuration();
			var eventName = EVENT_MAP[newState];
			if (eventName && that.eventHandlers[eventName])
				that.eventHandlers[eventName](that);
		};

		window.onYoutubeError = function(error) {
			console.log(that.embedVars.playerId + " error:", error);
			if (eventHandlers.onError)
				eventHandlers.onError(that);
		}

		window.onYouTubePlayerReady = window.onYouTubePlayerAPIReady = function(playerId) {
			that.element = /*that.element ||*/ document.getElementById(playerId); /* ytplayer*/
			that.element.addEventListener("onStateChange", "onYoutubeStateChange");
			that.element.addEventListener("onError", "onYoutubeError");
		}

		that.isReady = true;
		if (that.eventHandlers.onApiLoaded)
			that.eventHandlers.onApiLoaded(that);
		if (that.eventHandlers.onApiReady)
			setTimeout(function() { that.eventHandlers.onApiReady(that); }, 500);
	}

	YoutubePlayer.prototype.embed = function (vars) {
		//console.log("youtube embed:", vars);
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || 'ytplayer';
		this.trackInfo = {};
		this.element = document.createElement("object");
		this.element.id = this.embedVars.playerId;

		//this.embedVars.playerContainer.appendChild(this.element);
		this.holder = document.createElement("div");
		this.holder.id = "genericholder";
		this.holder.appendChild(this.element);
		this.embedVars.playerContainer.appendChild(this.holder);

		var embedAttrs = {
			id: this.embedVars.playerId,
			width: this.embedVars.width || '200',
			height: this.embedVars.height || '200',
			type: "application/x-shockwave-flash",
			data: 'https://www.youtube.com/v/'+this.embedVars.videoId+'?autoplay=1&amp;version=3&amp;enablejsapi=1&amp;playerapiid='+this.embedVars.playerId+'&amp;controls=1&amp;modestbranding=1&amp;showinfo=1&amp;wmode=transparent&amp;origin=' + this.embedVars.origin,
			innerHTML: '<param value="always" name="allowScriptAccess"><param value="transparent" name="wmode">'
		};
		var params = {
			autoplay: 1,
			version: 3, 
			enablejsapi: 1,
			playerapiid: this.embedVars.playerId,
			controls: 1,
			modestbranding: 1,
			showinfo: 1,
			wmode: "transparent",
			origin: this.embedVars.origin,
			allowFullScreen: "true",
			allowscriptaccess: "always"
		};
		swfobject.embedSWF(embedAttrs.data, this.embedVars.playerId, embedAttrs.width, embedAttrs.height, "9.0.0", "/scripts/swfobject_expressInstall.swf", null, params);
		$(this.element).show();
		if (/*!this.isReady &&*/ this.eventHandlers.onEmbedReady)
			this.eventHandlers.onEmbedReady();
		//this.isReady = true;
	}

	YoutubePlayer.prototype.getEid = function(url, cb) {
		var regex = // /https?\:\/\/(?:www\.)?youtu(?:\.)?be(?:\.com)?\/(?:(?:.*)?[\?\&]v=|v\/|embed\/|\/)?([a-zA-Z0-9_\-]+)/; //^https?\:\/\/(?:www\.)?youtube\.com\/[a-z]+\/([a-zA-Z0-9\-_]+)/
			/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/;
		//var matches = regex.exec(url);
		var matches = url.match(regex);
		cb(matches ? matches.pop() : null, this);
	}

	YoutubePlayer.prototype.play = function(id) {
		//console.log("PLAY -> YoutubePlayer", this.currentId, id);
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	}

	YoutubePlayer.prototype.pause = function() {
		//console.log("PAUSE -> YoutubePlayer"/*, this.element, this.element && this.element.pauseVideo*/);
		if (this.element && this.element.pauseVideo)
			this.element.pauseVideo();
	}

	YoutubePlayer.prototype.resume = function() {
		//console.log("RESUME -> YoutubePlayer", this.element, this.element && this.element.playVideo);
		if (this.element && this.element.playVideo)
			this.element.playVideo();
	}
	
	YoutubePlayer.prototype.stop = function() {
		if (this.element && this.element.stopVideo)
			this.element.stopVideo();
		//$(this.element).remove();//.hide();
	}
	
	YoutubePlayer.prototype.getTrackPosition = function(callback) {
		if (callback && this.element && this.element.getCurrentTime)
			callback(this.element.getCurrentTime());
	};
	
	YoutubePlayer.prototype.setTrackPosition = function(pos) {
		if (this.element && this.element.seekTo)
			this.element.seekTo(pos, true);
	};
	
	YoutubePlayer.prototype.setVolume = function(vol) {
		if (this.element && this.element.setVolume)
			this.element.setVolume(vol * 100);
	};
	
	return YoutubePlayer;
})();

/////////////////////////////////////////////////////////////////////////////////

function Playem(playerFunctions) {

	var players = []; // instanciated Player classes, added by client
	playerFunctions = playerFunctions || {}; // provided handlers for players' events

	playerFunctions.onError = playerFunctions.onError || function(error) {
		alert(error);
	};

	// core functions
	
	var currentTrack = null;
	var trackList = [];
	var whenReady = null;
	var playersToLoad = 0;
	var progress = null;
	var that = this;

	function doWhenReady(player, fct) {
		//console.log("do when ready", player.label, player.isReady);
		var done = false;
		whenReady = {
			player: player,
			fct: function () {
				if (done) return;
				done = true;
				fct();
				whenReady = null;
			}
		};
		if (player.isReady)
			whenReady.fct();
	}

	function addTrackById(id, player, metadata) {
		if (id) {
			var track = {
				index: trackList.length,
				trackId: id,
				//img: img,
				player: player,
				playerName: player.label.replace(/ /g, "_"),
				metadata: metadata || {}
			};
			trackList.push(track);
			//console.log("added:", player.label, "track", id, track/*, metadata*/);
		}
		else
			console.log("warning: no id provided");
	}

	var volume = 1;

	function setVolume(vol) {
		volume = vol;
		if (currentTrack && currentTrack.player.setVolume)
			currentTrack.player.setVolume(vol);
	}

	function playTrack(track) {
		//console.log("playTrack", track);
		doWhenReady(track.player, function() {
			if (currentTrack) {
				currentTrack.player.stop && currentTrack.player.stop();
				$("#genericholder iframe").attr("src", ""); // to make sure that IE really destroys the iframe embed
				$("#genericholder").html("").remove();
				if (progress)
					clearInterval(progress);
			}
			currentTrack = track;
			delete currentTrack.trackPosition; // = null;
			delete currentTrack.trackDuration; // = null;
			if (playerFunctions.onTrackChange)
				playerFunctions.onTrackChange(track);
			//console.log("playing", track);
			track.player.play(track.trackId);
			setVolume(volume);
			if (currentTrack.index == trackList.length-1 && playerFunctions.loadMore)
				playerFunctions.loadMore();
		});
	}

	// functions that are called by players => to propagate to client
	function createEventHandlers (playemFunctions) {
		var eventHandlers = {
			onApiReady: function(player){
				//console.log(player.label + " api ready");
				if (whenReady && player == whenReady.player)
					whenReady.fct();
				if (playerFunctions.onReady && 0 == --playersToLoad)
					playerFunctions.onReady();
			},
			onEmbedReady: function(player) {
				setVolume(volume);
			},
			onPlaying: function(player) {
				//console.log(player.label + ".onPlaying");
				setVolume(volume);
				playerFunctions.onPlay && setTimeout(function() {
					playerFunctions.onPlay();
				}, 1);
				if (/*playerFunctions.onTrackInfo &&*/ player.trackInfo && player.trackInfo.duration)
					this.onTrackInfo({
						position: player.trackInfo.position || 0,
						duration: player.trackInfo.duration
					});

				if (progress)
					clearInterval(progress);
				if (player.getTrackPosition && playerFunctions.onTrackInfo) {
					var that = eventHandlers; //this;
					progress = setInterval(function(){
						player.getTrackPosition(function(trackPos) {
							that.onTrackInfo({
								position: trackPos,
								duration: player.trackInfo.duration || currentTrack.trackDuration
							});
						});
					}, 1000);
				}
			},
			onTrackInfo: function(trackInfo) {
				//console.log("ontrackinfo", trackInfo, currentTrack);
				if (currentTrack && trackInfo) {
					if (trackInfo.duration)
						currentTrack.trackDuration = trackInfo.duration;
					if (trackInfo.position)
						currentTrack.trackPosition = trackInfo.position;
				}
				playerFunctions.onTrackInfo && playerFunctions.onTrackInfo(currentTrack);
			},
			onPaused: function(player) {
				//console.log(player.label + ".onPaused");
				if (progress)
					clearInterval(progress);
				progress = null;
				//if (!avoidPauseEventPropagation)
				//	playerFunctions.onPause();
				//avoidPauseEventPropagation = false;
			},
			onEnded: function(player) {
				//console.log(player.label + ".onEnded");
				playemFunctions.next();
			},
			onError: function(player) {
				//console.log(player.label + ".error");
				setTimeout(function() {
					playemFunctions.next();
				}, 1000);
			}
		};
		return eventHandlers;
	}

	// exported methods, mostly wrappers to Players' methods
	return {
		addPlayer: function (playerClass, vars) {
			playersToLoad++;
			players.push(new playerClass(createEventHandlers(this), vars));
		},
		getQueue: function() {
			return trackList;
		},
		clearQueue: function() {
			trackList = [];
		},
		addTrackByUrl: function(url, metadata) {
			var remaining = players.length;
			for (var p=0; p<players.length; ++p)
				players[p].getEid(url, function(eid, player){
					//console.log("test ", player.label, eid);
					if (eid)
						addTrackById(eid, player, metadata);
					else if (--remaining == 0) {
						$(metadata.post).addClass("disabled");
						console.log("unrecognized track:", url, metadata);
					}
				});
		},
		play: function(i) {
			playTrack(i != undefined ? trackList[i] : currentTrack || trackList[0]);
		},
		pause: function() {
			currentTrack.player.pause();
			playerFunctions.onPause();
		},
		resume: function() {
			currentTrack.player.resume();
		},
		next: function() {
			playTrack(trackList[(currentTrack.index + 1) % trackList.length]);
		},
		prev: function() {
			playTrack(trackList[(trackList.length + currentTrack.index - 1) % trackList.length]);
		},
		seekTo: function(pos) {
			if (currentTrack && currentTrack.trackDuration)
				currentTrack.player.setTrackPosition(pos * currentTrack.trackDuration);
		},
		setVolume: setVolume
	};
}

/////////////////////////////////////////////////////////////////////////////////

function ProgressBar(p) {
	var p = p || {};
	var updateBarOnDrag = p.updateBarOnDrag;
	this.value = p.value || 0;
	var $progressTrack = p.progressTrack;
	var $progressBar = $progressTrack.find(".progressBar");
	var $progressCursor = $progressTrack.find(".progressCursor");
	var draggingCursor = false;
	$progressTrack.mousedown(function(e) {
		//console.log("progresstrack.mousedown", e, $progressTrack);
		var start_x = e.pageX;
		var min_x = $progressTrack.offset().left + 3;
		var width = $progressTrack.width();
		var offset_x = Math.min(width, Math.max(0, e.pageX - min_x));
		draggingCursor = true;
		function moveCursor(e) {
			offset_x = Math.min(width, Math.max(0, e.pageX - min_x));
			$progressCursor.css("left", offset_x -6 + "px");
			if (updateBarOnDrag)
				$progressBar.css("width", 100 * (offset_x / width) + "%");
		}
		$(document).mousemove(moveCursor).one('mouseup', function(e) {
			draggingCursor = false;
			$(document).unbind('mousemove');
			moveCursor(e);
			p.onChange(this.value = offset_x / width);
		});
		return false;
	});
	this.setValue = function(newValue) {
		if (NaN != newValue && !draggingCursor) {
			this.value = Math.min(1, Math.max(0, newValue));
			$progressBar.css("width", 100 * this.value + "%");
			$progressCursor.css("left", $progressTrack.width() * this.value - 6 + "px");
		}
		return this.value;
	}
}

/////////////////////////////////////////////////////////////////////////////////

function GigfmPlayer() {

	var currentTrack = null;
	var isPlaying = false;

	// utility functions

	function setPageTitlePrefix(symbol) {
		var spacePos = window.document.title.indexOf(" ");
		if (spacePos < 3)
			window.document.title = window.document.title.substr(spacePos+1);
		window.document.title = symbol + " " + window.document.title;
	}

	// ui init

	var div = document.getElementById("player");

	var $body = $("body");
	var $trackTitle = $("#trackTitle");
	var $trackNumber = $("#trackNumber");
	var $trackSrc = $("#trackSrc");

	function setState (state, $post) {/*
		var loading = (state == "loading");
		isPlaying = (state == "playing");

		$body.toggleClass("playing", isPlaying);
		$trackTitle.toggleClass("loading", loading);

		var classes = $body.attr("class").split(" ");
		for (var i in classes)
			if (classes[i].indexOf("playing_") == 0)
				$body.removeClass(classes[i]);
		$body.addClass("playing_" + currentTrack.playerName);

		$trackSrc.attr("href", currentTrack.metadata.url);

		// for invisible embeds (e.g. soundcloud)
		$(".post .play").removeClass("loading").removeClass("playing").removeClass("paused");
		if ($post)
			$post.find(".play").addClass(state);

		// for visible embeds (e.g. youtube)
		$("#playBtnOverlay").removeClass("loading").removeClass("playing").removeClass("paused").addClass(state);
		*/
	}

	var $progressTimer = $("#progressTimer");
	
	var progressBar = new ProgressBar({
		progressTrack: $("#progressTrack"),
		onChange: function(pos) {
			playem.seekTo(pos);
			setProgress(pos);
		}
	});

	function setProgress(progress) {
		if (progress && NaN != progress && currentTrack.trackDuration) {
			progressBar.setValue(progress);
			var sec = currentTrack.trackDuration - (currentTrack.trackDuration * progress);
			var mn = Math.floor(sec / 60);
			sec = ""+Math.floor(sec - (mn * 60));
			$progressTimer.text("-" + mn + ":" + (sec.length < 2 ? "0" : "") + sec);
		}
	}

	var $volumeTrack = $("#volumeTrack");
	if ($volumeTrack.length)
		var volumeBar = new ProgressBar({
			value: 1.0,
			updateBarOnDrag: true,
			progressTrack: $volumeTrack,
			onChange: function(pos) {
				playem.setVolume(pos);
				volumeBar.setValue(pos);
			}
		});

	$(".volume.less").click(function(){
		playem.setVolume(volumeBar.setValue(/*volumeBar.value - 0.1*/ 0));
	});
	$(".volume.more").click(function(){
		playem.setVolume(volumeBar.setValue(/*volumeBar.value + 0.1*/ 1));
	});

	// data provider

	function highlightTrack(track) {
		//console.log("highlight track", track);
		$(".post").removeClass("playing");
		var $post = $(".post:visible[data-pid="+track.metadata.pid+"]").addClass("playing");
		return $post;
	}

	// playem interface

	var gigfmPlayerFunctions = {
		onReady: function() {},
		onTrackChange: function(track) {
			currentTrack = track;
			currentTrack.yetToPublish = true;
			//console.log("on track change", currentTrack);

			// display the play bar and the player
			$(div).show();
			$("#contentPane").addClass("withPlayer");
			setProgress();

			// update the current track title
			$trackTitle.html(track.metadata.title);
			$trackNumber.text((track.index + 1) + ". ");
			try { $trackTitle.ajaxify(); } catch(e) {}
			$("#trackThumb").css("background-image", "url('" + track.metadata.img + "')");
			//$("#trackPoster").html(track.metadata.authorHtml);
			$("#btnLike").toggleClass("loved", track.metadata.isLoved);
			
			// highlight the post being played
			var $post = highlightTrack(track);
			setState("loading", $post);
		},
		onPlay: function() {
			setState("playing");
			setPageTitlePrefix("▶");
		},
		onPause: function() {
			setState("paused");
			setPageTitlePrefix("❚❚");
		},
		loadMore: function() {},
		onTrackInfo: function(info) {
			var progress = Number(info.trackPosition) / Number(info.trackDuration);
			setProgress(progress);
		}
	};

	// init playem DOM elements

	var playerContainer = document.createElement('div');
	$(playerContainer).append('<div id="playBtnOverlay" onclick="window.playem.playPause();">');

	var $containerParent = $("#videoPlayer");
	$containerParent.prepend($('<div id="playerContainer">').append(playerContainer));

	// init playem object, based on DOM elements

	var playem = new Playem(gigfmPlayerFunctions);

	playem.addPlayer(YoutubePlayer, {
		playerId: "genericplayer",
		origin: window.location.host || window.location.hostname || "gigfm.herokuapp.com",
		playerContainer: playerContainer,
		width: 516,
		height: 360
	});

	// ui-bound handlers

	return {
		pause: function() {
			if (currentTrack && isPlaying)
				playem.pause();
		},
		playPause: function() {
			if (!currentTrack)
				this.playAll();
			else if (isPlaying)
				playem.pause();
			else
				playem.resume();
		},
		next: function() {
			playem.next();
		},
		prev: function() {
			playem.prev();
		},
		playAll: function(trackNumber) {
			var trackNumber = trackNumber || 0;
			if (currentTrack && currentTrack.metadata.i == trackNumber)
				this.playPause();
			else
				playem.play(trackNumber);
		},
		addTrack: function(src, metadata) {
			playem.addTrackByUrl(src, metadata);
		}
	};
}

