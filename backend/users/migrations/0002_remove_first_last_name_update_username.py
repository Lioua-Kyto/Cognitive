# Generated migration to remove first_name and last_name fields and update username

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # Remove first_name and last_name fields
        migrations.RemoveField(
            model_name='customuser',
            name='first_name',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='last_name',
        ),
        # Update username field to allow spaces and symbols
        migrations.AlterField(
            model_name='customuser',
            name='username',
            field=models.CharField(
                max_length=150,
                unique=True,
                blank=True,
                null=True,
                help_text="User's display name. Can include spaces and symbols."
            ),
        ),
    ]
