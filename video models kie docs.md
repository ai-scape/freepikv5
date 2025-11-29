# API Reference

This document provides a comprehensive reference for all video generation and image editing models available in the application.

## Video Generation Models

### Kling 2.5 Turbo Pro
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.21 (5s), $0.42 (10s)

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"kling/v2-5-turbo-image-to-video-pro"` |
| `input.prompt` | string | Yes | Text description for video generation. Max 2500 chars. | `"Astronaut instantly teleports..."` |
| `input.image_url` | string | Yes | URL of the start frame image. Max 10MB. | `"https://..."` |
| `input.tail_image_url` | string | No | URL of the end frame image. Max 10MB. | `"https://..."` |
| `input.duration` | string | No | Video duration. Options: `"5"`, `"10"`. Default: `"5"`. | `"5"` |
| `input.negative_prompt` | string | No | Elements to avoid. Max 2496 chars. | `"blur, distort"` |
| `input.cfg_scale` | number | No | Guidance scale (0.0 - 1.0). Default: `0.5`. | `0.5` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "kling/v2-5-turbo-image-to-video-pro",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "Astronaut instantly teleports...",
    "image_url": "https://file.aiquickdraw.com/...",
    "tail_image_url": "",
    "duration": "5",
    "negative_prompt": "blur, distort",
    "cfg_scale": 0.5
  }
}
```

---

### Hailuo 2.3 Pro
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.22 (6s 768P), $0.45 (10s 768P), $0.39 (6s 1080P)

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"hailuo/2-3-image-to-video-pro"` |
| `input.prompt` | string | Yes | Text prompt. Max 5000 chars. | `"A graceful geisha..."` |
| `input.image_url` | string | Yes | Input image URL. Max 10MB. | `"https://..."` |
| `input.duration` | string | No | Duration. Options: `"6"`, `"10"`. Default: `"6"`. | `"6"` |
| `input.resolution` | string | No | Resolution. Options: `"768P"`, `"1080P"`. Default: `"1080P"`. | `"1080P"` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "hailuo/2-3-image-to-video-pro",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "A graceful geisha...",
    "image_url": "https://file.aiquickdraw.com/...",
    "duration": "6",
    "resolution": "768P"
  }
}
```

---

### Wan 2.5 (I2V)
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.06/sec (720p), $0.10/sec (1080p)

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"wan/2-5-image-to-video"` |
| `input.prompt` | string | Yes | Text prompt. Max 800 chars. | `"The same woman..."` |
| `input.image_url` | string | Yes | Input image URL. Max 10MB. | `"https://..."` |
| `input.duration` | string | No | Duration. Options: `"5"`, `"10"`. Default: `"5"`. | `"5"` |
| `input.resolution` | string | No | Resolution. Options: `"720p"`, `"1080p"`. Default: `"1080p"`. | `"1080p"` |
| `input.enable_prompt_expansion` | boolean | No | Enable LLM prompt expansion. Default: `true`. | `true` |
| `input.seed` | number | No | Random seed. | `12345` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "wan/2-5-image-to-video",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "The same woman...",
    "image_url": "https://file.aiquickdraw.com/...",
    "duration": "5",
    "resolution": "1080p",
    "enable_prompt_expansion": true
  }
}
```

---

### Kling 2.1 Pro
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.25 (5s), $0.50 (10s)

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"kling/v2-1-pro"` |
| `input.prompt` | string | Yes | Text prompt. Max 5000 chars. | `"POV shot..."` |
| `input.image_url` | string | Yes | Input image URL. Max 10MB. | `"https://..."` |
| `input.tail_image_url` | string | No | End frame image URL. Max 10MB. | `"https://..."` |
| `input.duration` | string | No | Duration. Options: `"5"`, `"10"`. Default: `"5"`. | `"5"` |
| `input.negative_prompt` | string | No | Negative prompt. Max 500 chars. | `"blur, distort"` |
| `input.cfg_scale` | number | No | Guidance scale. Default: `0.5`. | `0.5` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "kling/v2-1-pro",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "POV shot...",
    "image_url": "https://file.aiquickdraw.com/...",
    "duration": "5",
    "negative_prompt": "blur, distort",
    "cfg_scale": 0.5
  }
}
```

---

### Seedance V1 Pro
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.014/sec (480p), $0.030/sec (720p), $0.070/sec (1080p)

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"bytedance/v1-pro-image-to-video"` |
| `input.prompt` | string | Yes | Text prompt. Max 10000 chars. | `"A golden retriever..."` |
| `input.image_url` | string | Yes | Input image URL. Max 10MB. | `"https://..."` |
| `input.resolution` | string | No | Resolution. Options: `"480p"`, `"720p"`, `"1080p"`. Default: `"1080p"`. | `"1080p"` |
| `input.duration` | string | No | Duration. Options: `"5"`, `"10"`. Default: `"5"`. | `"5"` |
| `input.camera_fixed` | boolean | No | Fix camera position. Default: `false`. | `false` |
| `input.seed` | number | No | Random seed (-1 for random). | `-1` |
| `input.enable_safety_checker` | boolean | No | Enable safety checker. Default: `true`. | `true` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "bytedance/v1-pro-image-to-video",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "A golden retriever...",
    "image_url": "https://file.aiquickdraw.com/...",
    "resolution": "720p",
    "duration": "5",
    "camera_fixed": false,
    "seed": -1,
    "enable_safety_checker": true
  }
}
```

---

### Veo 3.1 Fast
**Provider**: KIE
**Endpoint**: `/api/v1/veo/generate`
**Pricing**: $0.30 per video

#### Parameters
*Note: Veo uses a flat JSON body, not nested in `input`.*

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID. Options: `"veo3"`, `"veo3_fast"`. | `"veo3_fast"` |
| `prompt` | string | Yes | Text prompt. | `"A dog playing..."` |
| `imageUrls` | array | No | List of 1 or 2 image URLs for I2V. | `["http://..."]` |
| `generationType` | string | No | Mode: `"TEXT_2_VIDEO"`, `"FIRST_AND_LAST_FRAMES_2_VIDEO"`, `"REFERENCE_2_VIDEO"`. | `"TEXT_2_VIDEO"` |
| `aspectRatio` | string | No | Aspect ratio: `"16:9"`, `"9:16"`, `"Auto"`. Default: `"16:9"`. | `"16:9"` |
| `seeds` | number | No | Random seed (10000-99999). | `12345` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "prompt": "A dog playing in a park",
  "imageUrls": [ "http://example.com/image1.jpg", "http://example.com/image2.jpg" ],
  "model": "veo3_fast",
  "callBackUrl": "http://your-callback-url.com/complete",
  "aspectRatio": "16:9",
  "seeds": 12345,
  "generationType": "FIRST_AND_LAST_FRAMES_2_VIDEO"
}
```

---

## Image Editing Models

### Nano Banana — Edit
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.02/image

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"google/nano-banana-edit"` |
| `input.prompt` | string | Yes | Edit prompt. | `"turn this photo..."` |
| `input.image_urls` | array | Yes | List of input image URLs (max 10). | `["https://..."]` |
| `input.output_format` | string | No | Output format: `"png"`, `"jpeg"`. Default: `"png"`. | `"png"` |
| `input.image_size` | string | No | Aspect ratio (e.g., `"1:1"`, `"16:9"`). | `"1:1"` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "google/nano-banana-edit",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "turn this photo...",
    "image_urls": ["https://file.aiquickdraw.com/..."],
    "output_format": "png",
    "image_size": "1:1"
  }
}
```

---

### Nano Banana Pro
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.12/image

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"nano-banana-pro"` |
| `input.prompt` | string | Yes | Text description of the image. Max 5000 chars. | `"Comic poster..."` |
| `input.image_input` | array | No | Input images for reference/edit (max 8). | `["https://..."]` |
| `input.aspect_ratio` | string | No | Aspect ratio. Options: `"1:1"`, `"2:3"`, `"3:2"`, `"3:4"`, `"4:3"`, `"4:5"`, `"5:4"`, `"9:16"`, `"16:9"`, `"21:9"`. | `"1:1"` |
| `input.resolution` | string | No | Resolution. Options: `"1K"`, `"2K"`, `"4K"`. | `"1K"` |
| `input.output_format` | string | No | Output format: `"png"`, `"jpg"`. | `"png"` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "nano-banana-pro",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "Comic poster: cool banana hero in shades leaps from sci-fi pad...",
    "image_input": [],
    "aspect_ratio": "1:1",
    "resolution": "1K",
    "output_format": "png"
  }
}
```

---

### Seedream V4 — Edit
**Provider**: KIE
**Endpoint**: `/api/v1/jobs/createTask`
**Pricing**: $0.0175/image

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID | `"bytedance/seedream-v4-edit"` |
| `input.prompt` | string | Yes | Edit prompt. | `"create a showcase..."` |
| `input.image_urls` | array | Yes | List of input image URLs. | `["https://..."]` |
| `input.image_size` | string | No | Size preset (e.g., `"square_hd"`). | `"square_hd"` |
| `input.image_resolution` | string | No | Resolution (e.g., `"1K"`, `"2K"`). | `"1K"` |
| `input.max_images` | number | No | Max images (1-6). Default: `1`. | `1` |
| `input.seed` | number | No | Random seed. | `12345` |
| `callBackUrl` | string | No | Callback URL for notifications. | `"https://..."` |

#### Request Example
```json
{
  "model": "bytedance/seedream-v4-edit",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "prompt": "create a showcase...",
    "image_urls": ["https://file.aiquickdraw.com/..."],
    "image_size": "square_hd",
    "image_resolution": "1K",
    "max_images": 1
  }
}
```

---

### Qwen Image Edit Plus
**Provider**: FAL
**Endpoint**: `fal-ai/qwen-image-edit-plus`
**Pricing**: $0.03/image

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `prompt` | string | Yes | Edit prompt. | `"make it snowy"` |
| `image_urls` | array | Yes | List of input image URLs. | `["https://..."]` |
| `image_size` | string | No | Size preset (e.g., `"square_hd"`). | `"square_hd"` |
| `output_format` | string | No | Output format: `"png"`, `"jpeg"`. | `"png"` |
| `seed` | number | No | Random seed. | `12345` |
| `enable_safety_checker` | boolean | No | Enable safety checker. | `true` |
| `num_images` | number | No | Number of images. | `1` |

#### Request Example
```json
{
  "prompt": "make it snowy",
  "image_urls": ["https://file.aiquickdraw.com/..."],
  "image_size": "square_hd",
  "output_format": "png",
  "enable_safety_checker": true,
  "num_images": 1
}
```

---

### Fal VLM (Prompt Expansion)
**Provider**: FAL
**Endpoint**: `openrouter/router/vision`
**Pricing**: Varies by model (via OpenRouter)

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID (e.g., `google/gemini-2.5-flash`). | `"google/gemini-2.5-flash"` |
| `prompt` | string | Yes | Text prompt. | `"Describe this image..."` |
| `image_urls` | array | No | List of image URLs. | `["https://..."]` |
| `system_prompt` | string | No | System instructions. | `"Be concise."` |
| `temperature` | number | No | Creativity (0-1). Default: `1`. | `1` |
| `max_tokens` | number | No | Max output tokens. | `1024` |

#### Request Example
```json
{
  "model": "google/gemini-2.5-flash",
  "prompt": "Describe this image...",
  "image_urls": ["https://fal.media/files/..."],
  "system_prompt": "Be concise.",
  "temperature": 1
}
```

---

### Fal LLM (Text-Only Prompt Expansion)
**Provider**: FAL
**Endpoint**: `openrouter/router`
**Pricing**: Varies by model (via OpenRouter)

#### Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID (e.g., `google/gemini-2.5-flash`). | `"google/gemini-2.5-flash"` |
| `prompt` | string | Yes | Text prompt. | `"Write a story..."` |
| `system_prompt` | string | No | System instructions. | `"Be concise."` |
| `temperature` | number | No | Creativity (0-1). Default: `1`. | `1` |
| `max_tokens` | number | No | Max output tokens. | `1024` |

#### Request Example
```json
{
  "model": "google/gemini-2.5-flash",
  "prompt": "Write a story...",
  "system_prompt": "Be concise.",
  "temperature": 1
}
```