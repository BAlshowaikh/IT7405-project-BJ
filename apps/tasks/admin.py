from django.contrib import admin
from .models import Task, Tip

# Register the task and tip model in admin portal
admin.site.register(Task)
admin.site.register(Tip)
