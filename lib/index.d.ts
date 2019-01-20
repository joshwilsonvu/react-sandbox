declare class Sandbox {
    exports: {};
    dependencies: string[];
    permissions: string[];
    private _id;
    start(script: string): this;
    stop(): void;
    build(script: string): string;
}
export default Sandbox;
//# sourceMappingURL=index.d.ts.map