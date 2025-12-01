# # NOTES:
# # LoginRequiredMixin: Will check if the user is logged in or not, 
# # If user is not logged in → Django automatically redirects to your login page.
# # Once logged in, they land in the dashboard page.


# import json # parse JSON from fetch requests and handle dates
# import datetime # parse JSON from fetch requests and handle dates

# from django.contrib.auth.mixins import LoginRequiredMixin
# from django.contrib.auth import get_user_model
# from django.db.models import Q # build complex filters like “created_by = user OR assignee = user”
# from django.http import JsonResponse # send JSON back to the frontend
# from django.shortcuts import get_object_or_404 # fetch a task or return 404 if not found (security).
# from django.utils import timezone #compare dates correctly based on my timezone settings.
# from django.views import View
# from django.views.generic import TemplateView
# from .models import Task
# from apps.projects.models import ProjectMembership

# User = get_user_model()

# # ------------ Helper functions ------------
# def task_query_for_user(user):
#     """
#     Return all tasks the user is allowed to see:
#     - tasks they created
#     - tasks assigned to them
#     - tasks belonging to projects where they are an active member

#     This avoids Djongo-unfriendly JOINs like project__memberships__user.
#     """

#     # 1) First query: What projects is this user a member of?
#     member_project_ids = ProjectMembership.objects.filter(
#         user=user,
#         is_active=True,
#     ).values_list("project_id", flat=True)

#     # 2) Second query: Tasks where:
#     #    - created_by = user OR
#     #    - assignee = user OR
#     #    - project_id in that list
#     # This is much easier for Djongo to translate.
#     return Task.objects.filter(
#         Q(created_by=user)
#         | Q(assignee=user)
#         | Q(project_id__in=list(member_project_ids))
#     )

# # Fetch a single task
# def get_task_for_user_or_404(user, pk):
#     """
#     Fetch a single task that belongs to / involves this user.
#     Raises 404 if the task doesn't exist or isn't accessible.
#     """
#     # The qs stands for queryset which is in django a 
#     # not a collection of Task objects yet. It's a powerful object representing the SQL query
#     # that will eventually retrieve the data. It's often called a "promise"
#     qs = task_query_for_user(user)
#     return get_object_or_404(qs, pk=pk)

# # Function to parse JSON and form post requests
# def parse_request_data(request):
#     """
#     In case of receiving data, it will handle both the JSON or POST formate.
#     """
#     content_type = request.headers.get("Content-Type", "")

#     # In case of json data
#     if "application/json" in content_type:
#         try:
#             # This will return a python object 
#             return json.loads(request.body.decode("utf-8")) # 
#         except json.JSONDecodeError:
#             return {}
        
#     # In case a POST method received
#     return request.POST.dict()

# # Function to only return the id and username from the User object
# # So Instead of exposing sensitive fields: password hash, email, staff status, last login, permissions
# def serialize_user(user):
#     """
#     Simplified representation of a user for JSON responses.
#     """
#     if not user:
#         return None
#     return {
#         "id": user.pk,
#         "username": user.get_username(),
#     }

# # Converts the entire Task model into a dict the frontend can use
# def serialize_task(task: Task):
#     """
#     Convert a Task instance into a JSON-safe dict.
#     This is what your frontend will receive.
#     """
#     return {
#         "id": str(task.pk),
#         "title": task.title,
#         "description": task.description,
#         "task_type": task.task_type,
#         "status": task.status,
#         "priority": task.priority,
#         "due_date": task.due_date.isoformat() if task.due_date else None,
#         "completed_at": task.completed_at.isoformat() if task.completed_at else None,
#         "created_at": task.created_at.isoformat() if task.created_at else None,
#         "updated_at": task.updated_at.isoformat() if task.updated_at else None,
#         "project": {
#             # Djongo + Django dynamically creates reverse attributes (for FK)
#             # project_id exists at runtime because Django automatically creates <fieldname>_id.
#             # We added type:ignore because the editor doesn't know and can't see Foriegn entity fields 
#             "id": task.project.id, # type: ignore
#             "name": task.project.name, # type: ignore
#         } if task.project else None, # type: ignore
#         "created_by": serialize_user(task.created_by),
#         "assignee": serialize_user(task.assignee),
#     }

    

# # --------------------- Views (controller) ----------------------------
# class DashboardView(LoginRequiredMixin, TemplateView):
#     template_name = "tasks/dashboard.html"

#     def get_context_data(self, **kwargs):
#         """
#         Simple version:
#         - Only tasks created by the current user.
#         - Stats computed in Python.
#         """
#         context = super().get_context_data(**kwargs)

#         user = self.request.user

        
#         tasks_qs = Task.objects.filter(created_by=user)
#         tasks = list(tasks_qs)

#         today = timezone.localdate()
#         start_of_week = today - datetime.timedelta(days=today.weekday())

#         tasks_in_progress_this_week = 0
#         tasks_completed_this_week = 0
#         tasks_urgent_today = 0

#         for task in tasks:
#             created_date = task.created_at.date() if task.created_at else None
#             due_date = task.due_date

#             if created_date and start_of_week <= created_date <= today:
#                 if task.status == Task.STATUS_IN_PROGRESS:
#                     tasks_in_progress_this_week += 1
#                 elif task.status == Task.STATUS_DONE:
#                     tasks_completed_this_week += 1

#             if (
#                 due_date == today
#                 and task.status in [Task.STATUS_TODO, Task.STATUS_IN_PROGRESS]
#             ):
#                 tasks_urgent_today += 1

#         sorted_tasks = sorted(
#             tasks,
#             key=lambda t: (
#                 t.due_date or datetime.date.max,
#                 -t.created_at.timestamp() if t.created_at else 0,
#             ),
#         )

#         context["username"] = user.username
#         context["active_page"] = "tasks"
#         context["tasks"] = sorted_tasks[:50]

#         context["tasks_in_progress_this_week"] = tasks_in_progress_this_week
#         context["tasks_completed_this_week"] = tasks_completed_this_week
#         context["tasks_urgent_today"] = tasks_urgent_today

#         return context

    
# # ------ Create a class to handle the add task creation api -------
# # This class will handle the POST requests and will return JSON
# class TaskCreateApiView(LoginRequiredMixin, View):
#     # Override the POST method 
#     def post(self, request):
#         user = request.user
#         data =  parse_request_data(request) # This will let us access the data through data.get("key name")

#         # Make title required 
#         title = (data.get("title") or "").strip() # Get the title and remove whitespaces from beginning and end

#         # check if the user provided the title field or not
#         if not title:
#             return JsonResponse(
#                 {
#                     "success": False, 
#                     "errors": {"title": "This field is required."}
#                 },
#                 status=400
#             )
        
#         # Set the other fields as optional and defaults values
#         task_type = data.get("task_type") or Task.TYPE_PERSONAL
#         # Double check if the task type is from the defined dict or not
#         if task_type not in dict(Task.TASK_TYPE_CHOICES):
#             task_type = Task.TYPE_PERSONAL

#         status = data.get("status") or Task.STATUS_TODO
#         # Double check if the status is from the defined dict or not
#         if status not in dict(Task.STATUS_CHOICES):
#             status = Task.STATUS_TODO

#         priority = data.get("priority") or Task.PRIORITY_MID
#         # Double check if the priority is from the defined dict or not
#         if priority not in dict(Task.PRIORITY_CHOICES):
#             priority = Task.PRIORITY_MID

#         raw_due = data.get("due_date")

#         # Parse the due date
#         if raw_due:
#             try:
#                 due_date = datetime.date.fromisoformat(raw_due)
#             except ValueError:
#                 return JsonResponse(
#                     {
#                         "success": False,
#                         "errors": {"due_date": "Invalid date format. Use YYYY-MM-DD."},
#                     },
#                     status=400,
#                 )
#         else:
#             due_date = None

#         # Create the task and return a JSON 
#         task = Task.objects.create(
#             task_type=task_type,  # or Task.TYPE_PERSONAL if you skipped dynamic
#             title=title,
#             description=(data.get("description") or "").strip(),
#             created_by=user,
#             assignee=user, 
#             status=status,
#             priority=priority,
#             due_date=due_date,
#         )

#         return JsonResponse(
#             {"success": True, "task": serialize_task(task)},
#             status=201,
#         )
    
# # ------- Class to handle filteration for the tasks ---------
# class TaskListApiView(LoginRequiredMixin, View):
#     # Override the get method
#     def get(self, request):
#         user = request.user

#         # Start from all the tasks 
#         qs = task_query_for_user(user) # Get the queryset of the user's tasks

#         # Read query parameters from the url
#         status = request.GET.get("status") # For "All, Complete, In Progress" filter
#         query = request.GET.get("q") # For search filter

#         # Apply filteration after checking the validation

#         # Only if status is one of the status choices then filter
#         if status in dict(Task.STATUS_CHOICES):
#             qs = qs.filter(status=status)

#         # If the query isn't empty, apply also a serach filter
#         if query:
#             qs = qs.filter(
#                 Q(title__icontains=query)
#             )

#         # Order by
#         qs = qs.order_by("due_date", "-created_at")

#         # Turn each task into a dict , this will return a list of objects -dictionaries-
#         tasks_data = [serialize_task(task) for task in qs]

#         # Return the JSON response
#         return JsonResponse(
#             {
#                 "tasks": tasks_data,
#                 "count": len(tasks_data)
#             }
#         )

# # ------- Class to show a single tasks's details ---------
# class TaskDetailApiView(LoginRequiredMixin, View):
#     """
#     GET /tasks/api/tasks/<pk>/
#     Returns a single task as JSON, limited to tasks the user can see.
#     """

#     http_method_names = ["get"]

#     def get(self, request, pk, *args, **kwargs):
#         #Use  existing helper which already applies the safe queryset
#         task = get_task_for_user_or_404(request.user, pk)

#         task_data = serialize_task(task)

#         return JsonResponse(
#             {
#                 "ok": True,
#                 "task": task_data,
#             }
#         )

# NOTES:
# LoginRequiredMixin: Will check if the user is logged in or not,
# If user is not logged in → Django automatically redirects to your login page.
# Once logged in, they land in the dashboard page.

import json  # parse JSON from fetch requests and handle dates
import datetime  # parse JSON from fetch requests and handle dates

from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import get_user_model
from django.db.models import Q  # used for simple title__icontains search
from django.http import JsonResponse  # send JSON back to the frontend
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


def get_task_for_user_or_404(user, pk):
    """
    Fetch a single task created by this user.
    Raises 404 if the task doesn't exist or isn't created by this user.
    """
    # Simple, Djongo-friendly query: WHERE created_by_id = user.id AND pk = pk
    return get_object_or_404(Task, pk=pk, created_by=user)


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
    raw_id = getattr(task, "_id", None) or task.pk
    task_id = str(raw_id) if raw_id is not None else ""
    return {
        "id": task_id,
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


# --------------------- Views (controller) ----------------------------

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "tasks/dashboard.html"

    def get_context_data(self, **kwargs):
        """
        Simple version:
        - Only tasks created by the current user.
        - Stats computed in Python.
        """
        context = super().get_context_data(**kwargs)

        user = self.request.user

        # 🔹 Only tasks created by this user (Djongo-safe)
        tasks_qs = Task.objects.filter(created_by=user)
        tasks = list(tasks_qs)

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

        context["tasks_in_progress_this_week"] = tasks_in_progress_this_week
        context["tasks_completed_this_week"] = tasks_completed_this_week
        context["tasks_urgent_today"] = tasks_urgent_today

        return context


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

        # 🔹 Create a task strictly owned by this user
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


class TaskListApiView(LoginRequiredMixin, View):
    """
    GET /tasks/api/tasks/
    Return a JSON list of tasks, only those created by the current user,
    with optional status + search filters.
    """

    def get(self, request):
        user = request.user

        # 🔹 Only tasks created by this user
        qs = task_query_for_user(user)

        # Filters from query params
        status = request.GET.get("status")  # "todo", "done", etc.
        query = request.GET.get("q")  # search text

        if status in dict(Task.STATUS_CHOICES):
            qs = qs.filter(status=status)

        if query:
            qs = qs.filter(Q(title__icontains=query))

        # Order by due_date then -created_at
        qs = qs.order_by("due_date", "-created_at")

        tasks_data = [serialize_task(task) for task in qs]

        return JsonResponse(
            {
                "tasks": tasks_data,
                "count": len(tasks_data),
            }
        )


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