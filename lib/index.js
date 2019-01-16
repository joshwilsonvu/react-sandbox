"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var If = function (props) { return (props.cond ? props.children : null); };
var Dependency = function (props) { return React.createElement("script", { src: props.src }); };
var Script = function (props) { return (React.createElement("script", null, "window.onload=function(){",
    props.script.replace(/\/>|<\//, ''), "}")); };
var Sandbox = function (props) {
    var dependencies = props.dependencies, script = props.script;
    var depArray;
    if (typeof dependencies == 'string') {
        depArray = [dependencies];
    }
    else {
        depArray = dependencies;
    }
    return (React.createElement("iframe", { sandbox: "" },
        React.createElement("html", null,
            React.createElement("head", null),
            React.createElement("body", null,
                depArray.map(function (src) { return React.createElement(Dependency, { key: src, src: src }); }),
                React.createElement(Script, { script: script })))));
};
exports.default = Sandbox;
//# sourceMappingURL=index.js.map