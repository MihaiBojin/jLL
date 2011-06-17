// backup of old code

(function(window, document, console) {
	// reference to the current page's href
	var href = location.href.replace(/[\/]+$/, '');
	
	// reference to the "head" tag
	var head = document.getElementsByTagName('head')[0];
	
	// defines the script deferrer object constructor
	var ScriptDeferrer = function() {
		// holds the Array of scripts to be loaded
		var scripts = [];

		// reference to "this"
		var that = this;

		// script loaded by onReadyStateChange
		var stateLoader = [];

		// flag to signal if a 'run' process is already on the way
		var running = 0;

		// scripts already loaded
		var pageScripts = [];
		
		var loadedScripts = document.getElementsByTagName('script');
		for (var idx = 0; idx < loadedScripts.length; idx++) {
			pageScripts.push(loadedScripts[idx].src);
		}
		delete loadedScripts;
		
		this.showLoaded = function() {
			jLL.log(pageScripts, 'info');
		}
		
		// adds one or more elements to the "scripts" array
		this.push = function(arg) {
			var idx = 0;

			// if array was passed, go through each element; 
			// "concat" was not used here because when running the deferrer
			// it is important we have a properly numerically indexed Array
			if ("object" == typeof arg && -1 != arg.constructor.toString().indexOf("Array") ) {
				for (var idx in arg) {
					scripts.push(jLL.getAbsoluteUrl(arg[idx]));
				}

			// if string was passed, add it to the deferring queue
			} else if ("string" == typeof arg) {
				scripts.push(jLL.getAbsoluteUrl(arg));

			// if type is not Array or string, try to log the error and fail gracefully
			} else {
				jLL.log("Arg must be Array or string, not: " + typeof arg, 'error');
			}
			
			return this;
		}

		// creates new script element
		this.createElement = function (src) {
			// create new script element
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = src;
			return script;
		}
		
		// appends an event to the deferring queue
		this.appendEvent = function(script,trigger) {
			// this is for IE based browsers
			script.onreadystatechange = function () {
				// check if either complete|loaded events have been hit
				// and fire the next item in the deferring queue
				if (/loaded|complete/.test(this.readyState)) {
					// check if next item in queue was not triggered for this element
					if (1 !== stateLoader[script]) {
						stateLoader[script] = 1;
						trigger();
					}
				}
			}
			
			// this is for the normal browsers
			script.onload = trigger;
		}
		
		// append script element to html head
		this.pushScript = function(script) {
			// add script to pageScripts array
			pageScripts.push(script.src);
			jLL.log("Queued: " + script.src, 'info');
			
			// append item to html head tag
			head.appendChild(script);
		}
		
		this.checkLoaded = function(script) {
			// check if given script is already loaded in DOM
			for (var idx=0; idx < pageScripts.length; idx+=1) {
				if (script === pageScripts[idx]) {
					return true;
				}
			}
			
			return false;
		}

		// tries to load a script from queue
		this.loadScript = function() {
			var idx = 0;
			var currentScript = scripts.shift();
			var script = null;
			
			// if no elements are left in queue, stop loading scripts
			if ("undefined" === typeof currentScript) {
				running = 0;
				jLL.log("Done!");
				return ;
			}
			jLL.log("Loading: " + currentScript, 'info');
			
			if (that.checkLoaded(currentScript)) {
				// load next script and return
				jLL.log('already loaded: ' + currentScript, 'warn');
				that.loadScript();
				return ;
			}
			
			// generates a new script element
			script = that.createElement(currentScript);

			// triggers next event in line	
			that.appendEvent(script, that.loadScript);

			// append script to html head
			that.pushScript(script);
			
		}

		// initializes the current cursor and starts loading items in the deferring queue
		this.run = function() {
			if (1 == running) {
				jLL.log("Still running other process!", 'warn');
			} else {
				jLL.log("Starting");
				running = 1;
				that.loadScript();
			}
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
	
	
	function JLL() {
		this.deferrer = new ScriptDeferrer();
	}
	
	JLL.prototype = {
		
		// log message to console if console is available
		log: function(message, type) {
			if ("undefined" != typeof console) {
				switch (type) {
					case 'debug':
						console.debug(message);
						break;
					case 'info':
						console.info(message);
						break;
					case 'warn':
						console.warn(message);
						break;
					case 'error':
						console.error(message);
						break;
					default:
						console.log(message);
						break;
				}
			}
		},
		
		// generate absolute URL of an arg
		getAbsoluteUrl: function (arg) {
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
	}
	
	window.jLL = new JLL();
})(window, document
, console
);
