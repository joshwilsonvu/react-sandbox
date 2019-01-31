/**
 * A pleasant interface for securely running untrusted code in the browser and exposing an API.
 *
 * BrowserSandbox creates a sandboxed iframe element behind the scenes for untrusted code to
 * run in without being able to modify the current page. It also allows for functions to be
 * passed, called from the sandboxed context, and executed in the current context, allowing
 * a wide range of applications to safely use user code.
 */
export default class BrowserSandbox {

  /**
   * An object containing all objects and functions to be exported to the sandboxed context.
   *
   * Functions included here will run in the current context.
   * *DO NOT* export DOM elements, or the untrusted code will be able to manipulate the
   * current DOM.
   */
  exports: Assignable = {};

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

  /** instance's iframe element on the page */
  private _iframe?: HTMLIFrameElement;

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
   * @param iframe an optional existing HTMLIFrameElement (i.e. document.getElementById()) to run the sandbox in
   * @return a Promise that resolves with data or rejects with an Error
   */
  start(script: string, iframe?: HTMLIFrameElement): Promise<any> {
    return new Promise((resolve, reject) => {
      // init/create a new iframe if not exists, reuse iframe if possible
      let oldIframe = this._iframe;
      this._iframe = iframe || this._iframe || initIframe(document.createElement("iframe"));
      this._iframe.sandbox.add("allow-scripts", ...this.permissions);
      this._iframe.sandbox.remove('allow-same-origin');
      // add the iframe's contents, a skeleton HTML doc with the script inserted as the onload callback
      this._iframe.srcdoc = this.build(script);

      // listen for messages from the iframe
      let messageListener = (e: WindowEventMap["message"]) => {
        // make sure the message is coming from our iframe
        if (e.origin === null && this._iframe && e.source === this._iframe.contentWindow) {
          // receive only one message
          window.removeEventListener("message", messageListener);
          if (e.data instanceof Error) {
            reject(e.data)
          } else {
            resolve(e.data);
          }
        }
      };

      // add exports to sandbox global context
      for (let prop in this.exports) {
        if (this.exports.hasOwnProperty(prop)) {
          // TODO remove warning
          if (prop in this._iframe.contentWindow!) {
            console.log(`${prop} to be overwritten in iframe global scope`);
          }
          (this._iframe.contentWindow as Assignable)[prop] = this.exports[prop];
        }
      }

      if (!oldIframe) {
        if (document.body.contains(this._iframe)) {

        } else {

        }
      } else {

      }

      if (oldIframe) {
        // if old iframe exists, unmount it and replace it with the new iframe
        oldIframe.parentNode!.replaceChild(this._iframe, oldIframe);
      } else {
        // otherwise, insert the iframe as the last child of the body element
        document.body.appendChild(this._iframe);
      }

      window.addEventListener('message', messageListener);
    });
  }

  stop() {
    if (this._iframe) {
      this._iframe.parentNode!.removeChild(this._iframe);
    }
  }

  build(script: string) {
    script = sanitize(script);
    const deps = this.dependencies.map(d => `<script src="${d}"></script>`).join('');
    const main = `<script>window.parent.postMessage((function(){${script}})(),'*')</script>`;
    return `<html><body>${deps}${main}</body></html>`
  }
}

type Assignable = { [prop: string]: any };

// Initializes an iframe DOM element
const initIframe = (iframe: HTMLIFrameElement) => {
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.border = 'none';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  return iframe;
};

// Removes HTML closing tags from JavaScript input
const sanitize = (script: string) => script.replace(/\/>|<\//g, '');


