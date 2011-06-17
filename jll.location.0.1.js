/*
 must treat cases:
	arg = /absolute/path/to/server/root
	arg = http://host/path/to/uri
*/

// define Location module
var Location = function() {
	// store current page's href without trailing slash, query string or anchor
	var href = location.href.replace(/([#?].*)?$/, '');
	console.log('got href');
	
	var dir = href.replace(/\/[^\/]*$/, '');

	return {
		// return current page's href
		href: function() {
			return href;
		},

		// return 
		absolute: function(arg) {
			// get current URL path
			var cDir = dir;

			var suffix = arg.match(/\/$/);
			suffix = (null != suffix)?suffix:'';

			// strip leading slash and any ./ references
			var parts = arg.split('/');
			var partsFinal = [];

			for (var i=0; i<parts.length; i++) {
			    // strip empty parts (leading slash, double slashes) and ./ references
			    if (/^\.?$/.test(parts[i])) {
			        continue;
			    }

			    // treat relative paths
			    if (/^\.\.$/.test(parts[i])) {
			        var tLen = partsFinal.length;
			        if (tLen > 0 && ! /^\.\.$/.test(partsFinal[tLen-1])) {
			            partsFinal.pop();
			            continue;
			        }
			    }

			    partsFinal.push(parts[i]);
			}
			arg = partsFinal.join('/');

			// get number of relative directories to go down to
			var match = arg.match(/\.\.\//g);
            var relative = (null != match)?match.length:0;

			// if arg is not relative, return concatenated URL
			if (0 == relative) {
				return cDir + "/" + arg;
			}

            // remove scheme:// prefix from uri
            var locPrefix = cDir.lastIndexOf('//');
            var prefix = '';

            if (-1 < locPrefix) {
                locPrefix += 2;
                var prefix = cDir.substring(0, locPrefix);
                cDir = cDir.substring(locPrefix);
            }
            var baseParts = cDir.split('/');

            if (relative < baseParts.length - 1) {
                for (var i=0; i<relative; i++) {
                    baseParts.pop();
                }

                cDir = baseParts.join('/');
            } else {
                cDir = [];
                cDir.push(baseParts[0]);
            }
            arg = arg.replace(/\.\.\//g, '');

			// return url of form protocol://hostname/path/to/file.ext
			return prefix + cDir + "/" + arg + suffix;
		}
	}		
}