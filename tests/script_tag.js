module("jLL");

test("jLL exists", 1, function() {
	if ("undefined" !== typeof window.jLL) {
		ok(true);
	} 
});

module("ScriptTag");

test("Loading script asynchronously", 1, function() {
	var script = jLL.buildScriptTag('mock_load/mock_object.js');
	stop();
	script.addEvent(testMockObject);
	script.addEvent(start);
	script.render();
});

test("Triggering events on script load", 2, function() {
	var script = jLL.buildScriptTag('mock_load/mock_add_1.js');
	stop();
	script.addEvent(mockOnloadEvent);
	script.addEvent(testMockObject);
	script.addEvent(start);
	script.render();
});

test("Check passes and loads object", 2, function() {
	var script = jLL.buildScriptTag('mock_load/mock_add_2.js');
	stop();
	script.addCheck(mockCheckEventTrue);
	script.addEvent(mockOnloadEvent);
	script.addEvent(start);
	script.render();
});

test("Run trigger on check fail; script not loaded", 2, function() {
	var script = jLL.buildScriptTag('mock_load/mock_object.js');
	stop();
	script.addCheck(mockCheckEventFalse, function() {
		mockCheckTrigger();
		start();
	});
	script.render();
});

test("Define script but do not load in page", 1, function() {
	var script = jLL.buildScriptTag('mock_load/mock_object.js');
	stop();
	script.addEvent(function() {
		ok(false, "This should not run");
	});
	setTimeout(function () {
		ok(true, "Only this assertion will run");
		start();
	}, 200);
});


module("ScriptDeferrer");

test("Load scripts in order", 2, function() {
	var deferrer = jLL.staticDeferrer();
	var endEvent = function() {
		testObject123();
		start();
	}
	deferrer.push('mock_load/mock_object.js');
	deferrer.push('mock_load/mock_add_1.js');
	deferrer.push('mock_load/mock_add_2.js');
	deferrer.push('mock_load/mock_add_3.js', endEvent);
	stop();
	deferrer.run();
});

test("Load 3 scripts, fail second script test for [1,3]", 3, function() {
	var deferrer = jLL.staticDeferrer();
	var endEvent = function() {
		testObject13();
		start();
	}
	deferrer.push('mock_load/mock_object.js');
	deferrer.push('mock_load/mock_add_1.js');
	deferrer.push('mock_load/mock_add_2.js', undefined, mockCheckEventFalse);
	deferrer.push('mock_load/mock_add_3.js', endEvent);
	stop();
	deferrer.run();
});



test("Load 3 scripts in order on DOMready", 2, function() {
	var deferrer = jLL.staticDeferrer();
	var endEvent = function() {
		testObject123();
		start();
	}
	
	var attachOnReady = function(trigger) {
		if ( document.readyState === "complete" ) {
			trigger();
			return ;
		}

		if (window.attachEvent) {
			window.attachEvent('onload', trigger);
		}
		else {
			window.addEventListener('load', trigger, false);
		}
	}
	stop();
	attachOnReady(function(){
		setTimeout(endEvent, 200);
	});
	
	deferrer.push('mock_load/mock_object.js');
	deferrer.push('mock_load/mock_add_1.js');
	deferrer.push('mock_load/mock_add_2.js');
	deferrer.push('mock_load/mock_add_3.js');
	deferrer.runOnLoad();
});

