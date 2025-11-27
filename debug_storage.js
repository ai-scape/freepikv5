import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "http://localhost:8787";
const TOKEN = "devtoken123";
const WORKSPACE = "default";
const FILENAME = "debug_storage_test.txt";

// Potential locations
const LOCATIONS = [
    path.join(process.cwd(), "data", WORKSPACE, FILENAME),
    path.join("/Users/ayushjalan/Documents/test", WORKSPACE, FILENAME)
];

async function run() {
    console.log("--- Debugging Storage Location ---");

    // 1. Create a dummy file blob
    const boundary = "--------------------------" + Date.now().toString(16);
    const content = "debug content";

    // Construct multipart body manually since we don't have FormData in pure node without newer node versions or polyfills, 
    // but actually Node 18+ has FormData. Let's try native FormData.

    const form = new FormData();
    const blob = new Blob([content], { type: "text/plain" });
    form.append("file", blob, FILENAME);

    console.log("1. Uploading file via API...");
    const uploadRes = await fetch(`${API_BASE}/files?workspace=${WORKSPACE}&path=${FILENAME}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${TOKEN}`
        },
        body: form
    });

    if (!uploadRes.ok) {
        console.error("   Upload failed:", await uploadRes.text());
        return;
    }
    console.log("   Upload success.");

    // 2. Check where it landed
    console.log("2. Checking file system locations...");
    let foundPath = null;
    for (const loc of LOCATIONS) {
        try {
            await fs.access(loc);
            console.log(`   FOUND at: ${loc}`);
            foundPath = loc;
        } catch {
            console.log(`   Not found at: ${loc}`);
        }
    }

    if (!foundPath) {
        console.error("   File not found in any expected location! Server might be using a totally different path.");
        return;
    }

    // 3. Delete via API
    console.log("3. Deleting file via API...");
    const deleteRes = await fetch(`${API_BASE}/files`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
            workspace: WORKSPACE,
            path: FILENAME
        })
    });

    if (!deleteRes.ok) {
        console.error("   Delete failed:", await deleteRes.text());
        return;
    }
    console.log("   Delete request success.");

    // 4. Verify deletion
    console.log("4. Verifying deletion on disk...");
    try {
        await fs.access(foundPath);
        console.error(`   FAILURE: File still exists at ${foundPath}`);
    } catch {
        console.log(`   SUCCESS: File is gone from ${foundPath}`);
    }
}

run().catch(console.error);
