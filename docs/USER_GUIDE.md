# AI Asset Studio - User Guide

Welcome to your AI Asset Studio! This tool helps you generate AI-powered images and videos right from your browser.

## 🚀 Quick Start (5 Minutes)

### Step 1: Set Up Your API Keys

Before you can generate anything, you need API keys from the AI providers:

1. Create a file called `.env.local` in the project folder
2. Add these lines (with your actual keys):
   ```
   VITE_FAL_KEY=your_fal_api_key_here
   VITE_KIE_KEY=your_kie_api_key_here
   ```

**Where to get keys:**
- FAL.ai: Sign up at [fal.ai](https://fal.ai) and get your API key from the dashboard
- KIE.ai: Sign up at [kie.ai](https://kie.ai) and generate an API key

### Step 2: Choose a Project Folder

1. Click the **"Pick Folder"** button at the top of the screen
2. Select a folder on your computer where you want to save your generated files
3. Click **"Allow"** when your browser asks for permission

💡 **Tip:** Create a new folder called "AI Generated Assets" to keep everything organized!

### Step 3: Generate Your First Asset!

1. **Select a Model** - Choose from the dropdown (start with "kling-2.5-pro" for videos or "flux-kontext-pro" for images)
2. **Upload a Start Frame** (for videos) - Drag and drop an image or click "Browse"
3. **Write a Prompt** - Describe what you want to create (e.g., "a cat playing piano in a jazz club")
4. **Click Generate** - Wait for the magic to happen! ✨

Your file will appear in the middle column when it's done.

## 📖 Detailed Guide

### Understanding the Interface

The app has three main sections:

#### Left Panel: Controls
- **Model Selector:** Choose which AI model to use
- **Upload Zones:** Drag and drop your reference images/videos
- **Prompt Box:** Describe what you want to create
- **Advanced Settings:** Fine-tune generation parameters
- **Generate Button:** Start the creation process

#### Middle Panel: File Browser
- Shows all your generated files
- Search and filter by file type
- **Drag & Drop:** Drag files from your computer to upload, or drag files out to other apps
- Click to preview

#### Right Panel: Preview
- View your selected file
- See metadata (size, dimensions, etc.)
- Download button for easy sharing

### Generating Videos

Videos need at least one reference image to start from:

1. **Choose a video model** (e.g., "kling-2.5-pro" or "veo-3.1-quality-firstlast")
2. **Upload a start frame** - This is the first image of your video
3. **Optional: Upload an end frame** - For some models, this creates smooth transitions
4. **Optional: Add reference images** - Some models let you provide style references
5. **Write your prompt** - Describe the motion and action you want
6. **Adjust settings** - FPS, resolution, duration, etc.
7. **Click Generate** ⚡

**Example prompts:**
- "The camera slowly zooms in on the subject"
- "A bird taking flight from a tree branch"
- "Waves crashing on a beach at sunset"

### Generating Images

Images are simpler - just describe what you want!

1. **Choose an image model** (e.g., "flux-kontext-pro" or "imagen-4")
2. **Write your prompt** - Be specific! More details = better results
3. **Select size preset** - Square, portrait, or landscape
4. **Optional: Upload reference images** - For style transfer or editing
5. **Click Generate** 🎨

**Example prompts:**
- "A photorealistic portrait of a warrior in golden armor, cinematic lighting"
- "A minimalist logo for a tech startup, modern and clean"
- "An oil painting of a Victorian mansion in autumn"

### Upscaling Videos

Make your videos higher quality:

1. **Select an upscale model** (e.g., "flashvsr-video-upscaler")
2. **Upload your video** - Drag and drop the file you want to enhance
3. **Choose settings:**
   - Upscale factor (2x or 4x)
   - Target resolution (1080p, 2K, or 4K)
   - Output format (MP4, WebM, etc.)
105: 4. **Click Generate** ⬆️
106: 
107: **Note about ByteDance Upscaler:**
108: This model requires input videos to be 1080p or smaller. If you upload a larger video (e.g., 4K), the app will automatically resize it for you before upscaling. You'll see a "Resizing..." status message during this process.

## 💡 Tips & Tricks

### Writing Better Prompts

**DO:**
- ✅ Be specific and detailed
- ✅ Include style keywords ("cinematic", "photorealistic", "oil painting")
- ✅ Describe lighting, camera angles, and mood
- ✅ Use commas to separate concepts

**DON'T:**
- ❌ Be too vague ("make it cool")
- ❌ Use negative descriptions (most models don't understand "no blue")
- ❌ Make prompts too long (keep under 200 words)

### Model Selection Guide

**For Videos:**
- **kling-2.5-pro** - Best quality, slower
- **veo-3.1-fast-text** - Quick generations from text only
- **ltx-2-fast** - Fast, good for testing ideas

**For Images:**
- **flux-kontext-pro** - Professional quality, detailed
- **imagen-4-fast** - Quick iterations
- **nano-banana** - Creative and artistic

### Organizing Your Files

All generated files are automatically saved in your project folder:
- **Images** → `images/YYYY-MM-DD/`
- **Videos** → `videos/YYYY-MM-DD/`

Files are named with: `modelName_promptSlug_seed_uniqueId.ext`

## ❓ Troubleshooting

### "Pick Project Folder" button doesn't work
- Make sure you're using Chrome, Edge, or another Chromium browser
- Safari and Firefox don't support the file system features needed

### "Missing VITE_FAL_KEY in the environment" error
- Check that your `.env.local` file exists in the project root
- Make sure the file starts with `VITE_` (case-sensitive!)
- Restart the dev server after adding keys

### Generation is taking forever
- Some models take 30-60 seconds or longer
- Check your browser's console (F12) for error messages
- If it fails, try a different model or simpler prompt

### Files aren't saving
- Make sure you granted folder permissions when prompted
- Click "Re-request Permission" in the top bar
- Try picking the folder again

### "Upload failed" error
- Check your internet connection
- Make sure image/video files aren't too large (try under 20MB)
- Verify your API key is valid and has credits

## 🎓 Learning Resources

- **Video Tutorials:** Check `agents.md` for advanced automation
- **Model Documentation:** See README.md for full model catalog
- **API Docs:** Visit [fal.ai/docs](https://fal.ai/docs) and [kie.ai/docs](https://kie.ai)

## 🆘 Need More Help?

- Check the browser console (Press F12) for detailed error messages
- Make sure your API keys have enough credits
- Try a simpler prompt or different model
- Restart the app (`npm run dev` in terminal)

---

**Remember:** AI generation is creative and sometimes unpredictable! Don't be afraid to experiment with different models, prompts, and settings. Have fun creating! 🎉
