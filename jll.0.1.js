(function(window, document, console) {
	// reference to the "head" tag
	var head = document.getElementsByTagName('head')[0];
	
	// define ScriptTag class constructor
	var ScriptTag = function(src) {
		// trigger for loaded event
		var wasLoaded = false;
		
		// events to execute on scripts completion
		var events = [];
		
		// allows checks to be added to the script tag and ran before the actual script is loaded
		// in case of fail it allows events to be triggered
		var checks = [];
		
		// triggers events on script completion (only once)
		var triggerEvents = function() {
			if (true == wasLoaded) {
				//do not trigger the events twice
				return ;
			}
			wasLoaded = true;
			
			// go through all the events and fire them (they will race at the same time)
			for (var i=0; i<events.length; i++) {
				events[i]();
			}
		}
		
		// create new script element
		var script = document.createElement('script');
		script.type = 'text/javascript';
		
		// append script's src attribute
		script.src = src;

		// add event handling for most browsers
		script.onload = triggerEvents;
		
		// add event handling for IE based browsers
		script.onreadystatechange = function () {
			// check if either complete|loaded events have been hit
			// and fire the next item in the deferring queue
			if (/loaded|complete/.test(this.readyState)) {
				// check if next item in queue was not triggered for this element
				if (true !== wasLoaded) {
					triggerEvents();
				}
			}
		}
		
		// adds events to be executed on script's onload event
		this.addEvent = function(func) {
			events.push(func);
		}

		// append script element to html head
		this.render = function() {
			// determine if there are any checks to run before loading the script
			if (0 < checks.length) {
				var result = true;
				for (var i=0; i<checks.length; i++) {
					var tCheck = checks[i][0]();
					result &= tCheck;
					if (!tCheck) {
						checks[i][1]();
					}
				}

				// stop loading if any check has failed
				if (true != result) {
					jLL.log("At least one of the conditions failed: " + script.src);
					return ;
				}
			}
			
			// append item to html head tag
			head.appendChild(script);
			jLL.log("Queued: " + script.src);
		}
		
		// add check and trigger
		this.addCheck = function(condition, trigger) {
			// check if condition is function and exit if not
			if ("function" != typeof condition) {
				jLL.log("Condition must be a function; check was not added");
				return ;
			}

			// if trigger is not function, define blank function
			if ("function" != typeof trigger) {
				trigger = function(){}
			}			
			
			// add condition on index 0 and trigger on index 1
			checks.push([condition, trigger]);
		}
	}

	// create JLL class
	function JLL() {}
	
	// create JLL's prototype
	JLL.prototype = (function(){
		var enableDebug = false;
		
		return {
			buildScriptTag: function(src) {
				return new ScriptTag(src);
			},
			
			// enables logging to console
			enableDebug: function() {
				enableDebug = true;
			},
			
			// log message to console (if console is available)
			log: function(message, type) {
				// do not log anything if enableDebug mode is off
				if (true !== enableDebug) {
					return;
				}
				
				// check if console object is available
				// if it is not, disable enableDebug mode so that subsequent checks return at previous 'if'
				if ("undefined" == typeof console) {
					enableDebug = false;
					return;
				}
				
				// log message to console
				console.log(message);
			},
		}
	})();
	
	window.jLL = new JLL();
})(window, document, console);