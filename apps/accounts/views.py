
# NOTES:
# login, logout → Django’s built-in functions to log users in/out.
# AuthenticationForm → Django’s built-in login form (username + password)
# UserCreationForm -> Django’s built-in signup form
# User → default Django user model.
# reverse_lazy → used in CBVs for redirect URLs (resolved lazily at runtime).
# FormView → generic CBV for forms (we use it for login & signup).
# View → base class for simple custom views (we use it for logout).

from typing import Any
from django.http import HttpRequest
from django.http.response import HttpResponse as HttpResponse
from django.shortcuts import render
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import FormView, View


# Sign Up view
# First, this class will inherite from the built in "FormView" class
class SignUpView(FormView):
    template_name = "accounts/signup.html"
    form_class = UserCreationForm # This class will handle the validation and creation for the user
    success_url = reverse_lazy("accounts:login")

    # ------------------ The folloing code will override methods inside the inheritend class "FormView"
    # dispatch is built-in on Django’s View class and inherited by all CBVs (FormView, DetailView)
    # It takes the incoming HTTP request.
    # Checks the HTTP method (GET, POST, PUT, etc.).
    # Calls the appropriate method on your view (get(), post(), etc.).
    # request comes in → dispatch() decides → calls get() or post()
    # "Before you do your normal method-routing logic, let me add a check."

    def dispatch(self, request:HttpRequest, *args, **kwargs) -> HttpResponse:
        """
            If the user is alrady logged in, just redirect them away from signup page
        """
        if request.user.is_authenticated:
            return redirect("tasks:dashboard")
        return super().dispatch(request, *args, **kwargs)
    
    def form_valid(self, form: Any) -> HttpResponse:
        """
        The built in class UserCreationForm will handle eveything we have only to save the user
        """
        form.save()
        # What does Django’s default form_valid do?
        # For FormView, it:
        # Redirects to success_url (or get_success_url()).
        return super().form_valid(form)
    

# --------------------- Signin view -----------------------
class SignInView(FormView):
    template_name = "accounts/login.html"
    form_class = AuthenticationForm
    success_url = reverse_lazy("tasks:dashboard")

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        """
        Already logged-in users should not see the login page.
        """
        if request.user.is_authenticated:
            return redirect("tasks:dashboard")
        return super().dispatch(request, *args, **kwargs)
    
    def get_success_url(self) -> str:
        """
        If login page was reached because of @login_required,
        redirect back to ?next=...
        """
        
        # IMPORTNAT NOTES FOR "next"
        #next is a URL parameter used by Django’s login system. 
        # Whenever a user tries to open a protected page that requires authentication — like:
        # /tasks/5/edit/
        # But the user is NOT logged in, Django automatically redirects them to:
        # /accounts/login/?next=/tasks/5/edit/

        # next = “Where I wanted to go before login”
        #Smart redirect behavior:
        # If user was sent to login because they tried accessing a protected page
        # → take them back to THAT PAGE.
        # If user went to login page manually
        # → take them to dashboard.

        next_url = self.request.GET.get("next") or self.request.POST.get("next")
        if next_url:
            return next_url
        return super().get_success_url() # Go to the success_url where u have defined the path
    
    def form_valid(self, form):
        """
        AuthenticationForm gives us the logged-in user.
        """
        user = form.get_user()
        login(self.request, user)
        return super().form_valid(form)

# --------------------- Landing function -----------------------
def landing_page(request):
    return render(request, "accounts/landing.html")

# --------------------- Logout view -----------------------
class LogoutView(View):
    def get(self, request, *args, **kwargs):
        logout(request)
        return redirect("landing")
