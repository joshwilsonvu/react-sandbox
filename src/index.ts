(factory => {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(); // export to CommonJS
  } else {
    let global = self || window;
    global && ((global as any).BrowserSandbox = factory()); // add to global object
  }
})(() => {
  /**
   * A pleasant interface for securely running untrusted code in the browser and exposing an API.
   *
   * BrowserSandbox creates a sandboxed iframe element behind the scenes for untrusted code to
   * run in without being able to modify the current page. It also allows for functions to be
   * passed, called from the sandboxed context, and executed in the current context, allowing
   * a wide range of applications to safely use user code.
   */
  class BrowserSandbox {

    /**
     * An object containing all objects and functions to be exported to the sandboxed context.
     *
     * Functions included here will run in the current context.
     * *DO NOT* export functions with access to the DOM or DOM elements themselves, or the
     * untrusted code will be able to manipulate the current DOM.
     */
    exports = {};

    /**
     * An array containing dependencies to be loaded as <script src=""> tags for the sandboxed
     * context.
     *
     * Can be paths or URLs.
     */
    dependencies: string[] = [];

    /**
     * An array of HTML iframe sandbox permissions to give the sandboxed context.
     *
     * See the sandbox attribute under
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes for details.
     * 'allow-scripts' is automatically added and 'allow-same-origin' is automatically removed.
     */
    permissions: string[] = [];

    /** the id of the instance's iframe element on the page */
    private _id = '';

    /**
     * Runs the given script in a new sandboxed context with the given exports, dependencies,
     * and permissions.
     *
     * Calling #start() will remove the previously running sandbox if it exists.
     *
     * Exports will overwrite global properties of the sandboxed context.
     *
     *
     * @param script the top-level JavaScript code to execute
     * @return a Promise that resolves with data or rejects with an Error
     */
    start(script: string): Promise<any> {
      return new Promise((resolve, reject) => {
        // create a unique id
        this._id || (this._id = uniqueId());
        // create a new iframe
        let iframe = initIframe(this._id);
        iframe.sandbox.add(...this.permissions);
        iframe.sandbox.remove('allow-same-origin');
        // add the iframe's contents, a skeleton HTML doc with the script inserted as the onload callback
        iframe.srcdoc = this.build(script);

        // listen for messages from the iframe
        let messageListener = (e: WindowEventMap["message"]) => {
          // make sure the message is coming from our iframe
          if (e.origin === null && this._id && e.source === iframe.contentWindow) {
            // receive only one message
            window.removeEventListener("message", messageListener);
            // remove iframe once finished
            iframe.parentNode!.removeChild(iframe);
            if (e.data instanceof Error) {
              reject(e.data)
            } else {
              resolve(e.data);
            }
          }
        };
        window.addEventListener('message', messageListener);

        let loadListener = (e: WindowEventMap["load"]) => {
          window.removeEventListener("load", loadListener);
          // add exports to sandbox global context
          for (let prop in this.exports) {
            if (typeof prop === "string" && this.exports.hasOwnProperty(prop)) {
              // TODO remove warning
              prop in iframe.contentWindow! && console.log(`${prop} to be overwritten in global scope`);
              (iframe.contentWindow as { [prop: string]: any })[prop] = (this.exports as { [prop: string]: any })[prop];
            }
          }
        };
        window.addEventListener('load', loadListener);

        let oldIframe = document.getElementById(this._id);
        if (oldIframe) {
          // if old iframe exists, unmount it and replace it with the new iframe
          oldIframe.parentNode!.replaceChild(iframe, oldIframe);
        } else {
          // otherwise, insert the iframe as the last child of the body element
          document.body.appendChild(iframe);
        }
      });
    }

    stop() {
      if (this._id) {
        let iframe = document.getElementById(this._id);
        iframe && iframe.parentNode!.removeChild(iframe);
      }
    }

    build(script: string) {
      script = sanitize(script);
      const deps = this.dependencies.map(d => `<script src="${d}"></script>`).join('');
      const main = `<script>window.parent.postMessage((function(){${script}})(),'*')</script>`;
      return `<html><body>${deps}${main}</body></html>`
    }
  }

  // An auto-incrementing DOM id generator that should prevent id conflicts
  const uniqueId = (() => {
    let c = 0;
    return () => `browser-sandbox-${c++}`;
  })();

  // Initializes an iframe DOM element
  const initIframe = (id: string) => {
    let iframe = document.createElement('iframe') as HTMLIFrameElement;
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

  // Removes HTML closing tags from JavaScript input
  const sanitize = (script: string) => script.replace(/\/>|<\//g, '');

  return BrowserSandbox;
});
