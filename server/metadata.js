
const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) {
            c = 0xedb88320 ^ (c >>> 1);
        } else {
            c = c >>> 1;
        }
    }
    CRC_TABLE[n] = c;
}

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Embeds metadata into a PNG buffer using a tEXt chunk.
 * @param {Buffer} buffer - The original PNG buffer.
 * @param {Record<string, any>} metadata - The metadata to embed.
 * @returns {Buffer} - The new PNG buffer with embedded metadata.
 */
export function embedMetadata(buffer, metadata) {
    if (!metadata) return buffer;

    // Check for PNG signature
    if (
        buffer[0] !== 0x89 ||
        buffer[1] !== 0x50 ||
        buffer[2] !== 0x4e ||
        buffer[3] !== 0x47 ||
        buffer[4] !== 0x0d ||
        buffer[5] !== 0x0a ||
        buffer[6] !== 0x1a ||
        buffer[7] !== 0x0a
    ) {
        // Not a PNG, return original
        return buffer;
    }

    try {
        const keyword = "parameters";
        const text = JSON.stringify(metadata);

        // tEXt chunk format:
        // Length (4 bytes)
        // Chunk Type (4 bytes) - "tEXt"
        // Data (Keyword + null separator + Text)
        // CRC (4 bytes)

        const keywordBuf = Buffer.from(keyword, "latin1");
        const textBuf = Buffer.from(text, "latin1"); // PNG tEXt must be Latin-1 (ISO-8859-1)

        // Data = keyword + null + text
        const dataLen = keywordBuf.length + 1 + textBuf.length;
        const chunkLen = 4 + 4 + dataLen + 4; // Length + Type + Data + CRC

        const chunk = Buffer.alloc(chunkLen);
        let offset = 0;

        // Length
        chunk.writeUInt32BE(dataLen, offset);
        offset += 4;

        // Type
        chunk.write("tEXt", offset);
        offset += 4;

        // Data
        keywordBuf.copy(chunk, offset);
        offset += keywordBuf.length;
        chunk[offset] = 0; // Null separator
        offset += 1;
        textBuf.copy(chunk, offset);
        offset += textBuf.length;

        // CRC (calculated over Type + Data)
        const crcStart = 4; // Skip Length
        const crcEnd = offset;
        const crc = crc32(chunk.subarray(crcStart, crcEnd));
        chunk.writeUInt32BE(crc, offset);

        // Insert after IHDR (first chunk)
        // IHDR is always the first chunk.
        // Signature (8) + Length (4) + "IHDR" (4) + Data (13) + CRC (4) = 33 bytes
        // But we should parse it properly to be safe, or just insert after 33 bytes if we assume standard IHDR.
        // Let's parse just the first chunk length to be safe.

        let pos = 8; // Skip signature
        const ihdrLen = buffer.readUInt32BE(pos);
        const ihdrEnd = pos + 4 + 4 + ihdrLen + 4; // Length + Type + Data + CRC

        const newBuffer = Buffer.concat([
            buffer.subarray(0, ihdrEnd),
            chunk,
            buffer.subarray(ihdrEnd)
        ]);

        return newBuffer;
    } catch (error) {
        console.error("Failed to embed metadata:", error);
        return buffer;
    }
}

/**
 * Extracts metadata from a PNG buffer.
 * @param {Buffer} buffer - The PNG buffer.
 * @returns {Record<string, any> | null} - The extracted metadata or null if not found.
 */
export function extractMetadata(buffer) {
    // Check for PNG signature
    if (
        buffer[0] !== 0x89 ||
        buffer[1] !== 0x50 ||
        buffer[2] !== 0x4e ||
        buffer[3] !== 0x47 ||
        buffer[4] !== 0x0d ||
        buffer[5] !== 0x0a ||
        buffer[6] !== 0x1a ||
        buffer[7] !== 0x0a
    ) {
        return null;
    }

    let offset = 8; // Skip signature

    while (offset < buffer.length) {
        // Read chunk length
        if (offset + 4 > buffer.length) break;
        const length = buffer.readUInt32BE(offset);
        offset += 4;

        // Read chunk type
        if (offset + 4 > buffer.length) break;
        const type = buffer.toString("ascii", offset, offset + 4);
        offset += 4;

        // Check for tEXt chunk
        if (type === "tEXt") {
            const dataStart = offset;
            const dataEnd = offset + length;
            if (dataEnd > buffer.length) break;

            const data = buffer.subarray(dataStart, dataEnd);
            // Find null separator
            const nullIndex = data.indexOf(0);
            if (nullIndex !== -1) {
                const keyword = data.toString("latin1", 0, nullIndex);
                if (keyword === "parameters") {
                    const text = data.toString("latin1", nullIndex + 1);
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error("Failed to parse metadata JSON:", e);
                        return null;
                    }
                }
            }
        }

        // Skip data and CRC
        offset += length + 4;
    }

    return null;
}
