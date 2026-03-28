from django.db import migrations


def seed_initial_data(apps, schema_editor):
    CropOption = apps.get_model('core', 'CropOption')
    Alert = apps.get_model('core', 'Alert')
    Category = apps.get_model('core', 'Category')
    Guide = apps.get_model('core', 'Guide')
    Notification = apps.get_model('core', 'Notification')
    SupportMessage = apps.get_model('core', 'SupportMessage')
    QuickReply = apps.get_model('core', 'QuickReply')

    if not CropOption.objects.exists():
        CropOption.objects.bulk_create(
            [
                CropOption(label='Maize', icon='grass', order=1),
                CropOption(label='Rice', icon='rice_bowl', order=2),
                CropOption(label='Coffee', icon='coffee', order=3),
                CropOption(label='Cassava', icon='grass', order=4),
                CropOption(label='Other', icon='more_horiz', order=5),
            ]
        )

    if not Alert.objects.exists():
        Alert.objects.bulk_create(
            [
                Alert(
                    title='Aphid Infestation Risk',
                    severity='high',
                    level_label='High Risk',
                    action='Apply neem oil spray immediately',
                    tag='Pest',
                    icon='bug_report',
                    timestamp='2 hours ago',
                    crop='Maize',
                ),
                Alert(
                    title='Leaf Rust Detection',
                    severity='medium',
                    level_label='Medium Risk',
                    action='Monitor and apply fungicide if spreading',
                    tag='Disease',
                    icon='coronavirus',
                    timestamp='5 hours ago',
                    crop='Wheat',
                ),
                Alert(
                    title='Optimal Growth Window',
                    severity='low',
                    level_label='Low Risk',
                    action='Maintain current practices',
                    tag='Advisory',
                    icon='check_circle',
                    timestamp='1 day ago',
                    crop='Rice',
                ),
            ]
        )

    if not Category.objects.exists():
        Category.objects.bulk_create(
            [
                Category(
                    title='Crop Management',
                    count=12,
                    icon='agriculture',
                    description='Planting, irrigation, harvesting',
                ),
                Category(
                    title='Pest Control',
                    count=8,
                    icon='bug_report',
                    description='Identification and treatment',
                ),
                Category(
                    title='Weather Adaptation',
                    count=6,
                    icon='cloud',
                    description='Seasonal planning',
                ),
                Category(
                    title='Soil Health',
                    count=9,
                    icon='yard',
                    description='Fertility and testing',
                ),
            ]
        )

    if not Guide.objects.exists():
        category_map = {category.title: category for category in Category.objects.all()}
        Guide.objects.bulk_create(
            [
                Guide(
                    title='Water-Efficient Irrigation',
                    badge='New',
                    category=category_map.get('Crop Management'),
                    summary='Best practices for drip and sprinkler systems',
                    details='Reduces water usage by up to 40%',
                    image='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
                    content=[
                        'Check soil moisture before irrigating — only water when top 2–3 inches are dry.',
                        'Use drip irrigation at the root zone to reduce evaporation by up to 40%.',
                        'Water in the early morning (5–8 AM) to minimize heat evaporation.',
                        'Install a timer or moisture sensor to automate your irrigation schedule.',
                        'Avoid overwatering: yellowing lower leaves are a sign of root saturation.',
                    ],
                ),
                Guide(
                    title='Aphid Control for Small Farms',
                    badge='Popular',
                    category=category_map.get('Pest Control'),
                    summary='Early detection and safe treatment for sap-sucking pests',
                    details='Use scouting and targeted spraying to reduce crop loss',
                    image='https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
                    content=[
                        'Inspect the underside of leaves twice a week for clustered aphids.',
                        'Prune heavily infested leaves to slow spread across the field.',
                        'Apply neem or insecticidal soap in the early evening for best coverage.',
                        'Encourage beneficial insects such as ladybirds by avoiding broad-spectrum chemicals.',
                    ],
                ),
                Guide(
                    title='Planning for Irregular Rainfall',
                    badge='Essential',
                    category=category_map.get('Weather Adaptation'),
                    summary='Prepare crops and field operations for unstable seasonal patterns',
                    details='Improve resilience using forecast-based planning',
                    image='https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
                    content=[
                        'Review 7-day and monthly forecasts before planting or top-dressing.',
                        'Create shallow drainage channels in low-lying areas before heavy rain periods.',
                        'Stagger planting dates when rainfall timing is uncertain.',
                        'Store mulch or residue cover to reduce soil moisture loss during dry spells.',
                    ],
                ),
                Guide(
                    title='Improving Soil Fertility Naturally',
                    badge='',
                    category=category_map.get('Soil Health'),
                    summary='Practical steps for compost, residue retention, and soil structure',
                    details='Build long-term soil productivity with low-cost methods',
                    image='https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?w=400',
                    content=[
                        'Apply well-decomposed compost before planting to improve moisture retention.',
                        'Rotate legumes into the field to support nitrogen recovery.',
                        'Avoid burning crop residues; incorporate them or use them as mulch.',
                        'Test soil pH periodically so amendments can be applied accurately.',
                    ],
                ),
            ]
        )

    if not Notification.objects.exists():
        Notification.objects.bulk_create(
            [
                Notification(message='New pest alert for your region'),
                Notification(message='Rain forecast updated'),
                Notification(message='Guide: Aphid treatment added'),
            ]
        )

    if not SupportMessage.objects.exists():
        SupportMessage.objects.bulk_create(
            [
                SupportMessage(
                    sender='officer',
                    time='09:00',
                    content="Good morning! I'm here to help with any agricultural questions.",
                ),
                SupportMessage(
                    sender='user',
                    time='09:05',
                    content='Hello, my maize leaves are turning yellow.',
                ),
                SupportMessage(
                    sender='officer',
                    time='09:06',
                    content='That could be nitrogen deficiency. Have you applied fertilizer recently?',
                ),
            ]
        )

    if not QuickReply.objects.exists():
        QuickReply.objects.bulk_create(
            [
                QuickReply(text='My crops are wilting', order=1),
                QuickReply(text='Pest identification help', order=2),
                QuickReply(text='Weather advice needed', order=3),
                QuickReply(text='Fertilizer recommendations', order=4),
            ]
        )


def remove_seed_data(apps, schema_editor):
    CropOption = apps.get_model('core', 'CropOption')
    Alert = apps.get_model('core', 'Alert')
    Category = apps.get_model('core', 'Category')
    Guide = apps.get_model('core', 'Guide')
    Notification = apps.get_model('core', 'Notification')
    SupportMessage = apps.get_model('core', 'SupportMessage')
    QuickReply = apps.get_model('core', 'QuickReply')

    Guide.objects.all().delete()
    Category.objects.all().delete()
    Alert.objects.all().delete()
    CropOption.objects.all().delete()
    Notification.objects.all().delete()
    SupportMessage.objects.all().delete()
    QuickReply.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_initial_data, remove_seed_data),
    ]