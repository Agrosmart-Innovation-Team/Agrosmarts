import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import migrations


ENC_PREFIX = 'enc::'


def _fernet_key():
    configured_key = getattr(settings, 'ENCRYPTION_KEY', '')
    if configured_key:
        return configured_key.encode('utf-8')

    digest = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest)


def _encrypt(value):
    if value in (None, ''):
        return value

    if isinstance(value, str) and value.startswith(ENC_PREFIX):
        return value

    token = Fernet(_fernet_key()).encrypt(value.encode('utf-8')).decode('utf-8')
    return f'{ENC_PREFIX}{token}'


def seed_roles_and_encrypt_data(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    FarmerProfile = apps.get_model('core', 'FarmerProfile')
    SupportMessage = apps.get_model('core', 'SupportMessage')

    for role in ['farmer', 'officer', 'admin']:
        Group.objects.get_or_create(name=role)

    for profile in FarmerProfile.objects.all():
        full_name = _encrypt(profile.full_name)
        location = _encrypt(profile.location)
        crop = _encrypt(profile.crop)

        changed = (
            full_name != profile.full_name
            or location != profile.location
            or crop != profile.crop
            or not profile.is_encrypted
        )

        if changed:
            profile.full_name = full_name
            profile.location = location
            profile.crop = crop
            profile.is_encrypted = True
            profile.save(update_fields=['full_name', 'location', 'crop', 'is_encrypted'])

    for message in SupportMessage.objects.all():
        content = _encrypt(message.content)
        if content != message.content or not message.is_encrypted:
            message.content = content
            message.is_encrypted = True
            message.save(update_fields=['content', 'is_encrypted'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_farmerprofile_is_encrypted_farmerprofile_owner_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_roles_and_encrypt_data, noop_reverse),
    ]
