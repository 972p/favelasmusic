// @ts-nocheck
// Audio analysis using Essentia.js for BPM and Key detection
// Uses the web build of essentia-wasm loaded from /public

const TARGET_SAMPLE_RATE = 44100;

let essentiaInstance: any = null;
let essentiaLoading: Promise<any> | null = null;

async function getEssentia() {
    if (essentiaInstance) return essentiaInstance;
    if (essentiaLoading) return essentiaLoading;

    essentiaLoading = (async () => {
        // Dynamically import the core JS API (UMD build)
        const { Essentia } = await import('essentia.js');

        // Load the web WASM module from public/ via a script tag
        // essentia-wasm.web.js defines a global `EssentiaWASM` factory function
        await new Promise<void>((resolve, reject) => {
            if ((window as any).EssentiaWASM) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = '/essentia-wasm.web.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load essentia-wasm.web.js'));
            document.head.appendChild(script);
        });

        // EssentiaWASM is now a global factory function (from essentia-wasm.web.js)
        const EssentiaWASMFactory = (window as any).EssentiaWASM;

        // Call the factory function - it returns a module with a .ready promise
        const wasmModule = await EssentiaWASMFactory();

        // Create the Essentia instance with the initialized WASM module
        essentiaInstance = new Essentia(wasmModule);
        return essentiaInstance;
    })();

    try {
        return await essentiaLoading;
    } catch (error) {
        essentiaLoading = null;
        throw error;
    }
}

/**
 * Resample audio data from sourceSampleRate to targetSampleRate using OfflineAudioContext.
 * This is critical because Essentia algorithms (RhythmExtractor2013, KeyExtractor) 
 * require exactly 44100 Hz input to produce correct results.
 */
async function resampleTo44100(audioBuffer: AudioBuffer): Promise<Float32Array> {
    const sourceSampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const duration = audioBuffer.duration;
    
    // First downmix to mono
    let monoData: Float32Array;
    if (numChannels === 1) {
        monoData = audioBuffer.getChannelData(0);
    } else {
        // Proper mono downmix: average left + right channels
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        monoData = new Float32Array(left.length);
        for (let i = 0; i < left.length; i++) {
            monoData[i] = (left[i] + right[i]) / 2;
        }
    }
    
    // If already at target sample rate, return the mono signal directly
    if (sourceSampleRate === TARGET_SAMPLE_RATE) {
        return monoData;
    }
    
    // Use OfflineAudioContext to resample to 44100 Hz
    const targetLength = Math.round(duration * TARGET_SAMPLE_RATE);
    const offlineCtx = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE);
    
    // Create a buffer at the source sample rate with our mono data
    const sourceBuffer = offlineCtx.createBuffer(1, monoData.length, sourceSampleRate);
    sourceBuffer.getChannelData(0).set(monoData);
    
    // Play it through the offline context (which will resample)
    const source = offlineCtx.createBufferSource();
    source.buffer = sourceBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer.getChannelData(0);
}

export async function analyzeAudio(file: File): Promise<{ bpm: number; key: string } | null> {
    if (typeof window === 'undefined') return null;

    try {
        const essentia = await getEssentia();

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Decode audio file
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log(`Audio decoded: ${audioBuffer.sampleRate} Hz, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.duration.toFixed(1)}s`);

        // Resample to 44100 Hz mono (CRITICAL for correct Essentia analysis)
        const monoSignal44100 = await resampleTo44100(audioBuffer);
        
        console.log(`Resampled to ${TARGET_SAMPLE_RATE} Hz mono, ${monoSignal44100.length} samples`);

        // Convert to Essentia vector
        const vectorSignal = essentia.arrayToVector(monoSignal44100);

        // BPM Detection using RhythmExtractor2013
        // Requires 44100 Hz input - see https://essentia.upf.edu/reference/std_RhythmExtractor2013.html
        let bpm = 0;
        try {
            const rhythmResult = essentia.RhythmExtractor2013(vectorSignal);
            bpm = rhythmResult.bpm;
            console.log(`RhythmExtractor2013: BPM=${bpm}, confidence=${rhythmResult.confidence}`);
        } catch (e) {
            console.warn("RhythmExtractor2013 failed, trying PercivalBpmEstimator", e);
            try {
                const percivalResult = essentia.PercivalBpmEstimator(vectorSignal);
                bpm = percivalResult.bpm;
                console.log(`PercivalBpmEstimator: BPM=${bpm}`);
            } catch (e2) {
                console.warn("BPM detection failed completely", e2);
            }
        }

        // Key Detection using KeyExtractor
        // Requires sampleRate parameter matching the input signal
        // Using 'edma' profile which is optimized for electronic dance music analysis
        let key = "";
        try {
            const keyResult = essentia.KeyExtractor(
                vectorSignal,
                true,           // averageDetuningCorrection
                4096,           // frameSize
                4096,           // hopSize
                12,             // hpcpSize
                3500,           // maxFrequency
                60,             // maximumSpectralPeaks
                25,             // minFrequency
                0.2,            // pcpThreshold
                'edma',         // profileType - 'edma' for electronic/modern music
                TARGET_SAMPLE_RATE, // sampleRate - MUST match our resampled signal
                0.0001,         // spectralPeaksThreshold
                440,            // tuningFrequency
                'cosine',       // weightType
                'hann'          // windowType
            );
            key = `${keyResult.key} ${keyResult.scale}`;
            console.log(`KeyExtractor: ${key}, strength=${keyResult.strength}`);
        } catch (e) {
            console.warn("KeyExtractor with edma failed, trying bgate profile", e);
            try {
                const keyResult = essentia.KeyExtractor(
                    vectorSignal,
                    true, 4096, 4096, 12, 3500, 60, 25, 0.2,
                    'bgate',        // fallback to bgate profile 
                    TARGET_SAMPLE_RATE,
                    0.0001, 440, 'cosine', 'hann'
                );
                key = `${keyResult.key} ${keyResult.scale}`;
                console.log(`KeyExtractor (bgate): ${key}, strength=${keyResult.strength}`);
            } catch (e2) {
                console.warn("Key detection failed completely", e2);
            }
        }

        // Close the audio context
        await audioContext.close();

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
