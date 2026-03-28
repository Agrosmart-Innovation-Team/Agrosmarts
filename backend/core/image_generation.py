"""
AI Image Generation Service
Uses OpenAI DALL-E 3 by default to generate crop images.
Set IMAGE_GENERATION_PROVIDER=huggingface in .env to use Hugging Face instead.
"""

import os
import base64
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)


class ImageGenerationError(Exception):
    pass


class OpenAIImageGenerator:
    """Generate crop images using OpenAI DALL-E 3."""

    API_URL = 'https://api.openai.com/v1/images/generations'

    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY', '')
        if not self.api_key:
            raise ImageGenerationError(
                'OPENAI_API_KEY is not set. Add it to your .env file.'
            )
    
    def generate(self, crop_name: str) -> str:
        prompt = (
            f'A professional high-quality photograph of {crop_name} plants '
            f'growing in a healthy farm field, vibrant colors, natural lighting, '
            f'agricultural setting'
        )
        try:
            response = requests.post(
                self.API_URL,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'dall-e-3',
                    'prompt': prompt,
                    'n': 1,
                    'size': '1024x1024',
                    'quality': 'standard',
                },
                timeout=60,
            )
            if response.status_code != 200:
                try:
                    msg = response.json().get('error', {}).get('message', '')
                except ValueError:
                    msg = ''
                raise ImageGenerationError(
                    f'OpenAI API error {response.status_code}: {msg or "unknown error"}'
                )
            return response.json()['data'][0]['url']
        except requests.RequestException as exc:
            logger.error('OpenAI request failed: %s', exc)
            raise ImageGenerationError(f'Could not reach OpenAI: {exc}')


class HuggingFaceImageGenerator:
    """Generate crop images using Hugging Face Inference API (Stable Diffusion)."""

    MODEL_ID = 'stabilityai/stable-diffusion-2'

    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_API_KEY', '')
        if not self.api_key:
            raise ImageGenerationError(
                'HUGGINGFACE_API_KEY is not set. Add it to your .env file.'
            )

    def generate(self, crop_name: str) -> str:
        prompt = f'A professional photograph of {crop_name} plants growing on a farm'
        try:
            response = requests.post(
                f'https://api-inference.huggingface.co/models/{self.MODEL_ID}',
                headers={'Authorization': f'Bearer {self.api_key}'},
                json={'inputs': prompt},
                timeout=60,
            )
            if response.status_code != 200:
                try:
                    data = response.json()
                    msg = data.get('error') or data.get('message') or ''
                except ValueError:
                    msg = ''
                raise ImageGenerationError(
                    f'Hugging Face API error {response.status_code}: {msg or "unknown error"}'
                )
            b64 = base64.b64encode(response.content).decode('ascii')
            return f'data:image/png;base64,{b64}'
        except requests.RequestException as exc:
            logger.error('Hugging Face request failed: %s', exc)
            raise ImageGenerationError(f'Could not reach Hugging Face: {exc}')


_PROVIDERS = {
    'openai': OpenAIImageGenerator,
    'huggingface': HuggingFaceImageGenerator,
}


def generate_fallback_crop_image(crop_name: str) -> str:
    """Return a lightweight inline SVG fallback when AI providers fail."""
    label = (crop_name or 'Crop').strip().title()[:24]
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0%" stop-color="#0f766e"/>'
        '<stop offset="100%" stop-color="#65a30d"/>'
        '</linearGradient></defs>'
        '<rect width="1024" height="1024" fill="url(#g)"/>'
        '<circle cx="820" cy="210" r="110" fill="#fef08a" opacity="0.9"/>'
        '<path d="M120 760 C260 640, 430 640, 580 760 S900 880, 1024 760 V1024 H120 Z" fill="#14532d" opacity="0.55"/>'
        '<text x="512" y="560" text-anchor="middle" fill="#ffffff" font-size="88" font-family="Arial" font-weight="700">'
        f'{label}'
        '</text>'
        '<text x="512" y="640" text-anchor="middle" fill="#e2e8f0" font-size="36" font-family="Arial">'
        'Image unavailable - fallback used'
        '</text>'
        '</svg>'
    )
    b64 = base64.b64encode(svg.encode('utf-8')).decode('ascii')
    return f'data:image/svg+xml;base64,{b64}'


def generate_crop_image(crop_name: str, provider: Optional[str] = None) -> str:
    """
    Generate an AI image for a crop and return its URL.

    provider defaults to the IMAGE_GENERATION_PROVIDER env var, then 'openai'.
    """
    chosen = (provider or os.getenv('IMAGE_GENERATION_PROVIDER', 'openai')).lower().strip()
    if chosen not in _PROVIDERS:
        raise ImageGenerationError(
            f'Unknown provider "{chosen}". Choose from: {", ".join(_PROVIDERS)}'
        )
    try:
        image_url = _PROVIDERS[chosen]().generate(crop_name)
        logger.info('Generated image for crop "%s" via %s', crop_name, chosen)
        return image_url
    except ImageGenerationError:
        raise
    except Exception as exc:
        logger.error('Unexpected error generating image: %s', exc)
        raise ImageGenerationError(f'Unexpected error: {exc}')
