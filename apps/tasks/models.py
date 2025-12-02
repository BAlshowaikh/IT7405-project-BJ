from django.db import models
from django.contrib.auth import get_user_model
from apps.projects.models import Project
import uuid

User = get_user_model()


class Task(models.Model):
    # This will generated a public id (not the same as the id in db) which will be used for details, edit and delete
    public_id = models.CharField(
        max_length=36,
        unique=True,
        default=uuid.uuid4,  # auto-generate on create # type: ignore
        editable=False,
    )
    # --- task type ---
    TYPE_PERSONAL = "personal"
    TYPE_PROJECT = "project"

    TASK_TYPE_CHOICES = [
        (TYPE_PERSONAL, "Personal"),
        (TYPE_PROJECT, "Project"),
    ]

    # --- status choices ---
    STATUS_TODO = "todo"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_DONE = "done"

    STATUS_CHOICES = [
        (STATUS_TODO, "To Do"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_DONE, "Done"),
    ]

    # --- priority choices ---
    PRIORITY_LOW = "low"
    PRIORITY_MID = "mid"
    PRIORITY_HIGH = "high"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MID, "Mid"),
        (PRIORITY_HIGH, "High"),
    ]

    # what kind of task is this?
    task_type = models.CharField(
        max_length=20,
        choices=TASK_TYPE_CHOICES,
        default=TYPE_PERSONAL,
    )

    # null for personal tasks, required (by logic) for project tasks
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tasks",
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_tasks",
    )

    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_TODO,
    )

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MID,
    )

    due_date = models.DateField(null=True, blank=True)

    # when the task was actually completed (optional)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["task_type", "status", "due_date", "-created_at"]

    def __str__(self):
        if self.project:
            return f"[{self.project.name}] {self.title}"
        return self.title
