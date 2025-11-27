import { SYSTEM_PROMPTS } from "./prompts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_ID = "meta-llama/llama-4-maverick-17b-128e-instruct";

type MessageContent =
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: {
            url: string;
        };
    }>;

export async function expandPrompt(
    prompt: string,
    type: "natural" | "yaml",
    mode: "image" | "video",
    referenceImages: string[] = []
): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_KEY;

    if (!apiKey) {
        throw new Error("VITE_GROQ_KEY is not set in the environment.");
    }

    const systemPrompt = SYSTEM_PROMPTS[mode][type];

    const userContent: MessageContent = [];

    // Add text prompt with explicit image indexing context if images are present
    let finalPrompt = prompt;
    if (referenceImages.length > 0) {
        const imageContext = referenceImages.map((_, i) => `Image ${i + 1} corresponds to @img${i + 1}`).join(", ");
        finalPrompt = `[System Note: ${referenceImages.length} images attached. ${imageContext}.] ${prompt}`;
    }

    userContent.push({
        type: "text",
        text: finalPrompt,
    });

    // Add reference images
    referenceImages.forEach((url) => {
        userContent.push({
            type: "image_url",
            image_url: {
                url,
            },
        });
    });

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    {
                        role: "user",
                        content: userContent,
                    },
                ],
                temperature: 0.7,
                max_completion_tokens: 1024, // Groq uses max_completion_tokens
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Groq API error: ${response.status} ${response.statusText} - ${JSON.stringify(
                    errorData
                )}`
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from Groq.");
        }

        return content.trim();
    } catch (error) {
        console.error("Error expanding prompt:", error);
        throw error;
    }
}
