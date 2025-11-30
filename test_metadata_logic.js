
import { embedMetadata, extractMetadata } from "./server/metadata.js";
import { Buffer } from "node:buffer";

// Minimal valid PNG signature + IHDR
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(25);
// Length (4) + "IHDR" (4) + Data (13) + CRC (4)
ihdr.writeUInt32BE(13, 0);
ihdr.write("IHDR", 4);
// Width, Height, Bit depth, Color type, Compression, Filter, Interlace
ihdr.writeUInt32BE(1, 8); // Width 1
ihdr.writeUInt32BE(1, 12); // Height 1
ihdr[16] = 8; // Bit depth
ihdr[17] = 6; // Color type (RGBA)
ihdr[18] = 0; // Compression
ihdr[19] = 0; // Filter
ihdr[20] = 0; // Interlace
// CRC (dummy for test, or we can calculate it but embedMetadata doesn't check IHDR CRC)
ihdr.writeUInt32BE(0, 21);

const dummyPng = Buffer.concat([pngSignature, ihdr]);

const metadata = {
    prompt: "A beautiful sunset",
    modelId: "flux-schnell",
    params: {
        seed: 12345
    }
};

console.log("Original PNG size:", dummyPng.length);

const embedded = embedMetadata(dummyPng, metadata);
console.log("Embedded PNG size:", embedded.length);

if (embedded.length === dummyPng.length) {
    console.error("Metadata was NOT embedded (sizes match)");
} else {
    console.log("Metadata embedded successfully (size increased)");
}

const extracted = extractMetadata(embedded);
console.log("Extracted metadata:", extracted);

if (JSON.stringify(extracted) === JSON.stringify(metadata)) {
    console.log("SUCCESS: Metadata matches!");
} else {
    console.error("FAILURE: Metadata mismatch or null");
}
