var MAX_RESULTS = 1;

/*

Copyright (c) 2006. All Rights reserved.

If you use this script, please email me and let me know, thanks!

Andrew Hedges
andrew (at) hedges (dot) name

If you want to hire me to write JavaScript for you, see my resume.

http://andrew.hedges.name/resume/

*/

function LevenshteinDistance() {

	// return the smallest of the three values passed in
	var minimator = function(x,y,z) {
		if (x < y && x < z) return x;
		if (y < x && y < z) return y;
		return z;
	}

	function normalize(str) {
		return str.replace(/[^\w]*/ig, "").toLowerCase();
	}

	// calculate the Levenshtein distance between a and b
	this.compute = function(a, b) {
		var cost;

		var a = normalize(a);
		var b = normalize(b);
		
		var m = a.length;
		var n = b.length;
		
		// make sure a.length >= b.length to use O(min(n,m)) space, whatever that is
		if (m < n) {
			var c=a;a=b;b=c;
			var o=m;m=n;n=o;
		}
		
		var r = new Array();
		r[0] = new Array();
		for (var c = 0; c < n+1; c++) {
			r[0][c] = c;
		}
		
		for (var i = 1; i < m+1; i++) {
			r[i] = new Array();
			r[i][0] = i;
			for (var j = 1; j < n+1; j++) {
				cost = (a.charAt(i-1) == b.charAt(j-1))? 0: 1;
				r[i][j] = minimator(r[i-1][j]+1,r[i][j-1]+1,r[i-1][j-1]+cost);
			}
		}
		
		return r[m][n];
	}

}
	


// =======================================

function YoutubeSearch() {

	function renderResult(r) {
		return {
			id: r.id,
			img: r.img || r.thumbnail.hqDefault || r.thumbnail.sqDefault,
			url: r.url || r.player["default"],
			name: r.name || r.title
		};
	};

	this.query = function(q, cb) {
		var url = "http://gdata.youtube.com/feeds/api/videos?v=2&alt=jsonc&first-index=0&max-results="+MAX_RESULTS+"&q="+encodeURIComponent(q)+"&callback=?";
		$.getJSON(url, function(json) {
			json = json || {};
			//console.log("yt search response:", json);
			var results = json.data.items;
			if (results) {
				var items = [];
				for (var i in results)
					items.push(renderResult(results[i]));
				cb(items);
			}
			else
				cb(null);
		}, "json");
	}
};
