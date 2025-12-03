from django.urls import path
from . import views

app_name = "tasks"

urlpatterns = [
    # ------- This will return HTML page ------------
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),

    # -------- API endpoints that will return JSON not html----------

    # List / filter the tasks
    path("api/tasks/", views.TaskListApiView.as_view(), name="api_list"),

    # Create a new task
    path("api/tasks/create/", views.TaskCreateApiView.as_view(), name="api_create"),

    # Show single task's details
    path("api/tasks/<str:pk>/", views.TaskDetailApiView.as_view(), name="api_detail"),

    # Update the task status to complete
    path("api/tasks/<str:public_id>/complete/",views.TaskMarkCompleteApiView.as_view(), name="api_mark_complete",),

    # Update a task
    path("api/tasks/<str:public_id>/update/", views.TaskUpdateApiView.as_view(), name="api_update"),

    # # Change status from the list directly
    # path("api/tasks/<str:pk>/status/", views.TaskStatusApiView.as_view(), name="api_status"),

    # Delete a task
    # path("api/tasks/<str:public_id>/delete/", views.TaskDeleteApiView.as_view(), name="api_delete"),
]