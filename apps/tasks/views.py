# NOTES:
# LoginRequiredMixin: Will check if the user is logged in or not, 
# If user is not logged in → Django automatically redirects to your login page.
# Once logged in, they land in the dashboard page.

from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView

# Create your views here.
class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "tasks/dashboard.html"

    def get_context_data(self, **kwargs):
        """
        Add anything the template needs.
        For now:
        - username for the heading
        - active_page for highlighting the sidebar item
        """
        context = super().get_context_data(**kwargs)
        context["username"] = self.request.user.username
        context["active_page"] = "tasks"  # this will highlight "My Tasks" in sidebar
        return context