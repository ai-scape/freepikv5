import { SYSTEM_PROMPTS } from "./prompts";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "mistralai/mistral-small-3.1-24b-instruct:free";

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
    const apiKey = import.meta.env.VITE_OPENROUTER_KEY;

    if (!apiKey) {
        throw new Error("VITE_OPENROUTER_KEY is not set in the environment.");
    }

    const systemPrompt = SYSTEM_PROMPTS[mode][type];

    const userContent: MessageContent = [];

    // Add text prompt
    userContent.push({
        type: "text",
        text: prompt,
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
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "AI Asset Studio",
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
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(
                    errorData
                )}`
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from OpenRouter.");
        }

        return content.trim();
    } catch (error) {
        console.error("Error expanding prompt:", error);
        throw error;
    }
}
