/**
 * A pleasant interface for securely running untrusted code in the browser and exposing an API.
 *
 * BrowserSandbox creates a sandboxed iframe element behind the scenes for untrusted code to
 * run in without being able to modify the current page. It also allows for functions to be
 * passed, called from the sandboxed context, and executed in the current context, allowing
 * a wide range of applications to safely use user code.
 */
var BrowserSandbox = /** @class */ (function () {
    function BrowserSandbox() {
        /**
         * An object containing all objects and functions to be exported to the sandboxed context.
         *
         * Exported names will overwrite global properties of the sandbox (console, alert)
         * if they already exist.
         *
         * Functions included here can still capture and manipulate objects in the current context.
         * DOM elements will be filtered so that the untrusted code will be not able to read or
         * modify the current DOM.
         */
        this.exports = {};
        /**
         * An array containing dependencies to be loaded as <script src=""> tags for the sandboxed
         * context.
         *
         * Can be paths or URLs.
         */
        this.dependencies = [];
        /**
         * An array of HTML iframe sandbox permissions to give the sandboxed context.
         *
         * See the sandbox attribute under
         * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes for details.
         * 'allow-scripts' is automatically added and 'allow-same-origin' is automatically removed.
         */
        this.permissions = [];
    }
    /**
     * Runs the given script in a new sandboxed context with the given exports, dependencies,
     * and permissions.
     *
     * Exports will overwrite global properties of the sandboxed context.
     *
     * Calling #start() will replace the previous sandbox if it exists, reusing the original iframe.
     * Because the iframe is reused, any global variables added will remain on a subsequent call to
     * #start(). If this is not desired, use #unmount() to remove the iframe before calling #start().
     *
     * @param script the function-level JavaScript code to execute; return will end execution
     * @param iframe an optional existing HTMLIFrameElement (i.e. document.getElementById()) to run the sandbox in
     * @throws if the browser does not support the iframe sandbox attribute
     * @return a Promise that resolves to data returned by the script or rejects with an error thrown by the script
     */
    BrowserSandbox.prototype.start = function (script, iframe) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            _this.stop();
            // init/create a new iframe if not exists, reuse iframe if possible
            _this._iframe = iframe || _this._iframe || initIframe(document.createElement('iframe'));
            if (!("sandbox" in _this._iframe)) {
                delete _this._iframe; // release reference
                throw new Error('the iframe sandbox attribute is unsupported');
            }
            (_a = _this._iframe.sandbox).add.apply(_a, ['allow-scripts'].concat(_this.permissions));
            _this._iframe.sandbox.remove('allow-same-origin');
            // add the iframe's contents, a skeleton HTML doc with the script inserted as the onload callback
            _this._iframe.srcdoc = _this.build(script);
            // listen for messages from the iframe
            var messageListener = function (e) {
                // make sure the message is coming from our iframe
                if (e.origin === null && _this._iframe && e.source === _this._iframe.contentWindow) {
                    // receive only one message, a Promise
                    window.removeEventListener('message', messageListener);
                    e.data.then(function (data) { return resolve(data); }, function (err) { return reject(err); });
                }
            };
            // add exports to sandbox global context
            for (var prop in _this.exports) {
                if (_this.exports.hasOwnProperty(prop)) {
                    if (_this.exports[prop] instanceof Node) {
                        console.warn(prop + " in exports appears to be an HTML element. Untrusted code could use this to modify your document.");
                    }
                    else {
                        _this._iframe.contentWindow[prop] = _this.exports[prop];
                    }
                }
            }
            // add the iframe to the document only if it is a newly created one
            if (!document.body.contains(_this._iframe)) {
                document.body.appendChild(_this._iframe);
            }
            // listen for a message, but stop listening when the iframe is unloaded
            window.addEventListener('message', messageListener);
            _this._iframe.contentWindow.addEventListener('unload', function () {
                window.removeEventListener('message', messageListener);
            });
        });
    };
    /**
     * Unloads the currently active sandbox. Its base iframe will remain and can be reused.
     */
    BrowserSandbox.prototype.stop = function () {
        this._iframe && (this._iframe.srcdoc = '');
    };
    /**
     * Unloads the currently active sandbox and removes its base iframe.
     */
    BrowserSandbox.prototype.unmount = function () {
        if (this._iframe) {
            this._iframe.parentNode.removeChild(this._iframe);
        }
    };
    /**
     *
     *
     * @param script the function-level JavaScript code to execute; return will end execution
     */
    BrowserSandbox.prototype.build = function (script) {
        script = sanitize(script);
        var deps = this.dependencies.map(function (d) { return "<script src=\"" + d + "\"></script>"; }).join('');
        var main = framework(script);
        return "<html><body>" + deps + main + "</body></html>";
    };
    return BrowserSandbox;
}());
export default BrowserSandbox;
// Script's return value (Promise or otherwise) will be converted into a Promise
var framework = function (script) { return "\n<script>\n(function(){\n  var p;\n  try {\n    p = Promise.resolve((function() {\n      " + script + "\n    })());\n  } catch (e) {\n    p = Promise.reject(e);\n  }\n  window.parent.postMessage(p, '*');\n})()\n</script>"; };
// Initializes an iframe DOM element
var initIframe = function (iframe) {
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.border = 'none';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    return iframe;
};
// Removes HTML closing tags from JavaScript input
var sanitize = function (script) { return script.replace(/\/>|<\//g, ''); };
//# sourceMappingURL=index.js.map