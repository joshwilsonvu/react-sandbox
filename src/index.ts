

const uniqueId = (() => {
  let c = 0;
  return () => `browser-sandbox-${c++}`;
})();

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

class Sandbox {
  // Public properties; users should set these accordingly before calling start.
  exports = {};
  dependencies: string[] = [];
  permissions: string[] = [];
  private _id = '';

  start(script: string) {
    // create a unique id
    this._id || (this._id = uniqueId());
    // create a new iframe
    let iframe = initIframe(this._id);
    iframe.sandbox.add(...this.permissions);
    // add the iframe's contents, a skeleton HTML doc with the script inserted as the onload callback
    try {
      iframe.srcdoc = this.build(script);
    } catch (e) {
      console.error(e);
    }
    // *** nullify the iframe window parent so that the script cannot access the global object with `window.parent`
    delete (iframe.contentWindow as any).parent;

    let oldIframe = document.getElementById(this._id);
    if (oldIframe) {
      // if old iframe exists, unmount it and replace it with the new iframe
      document.body.replaceChild(iframe, oldIframe);
    } else {
      // otherwise, insert the iframe as the last child of the body element
      document.body.appendChild(iframe);
    }

    return this;
  }

  stop() {
    this._id && document.body.removeChild(document.getElementById(this._id)!);
    return;
  }

  build(script: string) {
    script = script.replace(/\/>|<\//g, ''); // sanitize script
    const deps = this.dependencies.map(d => `<script src=${d}></script>`).join('');
    const main = `<script>${script}</script>`;
    return `<html><body>${deps}${main}</body></html>`
  }
}

/*
function test() {
  let script = `console.log(document);`;
  let permissions = [];
  let container = document.getElementById('sandboxContainer');
  sandbox(container, script, permissions);
}
test();
*/
export default Sandbox;