"use strict";
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory();
    }
    else {
        var global_1 = self || window;
        global_1 && (global_1.BrowserSandbox = factory());
    }
})(function () {
    var BrowserSandbox = (function () {
        function BrowserSandbox() {
            this.exports = {};
            this.dependencies = [];
            this.permissions = [];
            this.wrapper = function (script) { return script; };
            this._id = '';
        }
        BrowserSandbox.prototype.start = function (script) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var _a;
                _this._id || (_this._id = uniqueId());
                var iframe = initIframe(_this._id);
                (_a = iframe.sandbox).add.apply(_a, _this.permissions);
                iframe.sandbox.remove('allow-same-origin');
                iframe.srcdoc = _this.build(script);
                var messageListener = function (e) {
                    if (e.origin === null && _this._id && e.source === iframe.contentWindow) {
                        window.removeEventListener("message", messageListener);
                        iframe.parentNode.removeChild(iframe);
                        if (e.data instanceof Error) {
                            reject(e.data);
                        }
                        else {
                            resolve(e.data);
                        }
                    }
                };
                window.addEventListener('message', messageListener);
                var loadListener = function (e) {
                    window.removeEventListener("load", loadListener);
                    for (var prop in _this.exports) {
                        if (typeof prop === "string" && _this.exports.hasOwnProperty(prop)) {
                            prop in iframe.contentWindow && console.log(prop + " to be overwritten in global scope");
                            iframe.contentWindow[prop] = _this.exports[prop];
                        }
                    }
                };
                window.addEventListener('load', loadListener);
                var oldIframe = document.getElementById(_this._id);
                if (oldIframe) {
                    oldIframe.parentNode.replaceChild(iframe, oldIframe);
                }
                else {
                    document.body.appendChild(iframe);
                }
            });
        };
        BrowserSandbox.prototype.stop = function () {
            if (this._id) {
                var iframe = document.getElementById(this._id);
                iframe && iframe.parentNode.removeChild(iframe);
            }
        };
        BrowserSandbox.prototype.build = function (script) {
            script = sanitize(script);
            var deps = this.dependencies.map(function (d) { return "<script src=\"" + d + "\"></script>"; }).join('');
            var main = "<script>window.parent.postMessage((function(){" + script + "})(),'*')</script>";
            return "<html><body>" + deps + main + "</body></html>";
        };
        return BrowserSandbox;
    }());
    var uniqueId = (function () {
        var c = 0;
        return function () { return "browser-sandbox-" + c++; };
    })();
    var initIframe = function (id) {
        var iframe = document.createElement('iframe');
        iframe.height = '0';
        iframe.width = '0';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.sandbox.add("allow-scripts");
        iframe.id = iframe.name = id;
        return iframe;
    };
    var sanitize = function (script) { return script.replace(/\/>|<\//g, ''); };
    return BrowserSandbox;
});
//# sourceMappingURL=index.js.map