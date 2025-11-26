from django.db import models
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.tasks.models import Task

User = get_user_model()


class Notification(models.Model):
    # ---- notification types ----
    TYPE_TASK_ASSIGNED = "task_assigned"
    TYPE_TASK_STATUS_CHANGED = "task_status_changed"
    TYPE_PROJECT_INVITE = "project_invite"
    TYPE_PROJECT_ROLE_CHANGED = "project_role_changed"

    TYPE_CHOICES = [
        (TYPE_TASK_ASSIGNED, "Task Assigned"),
        (TYPE_TASK_STATUS_CHANGED, "Task Status Changed"),
        (TYPE_PROJECT_INVITE, "Project Invite"),
        (TYPE_PROJECT_ROLE_CHANGED, "Project Role Changed"),
    ]

    # who will SEE this notification
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    # who CAUSED it (optional, e.g. PM who assigned a task)
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications_made",
    )

    type = models.CharField(max_length=50, choices=TYPE_CHOICES)

    # short text displayed in the UI
    message = models.CharField(max_length=255)

    # In case we'll implement the notification to linked with a project
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # for "go to" link in frontend (optional but handy)
    target_url = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional URL to redirect the user when they click the notification.",
    )

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.user}: {self.message[:30]}"
