var mockOnloadEvent = function() {
    ok(true, "Mocked onload event");
}

var mockCheckEventTrue = function() {
    ok(true, "Mocking check and returning true");
    return true;
}

var mockCheckEventFalse = function() {
    ok(true, "Mocking check and returning false");
    return false;
}

var mockCheckTrigger = function() {
    ok(true, "Check trigger was executed because a check failed");
}

var testObjectLoadOnce = function () {
    if ("undefined" !== typeof mockObject) {
        ok(true, "MockObject is already loaded. Skipping file");
        return false;
    } else {
		ok(false, "MockObject should be defined and available")
	    return true;
	}
}

var testJLL = function () {
	if ("undefined" !== typeof window.jLL) {
		ok(true, "jLL object is available");
	}
}

var testMockObject = function () {
	if ("undefined" !== typeof mockObject) {
		ok(true, "MockObject is available");
	}
}

var testObject123 = function() {
	if (3 == mockObject.mockQueue.length) {
		ok(true, "MockObject has 3 elements");
		deepEqual(mockObject.mockQueue, [1,2,3], "ScriptDeferrer loaded scripts in order");
	}
}

var testObject13 = function() {
	if (2 == mockObject.mockQueue.length) {
		ok(true, "MockObject has 2 elements");
		deepEqual(mockObject.mockQueue, [1,3], "ScriptDeferrer 2 scripts in order");
	}
}