import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


_ENC_PREFIX = 'enc::'


def _derive_key() -> bytes:
    configured_key = getattr(settings, 'ENCRYPTION_KEY', '')
    if configured_key:
        return configured_key.encode('utf-8')

    digest = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest)


def _fernet() -> Fernet:
    return Fernet(_derive_key())


def encrypt_value(value: Optional[str]) -> str:
    if value in (None, ''):
        return '' if value == '' else value

    if isinstance(value, str) and value.startswith(_ENC_PREFIX):
        return value

    token = _fernet().encrypt(value.encode('utf-8')).decode('utf-8')
    return f'{_ENC_PREFIX}{token}'


def decrypt_value(value: Optional[str]) -> Optional[str]:
    if value in (None, ''):
        return value

    if not isinstance(value, str) or not value.startswith(_ENC_PREFIX):
        return value

    token = value[len(_ENC_PREFIX):]
    try:
        return _fernet().decrypt(token.encode('utf-8')).decode('utf-8')
    except (InvalidToken, ValueError):
        return value
