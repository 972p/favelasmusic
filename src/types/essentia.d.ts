declare module 'essentia.js' {
    export const Essentia: any;
    export const EssentiaWASM: any;
}

declare module 'essentia.js/dist/essentia-wasm.web.js' {
    const EssentiaWASM: any;
    export default EssentiaWASM;
}
