from django.db import models
from django.contrib.auth import get_user_model

# Use django built in auth
User = get_user_model()

# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Project(models.Model):
    # --- status choices ---
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_NOT_ACTIVE = "not_active"

    # The first arg will be stored in the db, the second arg is what will be displayed for the user
    STATUS_CHOICES = [
        (STATUS_IN_PROGRESS, "In Progress"), 
        (STATUS_COMPLETED, "Completed"),
        (STATUS_NOT_ACTIVE, "Not Active"),
    ]

    # --- priority choices ---
    PRIORITY_HIGH = "high"
    PRIORITY_MID = "mid"
    PRIORITY_LOW = "low"

    PRIORITY_CHOICES = [
        (PRIORITY_HIGH, "High"),
        (PRIORITY_MID, "Mid"),
        (PRIORITY_LOW, "Low"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # ----------------- What does "realted name" mean -----------------
    # related_name is essentially a virtual attribute or column added to 
    # the related model (the one the ForeignKey points to) that lets you ea
    # sily access the collection of objects on the other side.
    # example usage: user_instance.owned_projects.all() 
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_projects",
    )

    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_IN_PROGRESS,
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MID,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProjectMembership(models.Model):
    ROLE_PM = "PM"
    ROLE_MEMBER = "MEMBER"

    ROLE_CHOICES = [
        (ROLE_PM, "Project Manager"),
        (ROLE_MEMBER, "Member"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_MEMBER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    # Configure the settings of the class
    class Meta:
        unique_together = ("user", "project")

    def __str__(self):
        return f"{self.user} @ {self.project} ({self.role})"

