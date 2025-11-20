import { MODEL_SPECS } from "./models";
import { IMAGE_MODELS } from "./image-models";
import { UPSCALE_MODELS } from "./upscale-models";

/**
 * Get pricing label for a model by looking up its pricing field.
 * Returns the pricing string from the model definition or undefined if not found.
 */
export function getModelPricingLabel(modelId: string): string | undefined {
  // Check video models
  const videoModel = MODEL_SPECS.find((m) => m.id === modelId);
  if (videoModel?.pricing) return videoModel.pricing;

  // Check image models
  const imageModel = IMAGE_MODELS.find((m) => m.id === modelId);
  if (imageModel?.pricing) return imageModel.pricing;

  // Check upscale models
  const upscaleModel = UPSCALE_MODELS.find((m) => m.id === modelId);
  if (upscaleModel?.pricing) return upscaleModel.pricing;

  return undefined;
}
