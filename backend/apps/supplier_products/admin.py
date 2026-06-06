from django.contrib import admin

from .models import CultivationProcess

# Register your models here.
class CultivationProcessInline(admin.TabularInline):
    model = CultivationProcess
    extra = 0
    ordering = ["step_order"]