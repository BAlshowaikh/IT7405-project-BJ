# NOTES:
# LoginRequiredMixin: Will check if the user is logged in or not,
# If user is not logged in → Django automatically redirects to your login page.
# Once logged in, they land in the dashboard page.

import json  # parse JSON from fetch requests and handle dates
import datetime  # parse JSON from fetch requests and handle dates

from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import get_user_model
from django.db.models import Q  # used for simple title__icontains search
from django.http import JsonResponse, Http404  # send JSON back to the frontend
from django.shortcuts import get_object_or_404  # fetch a task or return 404 if not found (security).
from django.utils import timezone  # compare dates correctly based on my timezone settings.
from django.views import View
from django.views.generic import TemplateView

from .models import Task

User = get_user_model()

# ------------ Helper functions ------------

def task_query_for_user(user):
    """
    Very simple version:
    - Only tasks created by the current user.

    We intentionally avoid assignee / project membership logic and any
    Djongo-unfriendly joins or OR filters.
    """
    return Task.objects.filter(created_by=user)


def get_task_for_user_or_404(user, public_id: str) -> Task:
    """
    Fetch a single task created by this user, matching the uniquli created public id.
    """
    # You said: for now you only care about tasks created_by the user
    # qs = Task.objects.filter(created_by=user)
    try:
        return Task.objects.get(created_by=user, public_id=public_id)
    except Task.DoesNotExist:
        raise Http404("Task not found")


def parse_request_data(request):
    """
    Handle both JSON and form-encoded POSTs.
    """
    content_type = request.headers.get("Content-Type", "")

    if "application/json" in content_type:
        try:
            return json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    return request.POST.dict()

# This function will explicitly go to Mongo db and fetch the task's id
def get_task_identifier(task: Task) -> str:
    """
    Djongo-safe way to get a stable identifier for a Task.

    We try, in order:
    - pk
    - .id attribute
    - ._id attribute
    - low-level __dict__["_id"] / __dict__["id"]

    Finally we return a string, or "" if nothing exists.
    """
    # 1) Normal Django pk
    raw_id = task.pk

    # 2) Explicit id / _id attributes (in case Djongo exposes them)
    if raw_id is None:
        raw_id = getattr(task, "id", None)
    if raw_id is None:
        raw_id = getattr(task, "_id", None)

    # 3) Fallback: read from __dict__ (Djongo often keeps Mongo _id there)
    if raw_id is None:
        raw_id = task.__dict__.get("_id") or task.__dict__.get("id")

    return str(raw_id) if raw_id is not None else ""

def serialize_user(user):
    """
    Simplified representation of a user for JSON responses.
    """
    if not user:
        return None
    return {
        "id": user.pk,
        "username": user.get_username(),
    }


def serialize_task(task: Task):
    """
    Convert a Task instance into a JSON-safe dict.
    This is what your frontend will receive.
    """
    # raw_id = task.pk
    # task_id = str(raw_id) if raw_id is not None else ""
    task_id = get_task_identifier(task)

    return {
        "id": task.public_id,
        "title": task.title,
        "description": task.description,
        "task_type": task.task_type,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
        "project": {
            "id": task.project.id,  # type: ignore
            "name": task.project.name,  # type: ignore
        } if task.project else None,  # type: ignore
        "created_by": serialize_user(task.created_by),
        "assignee": serialize_user(task.assignee),
    }

# Helper to calculate the statics 
def compute_task_stats(tasks):
    """
    Given a list of Task objects, compute the dashboard stats.
    """
    today = timezone.localdate()
    start_of_week = today - datetime.timedelta(days=today.weekday())

    tasks_in_progress_this_week = 0
    tasks_completed_this_week = 0
    tasks_urgent_today = 0

    for task in tasks:
        created_date = task.created_at.date() if task.created_at else None
        due_date = task.due_date

        if created_date and start_of_week <= created_date <= today:
            if task.status == Task.STATUS_IN_PROGRESS:
                tasks_in_progress_this_week += 1
            elif task.status == Task.STATUS_DONE:
                tasks_completed_this_week += 1

        if (
            due_date == today
            and task.status in [Task.STATUS_TODO, Task.STATUS_IN_PROGRESS]
        ):
            tasks_urgent_today += 1

    return {
        "tasks_in_progress_this_week": tasks_in_progress_this_week,
        "tasks_completed_this_week": tasks_completed_this_week,
        "tasks_urgent_today": tasks_urgent_today,
    }



# --------------------- Views (controller) ----------------------------

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "tasks/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        user = self.request.user

        tasks_qs = Task.objects.filter(created_by=user)
        tasks = list(tasks_qs)

        # 🔹 Use shared helper
        stats = compute_task_stats(tasks)

        # Python-side sorting: by due_date then created_at desc
        sorted_tasks = sorted(
            tasks,
            key=lambda t: (
                t.due_date or datetime.date.max,
                -t.created_at.timestamp() if t.created_at else 0,
            ),
        )

        context["username"] = user.username
        context["active_page"] = "tasks"
        context["tasks"] = sorted_tasks[:50]

        context["tasks_in_progress_this_week"] = stats["tasks_in_progress_this_week"]
        context["tasks_completed_this_week"] = stats["tasks_completed_this_week"]
        context["tasks_urgent_today"] = stats["tasks_urgent_today"]

        return context


# ------------------- Create a new task 
class TaskCreateApiView(LoginRequiredMixin, View):
    """
    Handle POST /tasks/api/tasks/create/ to create a new personal task.
    Returns JSON.
    """

    def post(self, request):
        user = request.user
        data = parse_request_data(request)

        title = (data.get("title") or "").strip()

        if not title:
            return JsonResponse(
                {
                    "success": False,
                    "errors": {"title": "This field is required."},
                },
                status=400,
            )

        # Optional fields with defaults
        task_type = data.get("task_type") or Task.TYPE_PERSONAL
        if task_type not in dict(Task.TASK_TYPE_CHOICES):
            task_type = Task.TYPE_PERSONAL

        status = data.get("status") or Task.STATUS_TODO
        if status not in dict(Task.STATUS_CHOICES):
            status = Task.STATUS_TODO

        priority = data.get("priority") or Task.PRIORITY_MID
        if priority not in dict(Task.PRIORITY_CHOICES):
            priority = Task.PRIORITY_MID

        raw_due = data.get("due_date")

        if raw_due:
            try:
                due_date = datetime.date.fromisoformat(raw_due)
            except ValueError:
                return JsonResponse(
                    {
                        "success": False,
                        "errors": {"due_date": "Invalid date format. Use YYYY-MM-DD."},
                    },
                    status=400,
                )
        else:
            due_date = None

        # Create a task strictly owned by this user
        task = Task.objects.create(
            task_type=task_type,
            title=title,
            description=(data.get("description") or "").strip(),
            created_by=user,
            assignee=user,
            status=status,
            priority=priority,
            due_date=due_date,
        )

        return JsonResponse(
            {"success": True, "task": serialize_task(task)},
            status=201,
        )

# ------------List the tasks in the dashboard 
class TaskListApiView(LoginRequiredMixin, View):
    """
    GET /tasks/api/tasks/
    Return all tasks created by the current user, optionally filtered
    by status and search query, ordered by due_date then created_at.
    """

    def get(self, request):
        user = request.user

        # Base queryset for this user
        base_qs = Task.objects.filter(created_by=user)

        # 🔹 Compute stats on ALL tasks (regardless of table filters)
        all_tasks = list(base_qs)
        stats = compute_task_stats(all_tasks)
        
        # Start from tasks created by this user only
        qs = Task.objects.filter(created_by=user)

        # Optional filters
        status = request.GET.get("status")
        query = request.GET.get("q")

        # Filter by status if it's a valid choice
        if status in dict(Task.STATUS_CHOICES):
            qs = qs.filter(status=status)

        # Simple title search
        if query:
            qs = qs.filter(Q(title__icontains=query))

        # Order by due_date then newest created_at
        qs = qs.order_by("due_date", "-created_at")

        # Serialize tasks (this now uses task.public_id as "id")
        tasks_data = [serialize_task(task) for task in qs]

        return JsonResponse(
            {
                "tasks": tasks_data,
                "count": len(tasks_data),
                "stats": stats,
            }
        )
    
# ----------------- Show the task's details
class TaskDetailApiView(LoginRequiredMixin, View):
    """
    GET /tasks/api/tasks/<pk>/
    Returns a single task as JSON, limited to tasks created by this user.
    """

    http_method_names = ["get"]

    def get(self, request, pk, *args, **kwargs):
        # 🔹 Only fetch tasks created by this user
        task = get_task_for_user_or_404(request.user, pk)
        task_data = serialize_task(task)

        return JsonResponse(
            {
                "ok": True,
                "task": task_data,
            }
        )

class TaskMarkCompleteApiView(LoginRequiredMixin, View):
    """
    POST /tasks/api/tasks/<public_id>/complete/
    From any status → mark as done (one-way).
    """

    http_method_names = ["post"]

    def post(self, request, public_id, *args, **kwargs):
        user = request.user

        qs = Task.objects.filter(created_by=user, public_id=public_id)
        row = qs.values("status").first()

        if not row:
            return JsonResponse(
                {"ok": False, "error": "Task not found."},
                status=404,
            )

        current_status = row["status"]

        # If already done, just return the current task
        if current_status == Task.STATUS_DONE:
            task = qs.first()
            return JsonResponse(
                {
                    "ok": True,
                    "task": serialize_task(task), # type: ignore
                }
            )

        # Otherwise: mark as done + set completed_at
        now = timezone.now()
        qs.update(status=Task.STATUS_DONE, completed_at=now)

        updated_task = qs.first()

        return JsonResponse(
            {
                "ok": True,
                "task": serialize_task(updated_task), # type: ignore
            }
        )
    
#--------------------- Update a Task
class TaskUpdateApiView(LoginRequiredMixin, View):
    """
    POST /tasks/api/tasks/<public_id>/update/
    Update selected fields of a task created by the current user.
    """

    http_method_names = ["post"]

    def post(self, request, public_id, *args, **kwargs):
        user = request.user
        data = parse_request_data(request)

        qs = Task.objects.filter(created_by=user, public_id=public_id)
        task = qs.first()

        if not task:
            return JsonResponse(
                {"success": False, "errors": {"__all__": "Task not found."}},
                status=404,
            )

        # ----- Title (required) -----
        title = (data.get("title") or "").strip()
        if not title:
            return JsonResponse(
                {
                    "success": False,
                    "errors": {"title": "This field is required."},
                },
                status=400,
            )

        # ----- Optional fields -----
        description = (data.get("description") or "").strip()

        priority = data.get("priority") or task.priority
        if priority not in dict(Task.PRIORITY_CHOICES):
            priority = task.priority

        status = data.get("status") or task.status
        if status not in dict(Task.STATUS_CHOICES):
            status = task.status

        raw_due = data.get("due_date")
        if raw_due:
            try:
                due_date = datetime.date.fromisoformat(raw_due)
            except ValueError:
                return JsonResponse(
                    {
                        "success": False,
                        "errors": {"due_date": "Invalid date format. Use YYYY-MM-DD."},
                    },
                    status=400,
                )
        else:
            due_date = None

        # ----- Apply update -----
        qs.update(
            title=title,
            description=description,
            priority=priority,
            status=status,
            due_date=due_date,
        )

        updated_task = qs.first()

        return JsonResponse(
            {
                "success": True,
                "task": serialize_task(updated_task), # type: ignore
            }
        )

# --------------------- Mark task as complete ------------------------
class TaskCompleteApiView(LoginRequiredMixin, View):
  def post(self, request, public_id):
      task = get_object_or_404(Task, public_id=public_id, created_by=request.user)

      if task.status == Task.STATUS_DONE:
          # Already done – just return current state
          stats = compute_task_stats(request.user)
          return JsonResponse(
              {"ok": True, "task": serialize_task(task), "stats": stats}
          )

      task.status = Task.STATUS_DONE
      task.save()

      stats = compute_task_stats(request.user)

      return JsonResponse(
          {
              "ok": True,
              "task": serialize_task(task),
              "stats": stats,
          }
      )
  

# --------------------------- Tip Views --------------------------
import random
from pathlib import Path

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from .models import Tip

# Helper to Load tips from tips_data.json in this app.
def load_tips_from_file():
    """
    Load tips from tips_data.json inside the tasks app.
    """
    app_dir = Path(__file__).resolve().parent
    tips_file = app_dir / "tips-data.json"

    if not tips_file.exists():
        return [
            {"category": "general", "text": "No tips file found yet."}
        ]

    with tips_file.open("r", encoding="utf-8") as f:
        return json.load(f)

# Render the tip in the page
@login_required
def tips_page(request):
    saved_tips = Tip.objects.filter(user=request.user)

    context = {
        "saved_tips": saved_tips,
        "active_page": "tips",
        "username": request.user.first_name or request.user.username,
    }
    return render(request, "tasks/tips_page.html", context)


#  Returns a random tip from JSON as JSON.
@login_required
@require_http_methods(["GET"])
def get_tip(request):
    """
    GET /tasks/api/tip/
    Returns a random tip from JSON as JSON.
    """
    tips = load_tips_from_file()
    tip = random.choice(tips) if tips else {"category": "general", "text": "No tips available."}

    return JsonResponse(
        {
            "ok": True,
            "tip": {
                "text": tip.get("text", "No tip text."),
                "category": tip.get("category", "general"),
            },
        }
    )

# ------------------ Save tip to the db --------------------
@login_required
@require_http_methods(["POST"])
def save_tip(request):
    """
    POST /tasks/api/tip/save/
    Save the currently shown tip text to the DB for this user.
    Body: JSON or form with 'text' and optional 'category'.
    """
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        data = request.POST

    text = (data.get("text") or "").strip()
    category = (data.get("category") or "").strip()

    if not text:
        return JsonResponse(
            {"ok": False, "error": "Tip text is required."},
            status=400,
        )

    tip = Tip.objects.create(
        user=request.user,
        text=text,
        category=category,
    )

    return JsonResponse(
        {
            "ok": True,
            "tip": {
                "id": tip.id, # type: ignore
                "text": tip.text,
                "category": tip.category,
                "created_at": tip.created_at.isoformat(),
            },
        },
        status=201,
    )

# Helper to delete a tip 
@login_required
@require_http_methods(["POST"])  # you can switch to DELETE if you want
def delete_tip(request, tip_id):
    """
    POST /tasks/api/tip/<tip_id>/delete/
    Hard delete a saved tip for this user.
    """
    deleted_count, _ = Tip.objects.filter(
        id=tip_id,
        user=request.user,
    ).delete()  # real delete

    if deleted_count == 0:
        return JsonResponse(
            {"ok": False, "error": "Tip not found."},
            status=404,
        )

    return JsonResponse({"ok": True})


