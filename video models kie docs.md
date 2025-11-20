# Tab 1

**Kling 2.5 turbo pro**  
**5 sec 0.21$ 10 sec 0.42$**

#### **Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"kling/v2-5-turbo-image-to-video-pro"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.prompt`  
Required  
string

Text description for the video generation

Max length: 2500 characters

Example:

`"Astronaut instantly teleports through a glowing magical wooden door. Handheld tracking, camera stays 5–10 meters above and behind, smooth third-person chase. Hyper-realistic base, each scene with distinct art style, instant scene flashes with bright portal glow, high detail, 8K, epic orchestral undertones. High-frame interpolation for smooth motion and sharp instant transitions. Close-up: astronaut in white suit falls rapidly through glowing portal underfoot.\nFirst transition: LEGO Alps, high-saturation daylight, snowy peaks and valleys below, astronaut falls, next portal opens.\nSecond transition: Amazon rainforest, dense canopy and rivers below, astronaut falls, next portal opens.\nThird transition: Ancient Egypt, Giza pyramids in mural style, desert and Nile below, astronaut falls, next portal opens.\nFourth transition: abstract black-and-white ink style, Chinese Great Wall below, astronaut falls, final portal opens.\nFifth transition: New York night, realistic dark skyline, glowing city lights, Empire State Building, astronaut hovers elegantly. Camera maintains constant distance, slight orbit, smooth third-person tracking throughout. Each portal transition is a sharp flash, emphasizing speed and magical journey, abrupt style and location shifts."`  
`input.image_url`  
Required  
string(URL)

URL of the image to be used for the video

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`"https://file.aiquickdraw.com/custom-page/akr/section-images/1759211376283gfcw5zcy.png"`  
`input.duration`  
Optional  
string

The duration of the generated video in seconds

Available options:

`5`\-5 seconds  
`10`\-10 seconds

Example:

`"5"`  
`input.negative_prompt`  
Optional  
string

Elements to avoid in the video

Max length: 2496 characters

Example:

`"blur, distort, and low quality"`  
`input.cfg_scale`  
Optional  
number

The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt

Min: 0, Max: 1, Step: 0.1

Example:

`0.5`

### **Request Example**

`const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {`  
  `method: 'POST',`  
  `headers: {`  
    `'Content-Type': 'application/json',`  
    `'Authorization': 'Bearer YOUR_API_KEY'`  
  `},`  
  `body: JSON.stringify({`  
    `model: 'kling/v2-5-turbo-image-to-video-pro',`  
    `callBackUrl: 'https://your-domain.com/api/callback',`  
    `input: {`  
      `"prompt": "Astronaut instantly teleports through a glowing magical wooden door. Handheld tracking, camera stays 5–10 meters above and behind, smooth third-person chase. Hyper-realistic base, each scene with distinct art style, instant scene flashes with bright portal glow, high detail, 8K, epic orchestral undertones. High-frame interpolation for smooth motion and sharp instant transitions. Close-up: astronaut in white suit falls rapidly through glowing portal underfoot.\nFirst transition: LEGO Alps, high-saturation daylight, snowy peaks and valleys below, astronaut falls, next portal opens.\nSecond transition: Amazon rainforest, dense canopy and rivers below, astronaut falls, next portal opens.\nThird transition: Ancient Egypt, Giza pyramids in mural style, desert and Nile below, astronaut falls, next portal opens.\nFourth transition: abstract black-and-white ink style, Chinese Great Wall below, astronaut falls, final portal opens.\nFifth transition: New York night, realistic dark skyline, glowing city lights, Empire State Building, astronaut hovers elegantly. Camera maintains constant distance, slight orbit, smooth third-person tracking throughout. Each portal transition is a sharp flash, emphasizing speed and magical journey, abrupt style and location shifts.",`  
      `"image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1759211376283gfcw5zcy.png",`  
      `"duration": "5",`  
      `"negative_prompt": "blur, distort, and low quality",`  
      `"cfg_scale": 0.5`  
    `}`  
  `})`  
`});`

`const result = await response.json();`  
`console.log(result);`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "kling/v2-5-turbo-image-to-video-pro",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"kling/v2-5-turbo-image-to-video-pro\",\"input\":{\"prompt\":\"Astronaut instantly teleports through a glowing magical wooden door. Handheld tracking, camera stays 5–10 meters above and behind, smooth third-person chase. Hyper-realistic base, each scene with distinct art style, instant scene flashes with bright portal glow, high detail, 8K, epic orchestral undertones. High-frame interpolation for smooth motion and sharp instant transitions. Close-up: astronaut in white suit falls rapidly through glowing portal underfoot.\nFirst transition: LEGO Alps, high-saturation daylight, snowy peaks and valleys below, astronaut falls, next portal opens.\nSecond transition: Amazon rainforest, dense canopy and rivers below, astronaut falls, next portal opens.\nThird transition: Ancient Egypt, Giza pyramids in mural style, desert and Nile below, astronaut falls, next portal opens.\nFourth transition: abstract black-and-white ink style, Chinese Great Wall below, astronaut falls, final portal opens.\nFifth transition: New York night, realistic dark skyline, glowing city lights, Empire State Building, astronaut hovers elegantly. Camera maintains constant distance, slight orbit, smooth third-person tracking throughout. Each portal transition is a sharp flash, emphasizing speed and magical journey, abrupt style and location shifts.\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1759211376283gfcw5zcy.png\",\"duration\":\"5\",\"negative_prompt\":\"blur, distort, and low quality\",\"cfg_scale\":0.5}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "kling/v2-5-turbo-image-to-video-pro",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"kling/v2-5-turbo-image-to-video-pro\",\"input\":{\"prompt\":\"Astronaut instantly teleports through a glowing magical wooden door. Handheld tracking, camera stays 5–10 meters above and behind, smooth third-person chase. Hyper-realistic base, each scene with distinct art style, instant scene flashes with bright portal glow, high detail, 8K, epic orchestral undertones. High-frame interpolation for smooth motion and sharp instant transitions. Close-up: astronaut in white suit falls rapidly through glowing portal underfoot.\nFirst transition: LEGO Alps, high-saturation daylight, snowy peaks and valleys below, astronaut falls, next portal opens.\nSecond transition: Amazon rainforest, dense canopy and rivers below, astronaut falls, next portal opens.\nThird transition: Ancient Egypt, Giza pyramids in mural style, desert and Nile below, astronaut falls, next portal opens.\nFourth transition: abstract black-and-white ink style, Chinese Great Wall below, astronaut falls, final portal opens.\nFifth transition: New York night, realistic dark skyline, glowing city lights, Empire State Building, astronaut hovers elegantly. Camera maintains constant distance, slight orbit, smooth third-person tracking throughout. Each portal transition is a sharp flash, emphasizing speed and magical journey, abrupt style and location shifts.\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1759211376283gfcw5zcy.png\",\"duration\":\"5\",\"negative_prompt\":\"blur, distort, and low quality\",\"cfg_scale\":0.5}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`  
**Hailuo 2.3**  
**Pro 6s 768P 45 credits ($0.22), Pro 10s 768P 90 credits ($0.45), Pro 6s 1080P 80 credits ($0.39)**  
**Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"hailuo/2-3-image-to-video-pro"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.prompt`  
Required  
string

Text prompt describing the desired video animation

Max length: 5000 characters

Example:

`"A graceful geisha performs a traditional Japanese dance indoors. She wears a luxurious red kimono with golden floral embroidery, white obi belt, and white tabi socks. Soft and elegant hand movements, expressive pose, sleeves flowing naturally. Scene set in a Japanese tatami room with warm ambient lighting, shoji paper sliding doors, and cherry blossom branches hanging in the foreground. Cinematic, soft depth of field, high detail fabric texture, hyper-realistic, smooth motion."`  
`input.image_url`  
Required  
string(URL)

Input image to animate

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`"https://file.aiquickdraw.com/custom-page/akr/section-images/1761736831884xl56xfiw.webp"`  
`input.duration`  
Optional  
string

The duration of the video in seconds. 10 seconds videos are not supported for 1080p resolution.

Available options:

`6`\-6 seconds  
`10`\-10 seconds

Example:

`"6"`  
`input.resolution`  
Optional  
string

The resolution of the generated video.

Available options:

`768P`\-768P  
`1080P`\-1080P

Example:

`"768P"`

### **Request Example**

`const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {`  
  `method: 'POST',`  
  `headers: {`  
    `'Content-Type': 'application/json',`  
    `'Authorization': 'Bearer YOUR_API_KEY'`  
  `},`  
  `body: JSON.stringify({`  
    `model: 'hailuo/2-3-image-to-video-pro',`  
    `callBackUrl: 'https://your-domain.com/api/callback',`  
    `input: {`  
      `"prompt": "A graceful geisha performs a traditional Japanese dance indoors. She wears a luxurious red kimono with golden floral embroidery, white obi belt, and white tabi socks. Soft and elegant hand movements, expressive pose, sleeves flowing naturally. Scene set in a Japanese tatami room with warm ambient lighting, shoji paper sliding doors, and cherry blossom branches hanging in the foreground. Cinematic, soft depth of field, high detail fabric texture, hyper-realistic, smooth motion.",`  
      `"image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1761736831884xl56xfiw.webp",`  
      `"duration": "6",`  
      `"resolution": "768P"`  
    `}`  
  `})`  
`});`

`const result = await response.json();`  
`console.log(result);`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "hailuo/2-3-image-to-video-pro",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"hailuo/2-3-image-to-video-pro\",\"input\":{\"prompt\":\"A graceful geisha performs a traditional Japanese dance indoors. She wears a luxurious red kimono with golden floral embroidery, white obi belt, and white tabi socks. Soft and elegant hand movements, expressive pose, sleeves flowing naturally. Scene set in a Japanese tatami room with warm ambient lighting, shoji paper sliding doors, and cherry blossom branches hanging in the foreground. Cinematic, soft depth of field, high detail fabric texture, hyper-realistic, smooth motion.\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1761736831884xl56xfiw.webp\",\"duration\":\"6\",\"resolution\":\"768P\"}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "hailuo/2-3-image-to-video-pro",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"hailuo/2-3-image-to-video-pro\",\"input\":{\"prompt\":\"A graceful geisha performs a traditional Japanese dance indoors. She wears a luxurious red kimono with golden floral embroidery, white obi belt, and white tabi socks. Soft and elegant hand movements, expressive pose, sleeves flowing naturally. Scene set in a Japanese tatami room with warm ambient lighting, shoji paper sliding doors, and cherry blossom branches hanging in the foreground. Cinematic, soft depth of field, high detail fabric texture, hyper-realistic, smooth motion.\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1761736831884xl56xfiw.webp\",\"duration\":\"6\",\"resolution\":\"768P\"}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`  
**Wan 2.5**  
**Pricing: WAN-25 costs 12 credits per second for 720p (\~$0.06) and 20 credits per second for 1080p (\~$0.10).**  
**Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"wan/2-5-image-to-video"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.prompt`  
Required  
string

The text prompt describing the desired video motion

Max length: 800 characters

Example:

`"The same woman from the reference image looks directly into the camera, takes a breath, then smiles brightly and speaks with enthusiasm: “Have you heard? Alibaba Wan 2.5 API is now available on Kie.ai!” Ambient audio: quiet indoor atmosphere, soft natural room tone. Camera: medium close-up, steady framing, natural daylight mood, accurate lip-sync with dialogue."`  
`input.image_url`  
Required  
string(URL)

URL of the image to use as the first frame. Must be publicly accessible

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`"https://file.aiquickdraw.com/custom-page/akr/section-images/1758796480945qb63zxq8.webp"`  
`input.duration`  
Optional  
string

The duration of the generated video in seconds

Available options:

`5`\-5 seconds  
`10`\-10 seconds

Example:

`"5"`  
`input.resolution`  
Optional  
string

Video resolution. Valid values: 720p, 1080p

Available options:

`720p`\-720p  
`1080p`\-1080p

Example:

`"1080p"`  
`input.negative_prompt`  
Optional  
string

Negative prompt to describe content to avoid

Max length: 500 characters

`input.enable_prompt_expansion`  
Optional  
boolean

Whether to enable prompt rewriting using LLM

Boolean value (true/false)

Example:

`true`  
`input.seed`  
Optional  
integer

Random seed for reproducibility. If None, a random seed is chosen

### **Request Example**

`const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {`  
  `method: 'POST',`  
  `headers: {`  
    `'Content-Type': 'application/json',`  
    `'Authorization': 'Bearer YOUR_API_KEY'`  
  `},`  
  `body: JSON.stringify({`  
    `model: 'wan/2-5-image-to-video',`  
    `callBackUrl: 'https://your-domain.com/api/callback',`  
    `input: {`  
      `"prompt": "The same woman from the reference image looks directly into the camera, takes a breath, then smiles brightly and speaks with enthusiasm: “Have you heard? Alibaba Wan 2.5 API is now available on Kie.ai!” Ambient audio: quiet indoor atmosphere, soft natural room tone. Camera: medium close-up, steady framing, natural daylight mood, accurate lip-sync with dialogue.",`  
      `"image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1758796480945qb63zxq8.webp",`  
      `"duration": "5",`  
      `"resolution": "1080p",`  
      `"enable_prompt_expansion": true`  
    `}`  
  `})`  
`});`

`const result = await response.json();`  
`console.log(result);`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "wan/2-5-image-to-video",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"wan/2-5-image-to-video\",\"input\":{\"prompt\":\"The same woman from the reference image looks directly into the camera, takes a breath, then smiles brightly and speaks with enthusiasm: “Have you heard? Alibaba Wan 2.5 API is now available on Kie.ai!” Ambient audio: quiet indoor atmosphere, soft natural room tone. Camera: medium close-up, steady framing, natural daylight mood, accurate lip-sync with dialogue.\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1758796480945qb63zxq8.webp\",\"duration\":\"5\",\"resolution\":\"1080p\",\"negative_prompt\":\"\",\"enable_prompt_expansion\":true,\"seed\":null}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "wan/2-5-image-to-video",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"wan/2-5-image-to-video\",\"input\":{\"prompt\":\"The same woman from the reference image looks directly into the camera, takes a breath, then smiles brightly and speaks with enthusiasm: “Have you heard? Alibaba Wan 2.5 API is now available on Kie.ai!” Ambient audio: quiet indoor atmosphere, soft natural room tone. Camera: medium close-up, steady framing, natural daylight mood, accurate lip-sync with dialogue.\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1758796480945qb63zxq8.webp\",\"duration\":\"5\",\"resolution\":\"1080p\",\"negative_prompt\":\"\",\"enable_prompt_expansion\":true,\"seed\":null}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`  
**Kling 2.1 pro**  
**Pricing: A 5-second video costs 50 credits ($0.25), and a 10-second video costs 100 credits ($0.5).**  
**Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"kling/v2-1-pro"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.prompt`  
Required  
string

Text prompt describing the video to generate

Max length: 5000 characters

Example:

`"POV shot of a gravity surfer diving between ancient ruins suspended midair, glowing moss lights the path, the board hisses as it carves through thin mist, echoes rise with speed "`  
`input.image_url`  
Required  
string(URL)

URL of the image to be used for the video

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`"https://file.aiquickdraw.com/custom-page/akr/section-images/1754892534386c8wt0qfs.webp"`  
`input.duration`  
Optional  
string

The duration of the generated video in seconds

Available options:

`5`\-5 seconds  
`10`\-10 seconds

Example:

`"5"`  
`input.negative_prompt`  
Optional  
string

Terms to avoid in the generated video

Max length: 500 characters

Example:

`"blur, distort, and low quality"`  
`input.cfg_scale`  
Optional  
number

The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt

Min: 0, Max: 1, Step: 0.1

Example:

`0.5`  
`input.tail_image_url`  
Optional  
string(URL)

URL of the image to be used for the end of the video

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

### **Request Example**

`const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {`  
  `method: 'POST',`  
  `headers: {`  
    `'Content-Type': 'application/json',`  
    `'Authorization': 'Bearer YOUR_API_KEY'`  
  `},`  
  `body: JSON.stringify({`  
    `model: 'kling/v2-1-pro',`  
    `callBackUrl: 'https://your-domain.com/api/callback',`  
    `input: {`  
      `"prompt": "POV shot of a gravity surfer diving between ancient ruins suspended midair, glowing moss lights the path, the board hisses as it carves through thin mist, echoes rise with speed ",`  
      `"image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1754892534386c8wt0qfs.webp",`  
      `"duration": "5",`  
      `"negative_prompt": "blur, distort, and low quality",`  
      `"cfg_scale": 0.5`  
    `}`  
  `})`  
`});`

`const result = await response.json();`  
`console.log(result);`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "kling/v2-1-pro",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"kling/v2-1-pro\",\"input\":{\"prompt\":\"POV shot of a gravity surfer diving between ancient ruins suspended midair, glowing moss lights the path, the board hisses as it carves through thin mist, echoes rise with speed \",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1754892534386c8wt0qfs.webp\",\"duration\":\"5\",\"negative_prompt\":\"blur, distort, and low quality\",\"cfg_scale\":0.5,\"tail_image_url\":\"\"}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "kling/v2-1-pro",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"kling/v2-1-pro\",\"input\":{\"prompt\":\"POV shot of a gravity surfer diving between ancient ruins suspended midair, glowing moss lights the path, the board hisses as it carves through thin mist, echoes rise with speed \",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1754892534386c8wt0qfs.webp\",\"duration\":\"5\",\"negative_prompt\":\"blur, distort, and low quality\",\"cfg_scale\":0.5,\"tail_image_url\":\"\"}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`  
**Wan 2.2 pro**  
**Pricing: wan v2.2-a14b turbo costs 16 credits per video second for 720p ($0.08), 12 credits per video for 580p ($0.06), 8 credits per video for 480p ($0.04)**  
**Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"wan/2-2-a14b-image-to-video-turbo"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.image_url`  
Required  
string(URL)

URL of the input image. If the input image does not match the chosen aspect ratio, it is resized and center cropped.

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`"https://file.aiquickdraw.com/custom-page/akr/section-images/1755166042585gtf2mlrk.png"`  
`input.prompt`  
Required  
string

The text prompt to guide video generation.

Max length: 5000 characters

Example:

`"Overcast lighting, medium lens, soft lighting, low contrast lighting, edge lighting, low angle shot, desaturated colors, medium close-up shot, clean single shot, cool colors, center composition.The camera captures a low-angle close-up of a Western man outdoors, sharply dressed in a black coat over a gray sweater, white shirt, and black tie. His gaze is fixed on the lens as he advances. In the background, a brown building looms, its windows glowing with warm, yellow light above a dark doorway. As the camera pushes in, a blurred black object on the right side of the frame drifts back and forth, partially obscuring the view against a dark, nighttime background."`  
`input.resolution`  
Optional  
string

Resolution of the generated video (480p, 580p, or 720p). Default value: "720p"

Available options:

`480p`\-480p  
`580p`\-580p  
`720p`\-720p

Example:

`"720p"`  
`input.aspect_ratio`  
Optional  
string

Aspect ratio of the generated video. If 'auto', the aspect ratio will be determined automatically based on the input image. Default value: "auto"

Available options:

`auto`\-Auto  
`16:9`\-16:9  
`9:16`\-9:16  
`1:1`\-1:1

Example:

`"auto"`  
`input.enable_prompt_expansion`  
Optional  
boolean

Whether to enable prompt expansion. This will use a large language model to expand the prompt with additional details while maintaining the original meaning.

Boolean value (true/false)

Example:

`false`  
`input.seed`  
Optional  
number

Random seed for reproducibility. If None, a random seed is chosen.

Min: 0, Max: 2147483647, Step: 1

Example:

`0`  
`input.acceleration`  
Optional  
string

Acceleration level to use. The more acceleration, the faster the generation, but with lower quality. The recommended value is 'none'. Default value: "none"

Available options:

`none`\-None  
`regular`\-Regular

Example:

`"none"`

### **Request Example**

`curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \`  
  `-H "Content-Type: application/json" \`  
  `-H "Authorization: Bearer YOUR_API_KEY" \`  
  `-d '{`  
    `"model": "wan/2-2-a14b-image-to-video-turbo",`  
    `"callBackUrl": "https://your-domain.com/api/callback",`  
    `"input": {`  
      `"image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755166042585gtf2mlrk.png",`  
      `"prompt": "Overcast lighting, medium lens, soft lighting, low contrast lighting, edge lighting, low angle shot, desaturated colors, medium close-up shot, clean single shot, cool colors, center composition.The camera captures a low-angle close-up of a Western man outdoors, sharply dressed in a black coat over a gray sweater, white shirt, and black tie. His gaze is fixed on the lens as he advances. In the background, a brown building looms, its windows glowing with warm, yellow light above a dark doorway. As the camera pushes in, a blurred black object on the right side of the frame drifts back and forth, partially obscuring the view against a dark, nighttime background.",`  
      `"resolution": "720p",`  
      `"aspect_ratio": "auto",`  
      `"enable_prompt_expansion": false,`  
      `"seed": 0,`  
      `"acceleration": "none"`  
    `}`  
`}'`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "wan/2-2-a14b-image-to-video-turbo",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"wan/2-2-a14b-image-to-video-turbo\",\"input\":{\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1755166042585gtf2mlrk.png\",\"prompt\":\"Overcast lighting, medium lens, soft lighting, low contrast lighting, edge lighting, low angle shot, desaturated colors, medium close-up shot, clean single shot, cool colors, center composition.The camera captures a low-angle close-up of a Western man outdoors, sharply dressed in a black coat over a gray sweater, white shirt, and black tie. His gaze is fixed on the lens as he advances. In the background, a brown building looms, its windows glowing with warm, yellow light above a dark doorway. As the camera pushes in, a blurred black object on the right side of the frame drifts back and forth, partially obscuring the view against a dark, nighttime background.\",\"resolution\":\"720p\",\"aspect_ratio\":\"auto\",\"enable_prompt_expansion\":false,\"seed\":0,\"acceleration\":\"none\"}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "wan/2-2-a14b-image-to-video-turbo",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"wan/2-2-a14b-image-to-video-turbo\",\"input\":{\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1755166042585gtf2mlrk.png\",\"prompt\":\"Overcast lighting, medium lens, soft lighting, low contrast lighting, edge lighting, low angle shot, desaturated colors, medium close-up shot, clean single shot, cool colors, center composition.The camera captures a low-angle close-up of a Western man outdoors, sharply dressed in a black coat over a gray sweater, white shirt, and black tie. His gaze is fixed on the lens as he advances. In the background, a brown building looms, its windows glowing with warm, yellow light above a dark doorway. As the camera pushes in, a blurred black object on the right side of the frame drifts back and forth, partially obscuring the view against a dark, nighttime background.\",\"resolution\":\"720p\",\"aspect_ratio\":\"auto\",\"enable_prompt_expansion\":false,\"seed\":0,\"acceleration\":\"none\"}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`

**Seedance pro**  
**Pricing: For Seedance V1 Pro, generating 1 second of video costs about 2.8 credits ($0.014) at 480p, 6 credits ($0.030) at 720p, and 14 credits ($0.070) at 1080p.**  
**Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"bytedance/v1-pro-image-to-video"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.prompt`  
Required  
string

The text prompt used to generate the video

Max length: 10000 characters

Example:

`"A golden retriever dashing through shallow surf at the beach, back angle camera low near waterline, splashes frozen in time, blur trails in waves and paws, afternoon sun glinting off wet fur, overcast day, dramatic clouds"`  
`input.image_url`  
Required  
string(URL)

The URL of the image used to generate video

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`"https://file.aiquickdraw.com/custom-page/akr/section-images/1755179021328w1nhip18.webp"`  
`input.resolution`  
Optional  
string

Video resolution \- 480p for faster generation, 720p for balance, 1080p for higher quality

Available options:

`480p`\-480p  
`720p`\-720p  
`1080p`\-1080p

Example:

`"720p"`  
`input.duration`  
Optional  
string

Duration of the video in seconds

Available options:

`5`\-5s  
`10`\-10s

Example:

`"5"`  
`input.camera_fixed`  
Optional  
boolean

Whether to fix the camera position

Boolean value (true/false)

Example:

`false`  
`input.seed`  
Optional  
number

Random seed to control video generation. Use \-1 for random.

Min: \-1, Max: 2147483647, Step: 1

Example:

`-1`  
`input.enable_safety_checker`  
Optional  
boolean

The safety checker is always enabled in Playground. It can only be disabled by setting false through the API.

Boolean value (true/false)

Example:

`true`

### **Request Example**

`const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {`  
  `method: 'POST',`  
  `headers: {`  
    `'Content-Type': 'application/json',`  
    `'Authorization': 'Bearer YOUR_API_KEY'`  
  `},`  
  `body: JSON.stringify({`  
    `model: 'bytedance/v1-pro-image-to-video',`  
    `callBackUrl: 'https://your-domain.com/api/callback',`  
    `input: {`  
      `"prompt": "A golden retriever dashing through shallow surf at the beach, back angle camera low near waterline, splashes frozen in time, blur trails in waves and paws, afternoon sun glinting off wet fur, overcast day, dramatic clouds",`  
      `"image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755179021328w1nhip18.webp",`  
      `"resolution": "720p",`  
      `"duration": "5",`  
      `"camera_fixed": false,`  
      `"seed": -1,`  
      `"enable_safety_checker": true`  
    `}`  
  `})`  
`});`

`const result = await response.json();`  
`console.log(result);`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "bytedance/v1-pro-image-to-video",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"bytedance/v1-pro-image-to-video\",\"input\":{\"prompt\":\"A golden retriever dashing through shallow surf at the beach, back angle camera low near waterline, splashes frozen in time, blur trails in waves and paws, afternoon sun glinting off wet fur, overcast day, dramatic clouds\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1755179021328w1nhip18.webp\",\"resolution\":\"720p\",\"duration\":\"5\",\"camera_fixed\":false,\"seed\":-1,\"enable_safety_checker\":true}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "bytedance/v1-pro-image-to-video",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"bytedance/v1-pro-image-to-video\",\"input\":{\"prompt\":\"A golden retriever dashing through shallow surf at the beach, back angle camera low near waterline, splashes frozen in time, blur trails in waves and paws, afternoon sun glinting off wet fur, overcast day, dramatic clouds\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1755179021328w1nhip18.webp\",\"resolution\":\"720p\",\"duration\":\"5\",\"camera_fixed\":false,\"seed\":-1,\"enable_safety_checker\":true}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`

VEO 3.1 fast only  
https://docs.kie.ai/veo3-api/generate-veo-3-video

# Tab 2

#### **Nano Banana edit**

0.02$ per image

#### **Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"google/nano-banana-edit"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.prompt`  
Required  
string

The prompt for image editing

Max length: 5000 characters

Example:

`"turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible"`  
`input.image_urls`  
Required  
array(URL)

List of URLs of input images for editing,up to 10 images.

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`["https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png"]`  
`input.output_format`  
Optional  
string

Output format for the images

Available options:

`png`\-PNG  
`jpeg`\-JPEG

Example:

`"png"`  
`input.image_size`  
Optional  
string

Radio description

Available options:

`1:1`\-1:1  
`9:16`\-9:16  
`16:9`\-16:9  
`3:4`\-3:4  
`4:3`\-4:3  
`3:2`\-3:2  
`2:3`\-2:3  
`5:4`\-5:4  
`4:5`\-4:5  
`21:9`\-21:9  
`auto`\-auto

Example:

`"1:1"`

### **Request Example**

`const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {`  
  `method: 'POST',`  
  `headers: {`  
    `'Content-Type': 'application/json',`  
    `'Authorization': 'Bearer YOUR_API_KEY'`  
  `},`  
  `body: JSON.stringify({`  
    `model: 'google/nano-banana-edit',`  
    `callBackUrl: 'https://your-domain.com/api/callback',`  
    `input: {`  
      `"prompt": "turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible",`  
      `"image_urls": [`  
        `"https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png"`  
      `],`  
      `"output_format": "png",`  
      `"image_size": "1:1"`  
    `}`  
  `})`  
`});`

`const result = await response.json();`  
`console.log(result);`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "google/nano-banana-edit",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"google/nano-banana-edit\",\"input\":{\"prompt\":\"turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible\",\"image_urls\":[\"https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png\"],\"output_format\":\"png\",\"image_size\":\"1:1\"}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "google/nano-banana-edit",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"google/nano-banana-edit\",\"input\":{\"prompt\":\"turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible\",\"image_urls\":[\"https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png\"],\"output_format\":\"png\",\"image_size\":\"1:1\"}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`

**SEEDREAM v4**  
Pricing: Seedream V4: 3.5 credits per image (\~$0.0175). The price is independent of image resolution and is solely determined by the final number of images returned. The number of images depends on the quantity specified in the prompt and the maximum value set by max\_images, both of which jointly determine the final count.

#### **Request Parameters**

The API accepts a JSON payload with the following structure:

##### **Request Body Structure**

{  
  "model": "string",  
  "callBackUrl": "string (optional)",  
  "input": {  
    // Input parameters based on form configuration  
  }  
}

##### **Root Level Parameters**

`model`  
Required  
string

The model name to use for generation

Example:

`"bytedance/seedream-v4-edit"`  
`callBackUrl`  
Optional  
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

`"https://your-domain.com/api/callback"`

##### **Input Object Parameters**

The input object contains the following parameters based on the form configuration:

`input.prompt`  
Required  
string

The text prompt used to edit the image

Max length: 5000 characters

Example:

`"Refer to this logo and create a single visual showcase for an outdoor sports brand named ‘KIE AI’. Display five branded items together in one image: a packaging bag, a hat, a carton box, a wristband, and a lanyard. Use blue as the main visual color, with a fun, simple, and modern style."`  
`input.image_urls`  
Required  
array(URL)

List of URLs of input images for editing. Presently, up to 10 image inputs are allowed.

File URL after upload, not file content; Accepted types: image/jpeg, image/png, image/webp; Max size: 10.0MB

Example:

`["https://file.aiquickdraw.com/custom-page/akr/section-images/1757930552966e7f2on7s.png"]`  
`input.image_size`  
Optional  
string

The size of the generated image.

Available options:

`square`\-Square  
`square_hd`\-Square HD  
`portrait_4_3`\-Portrait 3:4  
`portrait_3_2`\-Portrait 2:3  
`portrait_16_9`\-Portrait 9:16  
`landscape_4_3`\-Landscape 4:3  
`landscape_3_2`\-Landscape 3:2  
`landscape_16_9`\-Landscape 16:9  
`landscape_21_9`\-Landscape 21:9

Example:

`"square_hd"`  
`input.image_resolution`  
Optional  
string

Final image resolution is determined by combining image\_size (aspect ratio) and image\_resolution (pixel scale). For example, choosing 4:3 \+ 4K gives 4096 × 3072px

Available options:

`1K`\-1K  
`2K`\-2K  
`4K`\-4K

Example:

`"1K"`  
`input.max_images`  
Optional  
number

Set this value (1–6) to cap how many images a single generation run can produce in one set—because they’re created in one shot rather than separate requests, you must also state the exact number you want in the prompt so both settings align.

Min: 1, Max: 6, Step: 1

Example:

`1`  
`input.seed`  
Optional  
integer

Random seed to control the stochasticity of image generation.

### **Request Example**

`const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {`  
  `method: 'POST',`  
  `headers: {`  
    `'Content-Type': 'application/json',`  
    `'Authorization': 'Bearer YOUR_API_KEY'`  
  `},`  
  `body: JSON.stringify({`  
    `model: 'bytedance/seedream-v4-edit',`  
    `callBackUrl: 'https://your-domain.com/api/callback',`  
    `input: {`  
      `"prompt": "Refer to this logo and create a single visual showcase for an outdoor sports brand named ‘KIE AI’. Display five branded items together in one image: a packaging bag, a hat, a carton box, a wristband, and a lanyard. Use blue as the main visual color, with a fun, simple, and modern style.",`  
      `"image_urls": [`  
        `"https://file.aiquickdraw.com/custom-page/akr/section-images/1757930552966e7f2on7s.png"`  
      `],`  
      `"image_size": "square_hd",`  
      `"image_resolution": "1K",`  
      `"max_images": 1`  
    `}`  
  `})`  
`});`

`const result = await response.json();`  
`console.log(result);`

### **Response Example**

`{`  
  `"code": 200,`  
  `"message": "success",`  
  `"data": {`  
    `"taskId": "task_12345678"`  
  `}`  
`}`

#### **Response Fields**

`code`Status code, 200 for success, others for failure  
`message`Response message, error description when failed  
`data.taskId`Task ID for querying task status

### **Callback Notifications**

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

#### **Success Callback Example**

`{`  
    `"code": 200,`  
    `"data": {`  
        `"completeTime": 1755599644000,`  
        `"consumeCredits": 100,`  
        `"costTime": 8,`  
        `"createTime": 1755599634000,`  
        `"model": "bytedance/seedream-v4-edit",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"bytedance/seedream-v4-edit\",\"input\":{\"prompt\":\"Refer to this logo and create a single visual showcase for an outdoor sports brand named ‘KIE AI’. Display five branded items together in one image: a packaging bag, a hat, a carton box, a wristband, and a lanyard. Use blue as the main visual color, with a fun, simple, and modern style.\",\"image_urls\":[\"https://file.aiquickdraw.com/custom-page/akr/section-images/1757930552966e7f2on7s.png\"],\"image_size\":\"square_hd\",\"image_resolution\":\"1K\",\"max_images\":1,\"seed\":null}}",`  
        `"remainedCredits": 2510330,`  
        `"resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",`  
        `"state": "success",`  
        `"taskId": "e989621f54392584b05867f87b160672",`  
        `"updateTime": 1755599644000`  
    `},`  
    `"msg": "Playground task completed successfully."`  
`}`

#### **Failure Callback Example**

`{`  
    `"code": 501,`  
    `"data": {`  
        `"completeTime": 1755597081000,`  
        `"consumeCredits": 0,`  
        `"costTime": 0,`  
        `"createTime": 1755596341000,`  
        `"failCode": "500",`  
        `"failMsg": "Internal server error",`  
        `"model": "bytedance/seedream-v4-edit",`  
        `"param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"bytedance/seedream-v4-edit\",\"input\":{\"prompt\":\"Refer to this logo and create a single visual showcase for an outdoor sports brand named ‘KIE AI’. Display five branded items together in one image: a packaging bag, a hat, a carton box, a wristband, and a lanyard. Use blue as the main visual color, with a fun, simple, and modern style.\",\"image_urls\":[\"https://file.aiquickdraw.com/custom-page/akr/section-images/1757930552966e7f2on7s.png\"],\"image_size\":\"square_hd\",\"image_resolution\":\"1K\",\"max_images\":1,\"seed\":null}}",`  
        `"remainedCredits": 2510430,`  
        `"state": "fail",`  
        `"taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",`  
        `"updateTime": 1755597097000`  
    `},`  
    `"msg": "Playground task failed."`  
`}`

Flux kontext:  
https://docs.kie.ai/flux-kontext-api/generate-or-edit-image