from django.apps import AppConfig


class SystemConfigConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.system_config"
    verbose_name = "System Config"

    def ready(self):
        from . import signals  # noqa: F401
