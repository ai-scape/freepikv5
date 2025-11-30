
import fs from 'node:fs';
import path from 'node:path';

// Minimal PNG: 1x1 pixel
const PNG_HEADER = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // Signature
    0x00, 0x00, 0x00, 0x0d, // IHDR Length
    0x49, 0x48, 0x44, 0x52, // IHDR Type
    0x00, 0x00, 0x00, 0x01, // Width
    0x00, 0x00, 0x00, 0x01, // Height
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, Color type, Compression, Filter, Interlace
    0x1f, 0x15, 0xc4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0a, // IDAT Length
    0x49, 0x44, 0x41, 0x54, // IDAT Type
    0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Data
    0x0d, 0x0a, 0x2d, 0xb4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND Length
    0x49, 0x45, 0x4e, 0x44, // IEND Type
    0xae, 0x42, 0x60, 0x82  // CRC
]);

async function run() {
    const testFile = path.join(process.cwd(), 'test_metadata.png');
    fs.writeFileSync(testFile, PNG_HEADER);

    const metadata = { prompt: "test prompt", seed: 12345 };
    const formData = new FormData();
    formData.append('file', new Blob([PNG_HEADER]), 'test_metadata.png');

    console.log("Uploading file with metadata...");
    const response = await fetch('http://localhost:8787/files?workspace=default&path=test_metadata.png&metadata=' + encodeURIComponent(JSON.stringify(metadata)), {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer devtoken123'
        },
        body: formData
    });

    if (!response.ok) {
        console.error("Upload failed:", await response.text());
        return;
    }

    console.log("Upload successful. Downloading to verify...");

    // Wait a bit for file system
    await new Promise(r => setTimeout(r, 1000));

    const downloadResponse = await fetch('http://localhost:8787/files/default/test_metadata.png', {
        headers: {
            'Authorization': 'Bearer devtoken123'
        }
    });
    const buffer = await downloadResponse.arrayBuffer();
    const downloadedBuf = Buffer.from(buffer);

    // Check for tEXt chunk
    const textChunk = downloadedBuf.includes(Buffer.from("tEXtparameters"));
    if (textChunk) {
        console.log("SUCCESS: Found 'parameters' tEXt chunk!");

        // Extract it to be sure
        const idx = downloadedBuf.indexOf(Buffer.from("tEXtparameters"));
        // keyword "parameters" is 10 bytes. null is 1 byte.
        const start = idx + 4 + 10 + 1;
        // Find next chunk length or just read some bytes
        const extracted = downloadedBuf.subarray(start, start + 100).toString('latin1');
        console.log("Extracted start:", extracted);
        if (extracted.includes('"prompt":"test prompt"')) {
            console.log("SUCCESS: Metadata content verified.");
        } else {
            console.error("FAILURE: Metadata content mismatch.");
        }

    } else {
        console.error("FAILURE: No 'parameters' tEXt chunk found.");
    }

    // Cleanup
    fs.unlinkSync(testFile);
}

run().catch(console.error);
