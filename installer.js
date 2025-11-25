#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { spawn, execSync } = require('node:child_process');
const os = require('node:os');

const REPO_URL = "https://github.com/ai-scape/freepikv5.git";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("🚀 Starting Freepik Clone Team Installer...");

    // 1. Get Install Directory
    const defaultDir = path.join(process.cwd(), "freepik-clone");
    const dirInput = await question(`\n📂 Where would you like to install the project?\n   (Press Enter for default: ${defaultDir}): `);
    const installDir = dirInput.trim() || defaultDir;

    console.log(`\nTarget directory: ${installDir}`);

    // 2. Clone Repo
    if (fs.existsSync(installDir)) {
        console.log(`\n⚠️  Directory already exists. Skipping clone.`);
    } else {
        console.log(`\n⬇️  Cloning repository...`);
        try {
            execSync(`git clone ${REPO_URL} "${installDir}"`, { stdio: 'inherit' });
        } catch (error) {
            console.error("❌ Failed to clone repository. Please check your git installation and internet connection.");
            process.exit(1);
        }
    }

    // 3. Ask for API Keys
    console.log(`\n🔑 Configuration Setup`);
    console.log("   Please enter your API keys. Press Enter to skip if you want to add them manually later.");

    const falKey = await question("   Enter VITE_FAL_KEY: ");
    const kieKey = await question("   Enter VITE_KIE_KEY: ");
    const fileApiToken = await question("   Enter FILE_API_TOKEN (Optional, for server auth): ");

    // 4. Create .env file
    const envContent = [
        `VITE_FAL_KEY=${falKey.trim()}`,
        `VITE_KIE_KEY=${kieKey.trim()}`,
        fileApiToken.trim() ? `FILE_API_TOKEN=${fileApiToken.trim()}` : ""
    ].filter(Boolean).join("\n");

    const envPath = path.join(installDir, ".env");
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Created .env file at ${envPath}`);

    // 5. Install Dependencies
    console.log(`\n📦 Installing dependencies (this may take a few minutes)...`);
    try {
        execSync(`npm install`, { cwd: installDir, stdio: 'inherit' });
        console.log(`✅ Dependencies installed.`);
    } catch (error) {
        console.error("❌ Failed to install dependencies. You may need to run 'npm install' manually.");
    }

    // 6. Create Launch Shortcut (Windows .bat)
    const desktopDir = path.join(os.homedir(), "Desktop");
    const batPath = path.join(desktopDir, "Launch Freepik Clone.bat");

    // The batch file commands:
    // 1. cd to project dir
    // 2. run npm run dev:all
    // 3. pause on error
    const batContent = `@echo off
echo Starting Freepik Clone...
cd /d "${installDir}"
call npm run dev:all
pause
`;

    try {
        fs.writeFileSync(batPath, batContent);
        console.log(`\n🚀 Created launch shortcut on Desktop: ${batPath}`);
    } catch (error) {
        console.error(`\n⚠️  Could not create desktop shortcut: ${error.message}`);
        console.log(`   You can manually run 'npm run dev:all' in ${installDir} to start the app.`);
    }

    console.log(`\n✨ Installation Complete! ✨`);
    console.log(`   You can now double-click "Launch Freepik Clone" on your Desktop to start.`);

    rl.close();
}

main().catch(err => {
    console.error("An unexpected error occurred:", err);
    rl.close();
});
