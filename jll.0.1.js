(function(window, document) {
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
		
		var ok = false;
		
		// triggers events on script completion (only once)
		var triggerEvents = function() {
			if (true == wasLoaded) {
				//do not trigger the events twice
				return ;
			}
			wasLoaded = true;
			
			// go through all the events and fire them (they will race at the same time)
			for (var i = 0; i < events.length; i++) {
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
				if (true !== wasLoaded && ok) {
					triggerEvents();
				}
			}
		}
		
		// public method to get a script src attribute
		this.src = function() {
			return script.src;
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
		
		// adds events to be executed on script's onload event
		this.addEvent = function(trigger) {
			// check if event is function and exit if not
			if ("function" != typeof trigger) {
				jLL.log("Parameter must be a function; event was not added");
				return ;
			}
			events.push(trigger);
		}

		// append script element to html head and return true for success
		// or false when at least a check failed
		this.render = function() {
			// determine if there are any checks to run before loading the script
			if (0 < checks.length) {
				var result = true;
				for (var i = 0; i < checks.length; i+=1) {
					var tCheck = checks[i][0]();
					result &= tCheck;
					if (!tCheck) {
						checks[i][1]();
					}
				}

				// stop loading if any check has failed
				if (true != result) {
					jLL.log("At least one of the conditions failed: " + script.src);
					return false;
				}
			}
			
			// append item to html head tag
			head.appendChild(script);
			ok = true;
			jLL.log("Queued: " + script.src);
			return true;
		}
	}
	
	// define the ScriptDeferrer class constructor
	var ScriptDeferrer = function() {
		var queue = [];
		var running = 0;
		
		// push script to queue;
		// onload event can be specified
		// check to run before loading script can be defined
		this.push = function(src, onload, check, checkTrigger) {
			// push multiple script to queue, from array of [src, onload, check, checkTrigger]
			if ("object" == typeof src && -1 != src.constructor.toString().indexOf("Array")) {
				for (i in src) {
					// if src[i] is not an array, skip row
					if ("object" !== typeof src[i] || -1 === src[i].constructor.toString().indexOf("Array")) {
						jLL.log("Row is not an array! Skipped row " + i);
						continue;
					}
					
					// if first argument is not string containing location of script, skip row
					if ("string" !== typeof src[i][0]) {
						jLL.log("First argument must be location of script to load! Skipped row " + i);
						continue;
					}
					
					// create new ScriptTag element
			        var tag = jLL.buildScriptTag(src[i][0]);
			
					// check if onload event was passed
					if ("undefined" != typeof src[i][1]) {
				        tag.addEvent(src[i][1]);
					}
					
					// if check closure was passed, define it and it's trigger
					if ("undefined" != typeof src[i][2]) {
				        tag.addCheck(src[i][2], src[i][3]);
					}

					// push ScriptTag into queue
					queue.push(tag);
				}
				
			// push one script to queue
			} else if ("string" === typeof src) {
		        var tag = jLL.buildScriptTag(src);
		        tag.addCheck(check, checkTrigger);
		        tag.addEvent(onload);
				queue.push(tag);
			
			// handle wrong arguments
			} else {
				jLL.log("Unknown parameter type passed to ScriptDeferer.push: " + typeof arg + "; script was not added to load queue!");
				return ;
			}
		}
		
		// start loading script from queue, one by one
		var loadFromQueue = function() {
			var tScript = queue.shift();
			
			// check if queue is empty in which case finish the process
			if ("undefined" === typeof tScript) {
				running = 0;
				jLL.log("Queue was loaded!");
				return;
			}
			running = 1;
			jLL.log("Loading " + tScript.src());
			
			// define trigger for loading next script in queue
			var nextInQueue = function(){
				loadFromQueue();
			};
			
			// trigger loading the next element in queue on script onload
			tScript.addEvent(nextInQueue);
			
			// render (load) script and tie trigger nextInQueue in case
			// one of the script's defined checks has failed and script was not loaded
			if (!tScript.render()) {
				nextInQueue();
			}
		}

		// starts loading the queue and checks that queue is not already beeing loaded
		this.run = function() {
			if (1 == running) {
				jLL.log("Queue is already loading!");
			} else {
				jLL.log("Loading queue...");
				loadFromQueue();
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

	// create JLL class
	function JLL() {}
	
	// create JLL's prototype
	JLL.prototype = (function(){
		var enableDebug = false;
		var deferrer = new ScriptDeferrer();
		
		return {
			buildScriptTag: function(src) {
				return new ScriptTag(src);
			},
			
			buildScriptDeferrer: function(src) {
				return new ScriptDeferrer();
			},
			
			staticDeferrer: function() {
				return deferrer;
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
})(window, document);