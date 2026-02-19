export async function analyzeAudio(file: File): Promise<{ bpm: number; key: string } | null> {
    if (typeof window === 'undefined') return null;

    try {
        // Dynamic import to avoid SSR issues
        // EssentiaWASM is the factory function exported by the UMD module
        const { Essentia, EssentiaWASM } = await import('essentia.js');

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Load audio file
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Initialize Essentia WASM
        // EssentiaWASM is the factory function exported by the UMD module
        const essentiaWasmModule = await EssentiaWASM({
            locateFile: (path: string, prefix: string) => {
                if (path.endsWith('.wasm')) {
                    return '/essentia-wasm.web.wasm';
                }
                return prefix + path;
            }
        });

        // Initialize Essentia JS Core
        // @ts-ignore
        const essentia = new Essentia(essentiaWasmModule);

        // Convert audio to vector for Essentia (use mono)
        const channelData = audioBuffer.getChannelData(0); 
        const vectorSignal = essentia.arrayToVector(channelData);

        // BPM Detection
        // Using RhythmExtractor2013 for better accuracy
        let bpm = 0;
        try {
            const rhythmResult = essentia.RhythmExtractor2013(vectorSignal);
            bpm = rhythmResult.bpm;
        } catch (e) {
            console.warn("RhythmExtractor failed, falling back to PercivalBpmEstimator", e);
            try {
                const percivalResult = essentia.PercivalBpmEstimator(vectorSignal);
                bpm = percivalResult.bpm;
            } catch (e2) {
                console.warn("BPM detection failed completely", e2);
            }
        }

        // Key Detection
        // KeyExtractor returns { key, scale, strength }
        let key = "";
        try {
            const keyResult = essentia.KeyExtractor(vectorSignal);
            key = `${keyResult.key} ${keyResult.scale}`;
        } catch (e) {
            console.warn("Key detection failed", e);
        }

        // Cleanup (if methods exist)
        // vectorSignal.delete();
        // essentia.shutdown();

        if (bpm === 0 && key === "") return null;

        return {
            bpm: Math.round(bpm),
            key: key.trim()
        };

    } catch (error) {
        console.error("Audio analysis failed:", error);
        return null; 
    }
}
