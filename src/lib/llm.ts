import { fal } from "@fal-ai/client";
import { SYSTEM_PROMPTS } from "./prompts";


const MODEL_ID = "google/gemini-2.5-flash";

function getFalKey() {
    return (import.meta.env.VITE_FAL_KEY ?? "").trim();
}

export async function expandPrompt(
    prompt: string,
    type: "natural" | "yaml",
    mode: "image" | "video",
    referenceImages: string[] = []
): Promise<string> {
    const key = getFalKey();
    if (!key) {
        throw new Error("VITE_FAL_KEY is not set in the environment.");
    }

    // Configure Fal client
    fal.config({ credentials: key });

    const systemPrompt = SYSTEM_PROMPTS[mode][type];
    const hasImages = referenceImages.length > 0;

    // Choose endpoint based on whether we have images
    const endpoint = hasImages ? "openrouter/router/vision" : "openrouter/router";

    // Construct payload
    // Note: The schema differs slightly between the two endpoints in the docs provided,
    // but the `input` object structure is largely compatible.
    // VLM: { model, prompt, image_urls, system_prompt, temperature }
    // LLM: { model, prompt, system_prompt, temperature }

    const input: Record<string, unknown> = {
        model: MODEL_ID,
        prompt: prompt,
        system_prompt: systemPrompt,
        temperature: 1,
    };

    if (hasImages) {
        input.image_urls = referenceImages;
    }

    console.log(`Fal Request Payload (${endpoint}):`, JSON.stringify(input, null, 2));

    try {
        const result = await fal.subscribe(endpoint, {
            input,
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log) => log.message).forEach((msg) => console.log(`[Fal ${hasImages ? "VLM" : "LLM"}]`, msg));
                }
            },
        });

        console.log(`Fal Response (${endpoint}):`, result);

        const content = result.data?.output;

        if (typeof content !== "string") {
            throw new Error(`Invalid or missing content received from Fal ${hasImages ? "VLM" : "LLM"}.`);
        }

        let cleanContent = content.trim();

        // Remove markdown code blocks if present
        cleanContent = cleanContent.replace(/^```(?:yaml|json)?\s*/i, "").replace(/\s*```$/, "");

        return cleanContent.trim();
    } catch (error) {
        console.error(`Error expanding prompt with Fal ${hasImages ? "VLM" : "LLM"}:`, error);
        throw error;
    }
}
