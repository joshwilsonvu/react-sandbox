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
    exports: Assignable;
    /**
     * An array containing dependencies to be loaded as <script src=""> tags for the sandboxed
     * context.
     *
     * Can be paths or URLs.
     */
    dependencies: string[];
    /**
     * An array of HTML iframe sandbox permissions to give the sandboxed context.
     *
     * See the sandbox attribute under
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes for details.
     * 'allow-scripts' is automatically added and 'allow-same-origin' is automatically removed.
     */
    permissions: string[];
    /** instance's iframe element on the page */
    private _iframe?;
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
    start(script: string, iframe?: HTMLIFrameElement): Promise<any>;
    /**
     * Unloads the currently active sandbox. Its base iframe will remain and can be reused.
     */
    stop(): void;
    /**
     * Unloads the currently active sandbox and removes its base iframe.
     */
    unmount(): void;
    /**
     *
     *
     * @param script the function-level JavaScript code to execute; return will end execution
     */
    build(script: string): string;
}
declare type Assignable = {
    [prop: string]: any;
};
export {};
//# sourceMappingURL=index.d.ts.map