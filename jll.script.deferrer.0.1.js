// defines the script deferrer constructor
var ScriptDeferrer = function() {
	// holds the Array of scripts to be loaded
	var scripts = [];
	
	// flag Array to signal the triggerring of either loaded|complete events
	var fired = [];
	
	// current cursor of deferring queue
	var current = 0;
	
	// number of scripts in queue
	var count = 0;
	
	// reference to "this"
	var that = this;
	
	// reference to the "head" tag
	var head = document.getElementsByTagName('head')[0];

	// strip ending slashes of the current request URL
	var href = location.href.replace(/[\/]+$/, '');
	
	// generate absolute URL of an arg
	var getAbsolute = function (arg) {
		// get clean request href
		var tLoc = href;

		// init lastIndex positions
		var lastIndex = tLoc.length+2;
		var lastIndexPre = tLoc.length;
		
		// strip beginning slashes from the arg
		arg = arg.replace(/^[\/]+/, '');
		
		// get number of relative directories to go down to
		var relative = arg.match(/\.\./g).length;

		// if arg is not relative, return concatenated URL
		if (0 == relative) {
			return tLoc + "/" + arg;
		}
		
		// strip directories down to hostname and return hostname + final url part
		while (-1 < lastIndexPre && lastIndexPre + 1 < lastIndex && relative >= -1) {
			tLoc = tLoc.substring(0, lastIndex);
			var lastIndex = tLoc.lastIndexOf("/");
			var lastIndexPre = tLoc.lastIndexOf("/", lastIndex-1);
			relative -= 1;
		} 
		
		// return url of form protocol://hostname/path/to/file.ext
		return tLoc + "/" + arg.replace(/\.\.\//g, '');
	}
	
	// adds one or more elements to the "scripts" array
	this.push = function(arg) {
		var idx = 0;
		
		// if array was passed, go through each element; 
		// "concat" was not used here because when running the deferrer
		// it is important we have a properly numerically indexed Array
		if ("object" == typeof arg && -1 != arg.constructor.toString().indexOf("Array") ) {
			for (var idx in arg) {
				scripts.push(getAbsolute(arg[idx]));
				fired.push(0);
				count += 1;
			}
			
		// if string was passed, add it to the deferring queue
		} else if ("string" == typeof arg) {
			scripts.push(arg);
			fired.push(0);
			count += 1;
		
		// if type is not Array or string, try to log the error and fail gracefully
		} else {
			if ("undefined" != typeof console) {
				console.log("Arg must be Array or string, not: " + typeof arg);
			}
		}
	}
	
	// creates a html script element and deferres the following queued script until the
	// load event is triggered
	this.createScript = function() {
		var idx = 0;
		var script = null;
		var loadedScripts = null;
		var duplicate = false;

		// check if we have scripts to load
		if (current >= count) {
			return ;
		}

		// do not load same script twice
		var loadedScripts = document.getElementsByTagName('script');
		for (var idx = 0; idx < loadedScripts.length; idx++) {
			if (-1 != loadedScripts[idx].src.indexOf(scripts[current])) {
				current += 1;
				that.createScript();
				return ;
			}
		}

		// create new script element
		script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = scripts[current];
		
		// this is for IE based browsers
		script.onreadystatechange = function () {
			// check if either complete|loaded events have been hit
			// and fire the next item in the deferring queue
			if (/loaded|complete/.test(this.readyState)) {
				// check if next item in queue was not triggered for this element
				if (0 == fired[current]) {
					fired[current] = 1;
					that.createScript();
				}
			}
		}
		
		// this is for the normal browsers
		script.onload = that.createScript;
		
		// append item to html head tag
		head.appendChild(script);
		
		// increase the current cursor
		current += 1;
	}

	// initializes the current cursor and starts loading items in the deferring queue
	this.run = function() {
		current = 0;
		that.createScript();
	}
	
	// runs the deferrer queue after the onLoad event
	this.runOnLoad = function() {
		if (window.attachEvent) {
			window.attachEvent('onload', this.run);
		}
		else {
			window.addEventListener('load', this.run, false);
		}
	}
}
