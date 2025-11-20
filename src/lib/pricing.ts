type PricingUnit = "image" | "video";

/**
 * Central pricing registry. Update `amount` fields with the latest values
 * from the fal.ai pricing dashboard when they change.
 */

export type PricingInfo = {
  amount?: number;
  currency?: string;
  unit: PricingUnit;
  note?: string;
};

const DEFAULT_CURRENCY = "USD";
const FALLBACK_NOTE = "See fal.ai dashboard for current pricing.";

const MODEL_PRICING: Record<string, PricingInfo> = {
  // Image models
  "nano-banana-edit": { unit: "image", amount: 0.039, currency: "USD" },
  "imagen-4-fast": { unit: "image", amount: 0.02, currency: "USD" },
  "imagen-4": { unit: "image", amount: 0.04, currency: "USD" },
  "qwen-image-edit-plus": { unit: "image", amount: 0.03, currency: "USD" },
  "seedream-v4-edit": { unit: "image", amount: 0.03, currency: "USD" },
  // Video models
  "kling-2.5-pro": { unit: "video", amount: 0.35, currency: "USD" },
  "kling-2.1-pro": { unit: "video", amount: 0.45, currency: "USD" },
  "veo-3.1-fast-text": { unit: "video", amount: 0.75, currency: "USD" },
  "veo-3.1-fast-firstlast": { unit: "video", amount: 0.75, currency: "USD" },
  "veo-3.1-fast-reference": { unit: "video", amount: 0.75, currency: "USD" },
  "ltx-2-pro": { unit: "video", amount: 0.36, currency: "USD" },
  "hailuo-2.3-pro": { unit: "video", amount: 0.49, currency: "USD" },
  "seedance-pro": { unit: "video", amount: 0.62, currency: "USD" },
  "wan-2.2-turbo": { unit: "video", amount: 0.1, currency: "USD" },
  "wan-2.5-i2v": { unit: "video", amount: 0.5, currency: "USD" },
  "topaz-video-upscaler": { unit: "video", note: FALLBACK_NOTE },
  "bytedance-video-upscaler": { unit: "video", note: FALLBACK_NOTE },
  "flashvsr-video-upscaler": { unit: "video", note: FALLBACK_NOTE },
};

export function getModelPricing(modelId: string): PricingInfo | undefined {
  return MODEL_PRICING[modelId];
}

function formatCurrency(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount < 0.01 ? 4 : 2,
  });
  return formatter.format(amount);
}

export function getModelPricingLabel(modelId: string): string | undefined {
  const info = getModelPricing(modelId);
  if (!info) return undefined;
  if (info.amount === undefined) {
    return info.note ?? FALLBACK_NOTE;
  }
  const currency = info.currency ?? DEFAULT_CURRENCY;
  const formatted = formatCurrency(info.amount, currency);
  const unitLabel = info.unit === "image" ? "image" : "video";
  return `${formatted} / ${unitLabel}`;
}
