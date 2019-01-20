"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var Sandbox = (function () {
    function Sandbox() {
        this.exports = {};
        this.dependencies = [];
        this.permissions = [];
        this._id = '';
    }
    Sandbox.prototype.start = function (script) {
        var _a;
        this._id || (this._id = uniqueId());
        var iframe = initIframe(this._id);
        (_a = iframe.sandbox).add.apply(_a, this.permissions);
        try {
            iframe.srcdoc = this.build(script);
        }
        catch (e) {
            console.error(e);
        }
        delete iframe.contentWindow.parent;
        var oldIframe = document.getElementById(this._id);
        if (oldIframe) {
            document.body.replaceChild(iframe, oldIframe);
        }
        else {
            document.body.appendChild(iframe);
        }
        return this;
    };
    Sandbox.prototype.stop = function () {
        this._id && document.body.removeChild(document.getElementById(this._id));
        return;
    };
    Sandbox.prototype.build = function (script) {
        script = script.replace(/\/>|<\//g, '');
        var deps = this.dependencies.map(function (d) { return "<script src=" + d + "></script>"; }).join('');
        var main = "<script>" + script + "</script>";
        return "<html><body>" + deps + main + "</body></html>";
    };
    return Sandbox;
}());
exports.default = Sandbox;
//# sourceMappingURL=index.js.map