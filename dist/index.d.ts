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
     * Calling #start() will remove the previously running sandbox if it exists.
     *
     * Exports will overwrite global properties of the sandboxed context.
     *
     *
     * @param script the top-level JavaScript code to execute
     * @param iframe an optional existing HTMLIFrameElement (i.e. document.getElementById()) to run the sandbox in
     * @return a Promise that resolves with data or rejects with an Error
     */
    start(script: string, iframe?: HTMLIFrameElement): Promise<any>;
    stop(): void;
    build(script: string): string;
}
declare type Assignable = {
    [prop: string]: any;
};
export {};
//# sourceMappingURL=index.d.ts.map