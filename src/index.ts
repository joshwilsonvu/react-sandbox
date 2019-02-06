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
   * Exported names will overwrite global properties of the sandbox (console, alert)
   * if they already exist.
   *
   * Functions included here can still capture and manipulate objects in the current context.
   * DOM elements will be filtered so that the untrusted code will be not able to read or
   * modify the current DOM.
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
   * Exports will overwrite global properties of the sandboxed context.
   *
   * Calling #start() will replace the previous sandbox if it exists, reusing the original iframe.
   * Because the iframe is reused, any global variables added will remain on a subsequent call to
   * #start(). If this is not desired, use #unmount() to remove the iframe before calling #start().
   *
   * @param script the top-level JavaScript code to execute
   * @param iframe an optional existing HTMLIFrameElement (i.e. document.getElementById()) to run the sandbox in
   * @throws if the browser does not support the iframe sandbox attribute
   * @return a Promise that resolves to data returned by the script or rejects with an error thrown by the script
   */
  start(script: string, iframe?: HTMLIFrameElement): Promise<any> {
    return new Promise((resolve, reject) => {
      this.stop();
      // init/create a new iframe if not exists, reuse iframe if possible
      this._iframe = iframe || this._iframe || initIframe(document.createElement('iframe'), this.permissions);
      if (typeof this._iframe.sandbox === 'undefined') {
        this._iframe = undefined; // release reference
        throw new Error('the iframe sandbox attribute is unsupported');
      }
      this._iframe.sandbox.add('allow-scripts', ...this.permissions);
      this._iframe.sandbox.remove('allow-same-origin');
      // add the iframe's contents, a skeleton HTML doc with the script inserted as the onload callback
      this._iframe.srcdoc = this.build(script);

      // listen for messages from the iframe
      let messageListener = (e: WindowEventMap['message']) => {
        // make sure the message is coming from our iframe
        if (e.origin === null && this._iframe && e.source === this._iframe.contentWindow) {
          // receive only one message, a Promise
          window.removeEventListener('message', messageListener);
          (e.data as Promise<any>).then(data => resolve(data), err => reject(err));
        }
      };

      // add exports to sandbox global context
      for (let prop in this.exports) {
        if (this.exports.hasOwnProperty(prop)) {
          if (this.exports[prop] instanceof Node) {
            console.warn(`${prop} in exports appears to be an HTML element. Untrusted code could use this to modify your document.`);
          } else {
            (this._iframe.contentWindow as Assignable)[prop] = this.exports[prop];
          }
        }
      }
      // add the iframe to the document only if it is a newly created one
      if (!document.body.contains(this._iframe)) {
        document.body.appendChild(this._iframe);
      }

      // listen for a message, but stop listening when the iframe is unloaded
      window.addEventListener('message', messageListener);
      this._iframe.contentWindow!.addEventListener('unload', () => {
        window.removeEventListener('message', messageListener);
      });
    });
  }

  /**
   * Unloads the currently active sandbox. Its base iframe will remain and can be reused.
   */
  stop() {
    this._iframe && (this._iframe.srcdoc = '');
  }

  /**
   * Unloads the currently active sandbox and removes its base iframe.
   */
  unmount() {
    if (this._iframe) {
      this._iframe.parentNode!.removeChild(this._iframe);
    }
  }

  /**
   *
   * @param script
   */
  build(script: string) {
    script = sanitize(script);
    const deps = this.dependencies.map(d => `<script src="${d}"></script>`).join('');
    const main = framework(script);
    return `<html><body>${deps}${main}</body></html>`
  }
}

// Script's return value (Promise or otherwise) will be converted into a Promise
const framework = (script: string) => `
<script>
(function(){
  var p;
  try {
    p = Promise.resolve((function() {
      ${script}
    })());
  } catch (e) {
    p = Promise.reject(e);
  }
  window.parent.postMessage(p, '*');
})()
</script>`;

type Assignable = { [prop: string]: any };

// Initializes an iframe DOM element
const initIframe = (iframe: HTMLIFrameElement, permissions: string[]) => {
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


