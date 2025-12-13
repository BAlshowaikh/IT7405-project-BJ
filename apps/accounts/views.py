
# # NOTES:
# # login, logout → Django’s built-in functions to log users in/out.
# # AuthenticationForm → Django’s built-in login form (username + password)
# # UserCreationForm -> Django’s built-in signup form
# # User → default Django user model.
# # reverse_lazy → used in CBVs for redirect URLs (resolved lazily at runtime).
# # FormView → generic CBV for forms (we use it for login & signup).
# # View → base class for simple custom views (we use it for logout).

from typing import Any
from django.http import HttpRequest
from django.http.response import HttpResponse as HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.forms import AuthenticationForm
from django.urls import reverse_lazy
from django.views.generic import FormView, View
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .forms import CustomUserCreationForm, ProfileForm, CustomPasswordChangeForm


# --------------------- Sign Up view -----------------------
class SignUpView(FormView):
    template_name = "accounts/signup.html"
    form_class = CustomUserCreationForm  # use my custom form here
    success_url = reverse_lazy("accounts:login")

    def dispatch(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        """
        If the user is already logged in, redirect them away from signup page
        """
        if request.user.is_authenticated:
            return redirect("tasks:dashboard")
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form: Any) -> HttpResponse:
        """
        CustomUserCreationForm will handle validation & user creation.
        """
        form.save()
        return super().form_valid(form)


# --------------------- Signin view -----------------------
class SignInView(FormView):
    template_name = "accounts/login.html"
    form_class = AuthenticationForm
    success_url = reverse_lazy("tasks:dashboard")

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if request.user.is_authenticated:
            return redirect("tasks:dashboard")
        return super().dispatch(request, *args, **kwargs)

    def get_success_url(self) -> str:
        next_url = self.request.GET.get("next") or self.request.POST.get("next")
        if next_url:
            return next_url
        return super().get_success_url()

    def form_valid(self, form):
        user = form.get_user()
        login(self.request, user)
        return super().form_valid(form)


def landing_page(request):
    return render(request, "accounts/landing.html")


class LogoutView(View):
    def get(self, request, *args, **kwargs):
        logout(request)
        return redirect("landing")

@login_required
def profile_view(request):
    user = request.user

    # Always start with "base" forms so they are definitely defined
    profile_form = ProfileForm(instance=user)
    password_form = CustomPasswordChangeForm(user=user)

    if request.method == "POST":
        # Which form was submitted?
        if "profile_submit" in request.POST:
            profile_form = ProfileForm(request.POST, instance=user)
            if profile_form.is_valid():
                profile_form.save()
                messages.success(request, "Profile updated successfully.")
                return redirect("accounts:profile")

        elif "password_submit" in request.POST:
            password_form = CustomPasswordChangeForm(user=user, data=request.POST)
            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)  # keep user logged in
                messages.success(request, "Password changed successfully.")
                return redirect("accounts:profile")

        # If POST without either key, we just fall through and re-render
        # with the original forms + any validation errors (if any).

    return render(
        request,
        "accounts/profile.html",
        {
            "profile_form": profile_form,
            "password_form": password_form,
        },
    )