/**
 *  jLL: Javascript Library Loader v0.1
 *  https://github.com/MihaiBojin/jLL
 *
 *  @author Mihai Bojin <mihai.bojin@gmail.com>
 *  @copyright Copyright 2011, Mihai Bojin
 *
 *  Licensed under the MIT license.
 *
 *  The Javascript Library Loader is a toolkit that allows asynchronous loading of 
 *  different Javascript libraries, plugins etc while defining an easy mechanism to
 *  handle inter-library dependencies.
 *
 *  It implements two inner clases that get exposed by public methods:
 *  - ScriptTag: component that injects and loads scripts asynchronously into web pages; 
 *               can trigger multiple onload events; 
 *               can check for conditions and run alternative logic when that happens
 *  - ScriptDeferrer: component that can load a number of scripts in order,
 *                    one after another (useful to handle script dependencies)
 *
 *  The component also has a debugging mode which output logs to the console object
 *  available in most modern browsers.
 *  Logging is disabled by default, but can be enabled by running the enableDebug() method.
 */
(function (window, document) {
	/**
     *  Reference to the page's "head" tag
     *	@private
     */
	var head = document.getElementsByTagName('head')[0];
		
	/**
	 *	@class creates DOM script tags, allows registration of load events and allows checking for user specified conditions before executing the code
	 *	@private
	 *  @constructor
	 */
	var ScriptTag = function (src) {
		/**
		 *	State attribute that gets set after script was loaded
		 *	@private 
		 */
		var wasLoaded = false;
		
		/**
		 *	State attribute that allows script events to run
		 *	@private 
		 */
		var canRun = false;
		
		/**
		 *	Queue for events that get executed after script is loaded
		 *	@private 
		 */
		var events = [];
		
		/**
		 *	Queue of checks that run before loading script
		 *	allows not loading/executing the script, in case one of the checks fails
		 *	@private 
		 */
		var checks = [];

		/**
		 *	Create a new script element
		 *	@private 
		 */
		var script = document.createElement('script');
		
		/**
		 *	Runs the events queue on the script's load completion
		 *	@private 
		 *	@inner
		 */
		var triggerEvents = function () {
			var i = 0;
			
			if (true === wasLoaded) {
				//do not trigger the events twice
				return;
			}
			wasLoaded = true;
			
			// parse the events queue and run the events
			for (i = 0; i < events.length; i += 1) {
				events[i]();
			}
		};
		
		// define the tag's type and src attributes
		script.type = 'text/javascript';
		script.src = src;

		// add event handling for most browsers
		script.onload = triggerEvents;
		
		// add event handling for IE based browsers
		script.onreadystatechange = function () {
			// check if either complete|loaded events have been hit
			// and fire the next item in the deferring queue
			if (/loaded|complete/.test(this.readyState)) {
				// check if next item in queue was not triggered for this element
				if (true !== wasLoaded && canRun) {
					triggerEvents();
				}
			}
		};
		
		/**
		 *	Converts the ScriptTag object to a string
		 *	@returns {String} src value of the script's src attribute
		 *	@public 
		 */
		this.toString = function () {
			return script.src;
		};
		
		/**
		 *	Adds a condition and trigger to the checks queue
		 *	@param {function} condition Closure that gets executed before script is loaded; if it returns false, the script is not loaded and a trigger executed
		 *	@param {function} [trigger=undefined] trigger Closure that will be executed if check fails; this param is optional
		 *	@public 
		 */
		this.addCheck = function (condition, trigger) {
			// check if condition is a closure and exit if not (not adding the check)
			if ("function" !== typeof condition) {
				jLL.log("Condition must be a function; check was not added");
				return;
			}

			// if trigger is not function, define blank closure
			if ("function" !== typeof trigger) {
				trigger = function () {};
			}
			
			// add condition on index 0 and trigger on index 1
			checks.push([condition, trigger]);
		};
		
		/**
		 *	Adds an event to the queue
		 *	@param {function} event Closure that gets executed after script is loaded
		 *	@public 
		 */
		this.addEvent = function (event) {
			// check if event is function and exit if not
			if ("function" !== typeof event) {
				jLL.log("Parameter must be a function; event was not added");
				return;
			}
			events.push(event);
		};

		/**
		 *	Append script element to DOM and return true if script was loaded (no checks failed), or false otherwise
		 *	@returns {boolean} True if script was injected in DOM (no checks failed), or false if any checks failed
		 *	@public 
		 */
		this.render = function () {
			var i = 0;
			
			// determine if there are any checks to run before loading the script
			if (0 < checks.length) {
				var result = true;
				for (i = 0; i < checks.length; i += 1) {
					var tCheck = checks[i][0]();
					result = result && tCheck;
					if (!tCheck) {
						checks[i][1]();
					}
				}

				// stop loading if any check has failed
				if (true !== result) {
					jLL.log("At least one of the conditions failed: " + script.src);
					return false;
				}
			}
			
			// inject script in DOM and set the canRun state to true (IE loads the script and triggers the onload events even if it was not injected into DOM; this circumvents that case)
			head.appendChild(script);
			canRun = true;
			jLL.log("Queued: " + script.src);
			return true;
		};
	};
	
	/**
	 *	@class Defines a script loading queue that can load and execute scripts in order; useful when scripts depend on each other and need to be executed in a certain order
	 *	@requires ScriptTag
	 *	@private
	 *  @constructor
	 */
	var ScriptDeferrer = function () {
		var queue = [];
		var running = 0;
		
		/**
		 *	Push script in load queue
		 *	Allows specifying script onload events and checks to circumvent script loading
		 *	@param {String|Array} src Script's src attribute; can also accept an indexed array that specifies more than one scripts to be pushed into queue (format is [[src, onload, check, checkTrigger], ...])
		 *	@param {onload} [onload=undefined] function Event to execute on script load; it is optional
		 *	@param {check} [check=undefined] function Condition closure that has to pass before script is loaded
		 *	@param {checkTrigger} [checkTrigger=undefined] function Closure that gets executed if the corresponding check fails
		 *	@public 
		 */
		this.push = function (src, onload, check, checkTrigger) {
			var i, tag;
			
			// push multiples script to queue, from array of [src, onload, check, checkTrigger]
			if ("object" === typeof src && -1 !== src.constructor.toString().indexOf("Array")) {
				for (i in src) {
					if (src.hasOwnProperty(i)) {
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
				        tag = jLL.buildScriptTag(src[i][0]);

						// check if onload event was passed
						if ("undefined" !== typeof src[i][1]) {
					        tag.addEvent(src[i][1]);
						}

						// if check closure was passed, define it and it's trigger
						if ("undefined" !== typeof src[i][2]) {
					        tag.addCheck(src[i][2], src[i][3]);
						}

						// push ScriptTag into queue
						queue.push(tag);
					}
				}
				
			// push one script to queue
			} else if ("string" === typeof src) {
		        tag = jLL.buildScriptTag(src);
		        tag.addCheck(check, checkTrigger);
		        tag.addEvent(onload);
				queue.push(tag);
			
			// handle wrong arguments
			} else {
				jLL.log("Unknown parameter type passed to ScriptDeferer.push: " + typeof src + "; script was not added to load queue!");
				return;
			}
		};
		
		/**
		 *	Starts executing the load queue; it can be triggered before actually adding all the scripts
		 *	@private 
		 */
		var loadFromQueue = function () {
			var tScript = queue.shift();
			
			// check if queue is empty in which case finish the process
			if ("undefined" === typeof tScript) {
				running = 0;
				jLL.log("Queue was loaded!");
				return;
			}
			running = 1;
			jLL.log("Loading " + tScript.toString());
			
			// define trigger for loading next script in queue
			var nextInQueue = function () {
				loadFromQueue();
			};
			
			// trigger loading the next element in queue on script onload
			tScript.addEvent(nextInQueue);
			
			// render (load) script and tie trigger nextInQueue in case one of the script's defined checks has failed and script was not loaded
			if (!tScript.render()) {
				nextInQueue();
			}
		};

		/**
		 *	Starts loading the scripts in the queue (only if queue isn't already being loaded)
		 *	Public wrapper for loadFromQueue
		 *	@returns {boolean} False if another process was loading the queue, or true if loading was started
		 *	@public
		 */
		this.run = function () {
			// if queue is already being loaded, skip 
			if (1 === running) {
				jLL.log("Queue is already loading!");
				return false;
			} 
			
			// starts loading scripts from the queue
			jLL.log("Loading queue...");
			loadFromQueue();
			return true;
		};

		/**
		 *	Attaches the run method to the DOMload event, or executes it directly if DOMready event has already occurred
		 *	@public
		 */
		this.runOnLoad = function () {
			// if DOMready event has already occurred, start loading the queue
			if ("complete" === document.readyState) {
				this.run();
				return;
			}
			
			// attach this.run to DOMready event
			if (window.attachEvent) {
				window.attachEvent('onload', this.run);
			} else {
				window.addEventListener('load', this.run, false);
			}
		};
	};
	
	/**
	 *	Defines the jLL class
	 *	@class Represents the jLL object that will eventually be made available in the global namespace
	 */
	function JLL() {}
		
	/**
	 *	Defines the jLL class prototype
	 */
	JLL.prototype = (function () {
		/**
		 *	State attribute that allows enabling the debug mode in which log messages are sent to the global console object
		 *	@private
		 */
		var enableDebug = false;
		
		/**
		 *	Defines a singleton instance of ScriptDeferrer
		 *	@private
		 */
		var deferrer = new ScriptDeferrer();
		
		/**
		 *	Defines the prototype in literal notation
		 *	The module pattern was used to allow defining private attributes for the jLL class
		 *	@constructor
		 */
		return {
			
			/**
			 *	Factory method for the ScriptTag class
			 *	@param {String} src Script's src attribute
			 *	@returns {ScriptTag} A new instance of the ScriptTag class
			 *	@public
			 */
			buildScriptTag: function (src) {
				return new ScriptTag(src);
			},
			
			/**
			 *	Factory method for the ScriptDeferrer class
			 *	@returns {ScriptDeferrer} A new instance of the ScriptDeferrer class
			 *	@public
			 */
			buildScriptDeferrer: function () {
				return new ScriptDeferrer();
			},
			
			/**
			 *	Returns the ScriptDeferrer object defined in jLL's constructor; usually only one deferring queue will be needed
			 *	@returns {ScriptDeferrer} Always returns the same instance of the ScriptDeferrer object, defined in jLL's constructor
			 *	@public
			 */
			staticDeferrer: function () {
				return deferrer;
			},
			
			/**
			 *	Enables the debugging mode and send all log messages to the global console object
			 *	@public
			 */
			enableDebug: function () {
				enableDebug = true;
			},
			
			/**
			 *	Logs messages passed to it to console; checks if enableDebug mode is enabled and console object exists
			 *	@param {String} message Message to be logged
			 *	@public
			 */
			log: function (message) {
				// do not log anything if enableDebug mode is off
				if (true !== enableDebug) {
					return;
				}
				
				// check if console object is available
				// if not, set enableDebug=false, because no message will be available to be logged in the current runtime
				if ("undefined" === typeof console) {
					enableDebug = false;
					return;
				}
				
				// log message to console
				console.log(message);
			}
		};
	}());
	
	// attach an instance of the jLL object to the window
	window.jLL = new JLL();
	
}(window, document));