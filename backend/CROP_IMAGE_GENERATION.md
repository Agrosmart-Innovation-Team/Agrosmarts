# Crop Image Generation Feature

## Overview

This feature allows the backend to generate AI-powered images of crops using external image generation APIs. The generated images are cached in the database for future requests, reducing API calls and costs.

## Architecture

### Components

1. **Image Generation Service** (`core/image_generation.py`)
   - `OpenAIImageGenerator` - Uses OpenAI's DALL-E 3 API
   - `HuggingFaceImageGenerator` - Uses Hugging Face Inference API
   - `ImageGeneratorFactory` - Factory pattern for instantiating generators
   - `generate_crop_image()` - Main entry point function

2. **API Endpoint** (`core/views.py`)
   - `GenerateCropImageView` - REST API endpoint for image generation
   - POST `/api/crops/generate-image/` - Generate and return crop image

3. **Database** (`core/models.py`)
   - `CropOption.image_url` - Caches generated image URLs

## Setup

### 1. Environment Variables

Add one of the following to your `.env` file:

#### For OpenAI DALL-E 3 (Recommended)

```
IMAGE_GENERATION_PROVIDER=openai
OPENAI_API_KEY=sk-...your-api-key...
```

#### For Hugging Face

```
IMAGE_GENERATION_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_...your-api-key...
```

### 2. Apply Database Migration

```bash
python manage.py migrate
```

This creates the `image_url` field in the `CropOption` table.

### 3. API Keys

- **OpenAI**: Get your API key from https://platform.openai.com/api-keys
  - Requires a paid account with credit
  - DALL-E 3 costs approximately $0.04-0.10 per image depending on quality

- **Hugging Face**: Get your API key from https://huggingface.co/settings/tokens
  - Some models are free tier

## Usage

### API Endpoint

**Endpoint**: `POST /api/crops/generate-image/`

**Request Headers**:

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**:

```json
{
  "crop_name": "tomato",
  "provider": "openai" // optional, defaults to env variable
}
```

**Response (Success - HTTP 200)**:

```json
{
  "image_url": "https://...",
  "cached": false
}
```

**Response (Cached - HTTP 200)**:

```json
{
  "image_url": "https://...",
  "cached": true
}
```

**Response (Error - HTTP 400)**:

```json
{
  "error": "Failed to generate image...",
  "detail": "..."
}
```

### Frontend Example

```javascript
// Generate crop image when user selects a crop
const response = await fetch("/api/crops/generate-image/", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    crop_name: selectedCrop,
    provider: "openai", // or undefined to use default
  }),
});

const data = await response.json();
if (response.ok) {
  displayCropImage(data.image_url);
} else {
  console.error("Failed to generate image:", data.error);
}
```

## Caching

- **Database Caching**: Generated images are stored in the `CropOption.image_url` field
- **Cache Keys**: Use crop name for lookup
- **First Request**: Generates and caches the image (~5-30 seconds)
- **Subsequent Requests**: Returns cached image instantly

## Error Handling

The service handles the following errors gracefully:

1. **Missing API Key**: Returns HTTP 400 with clear error message
2. **API Connection Error**: Returns HTTP 400 with retry suggestion
3. **Invalid API Response**: Returns HTTP 400 with parsing error
4. **Rate Limits**: Respects API rate limits, returns HTTP 429
5. **Unexpected Errors**: Returns HTTP 500 with error details

## Performance Considerations

### Caching Strategy

- Images are cached per `CropOption` in the database
- Reduces API calls significantly after first request
- Can be cleared by updating the `image_url` field to NULL

### Rate Limiting

- Configured with `throttle_scope: 'crop_image_generation'`
- Consider setting conservative rate limits for image generation
- Example in `settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'crop_image_generation': '10/hour',  # Max 10 images per hour per user
    }
}
```

### Cost Optimization

- **First request** costs money (API call)
- **Subsequent requests** are free (database retrieval)
- Consider pre-generating images for all common crops
- Monitor usage to avoid unexpected bills

## Customization

### Adding Image Generation Quality Options

```python
# Modify image_generation.py to add quality parameter
def generate(self, crop_name: str, size: str = '1024x1024', quality: str = 'standard'):
    payload = {
        'quality': quality,  # 'standard' or 'hd'
        # ...
    }
```

### Adding New Providers

```python
# In image_generation.py
class CustomImageGenerator:
    def generate(self, crop_name: str) -> str:
        # Your implementation
        pass

ImageGeneratorFactory.GENERATORS['custom'] = CustomImageGenerator
```

## Troubleshooting

### Images not generating

1. Check if API key is set in `.env`
2. Verify the provider is correct
3. Check API account has credits/quota
4. Review server logs for detailed error messages

### Slow response times

1. Check if image is cached (look for `"cached": true`)
2. If not cached, it's normal first time (~5-30 seconds)
3. Subsequent requests should be instant

### High costs

1. Reduce image generation frequency
2. Re-use cached images
3. Consider lower quality settings
4. Monitor API usage in provider dashboard

## Database Queries

### View cached images

```sql
SELECT id, label, image_url FROM core_cropoption WHERE image_url IS NOT NULL;
```

### Clear cached images

```sql
UPDATE core_cropoption SET image_url = NULL;
```

## Security

- Authentication required (JWT token via `IsAuthenticated`)
- Authorization checks via `IsFarmerOfficerOrAdmin`
- API keys stored in environment variables, never in code
- Rate limiting prevents abuse
- Sensitive errors suppressed in production
