# accounts/forms.py
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordChangeForm

User = get_user_model()


class ProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["username"]  # add more if you want: "first_name", "last_name"
        widgets = {
            "username": forms.TextInput(
                attrs={
                    "class": "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm",
                    "placeholder": "Username",
                }
            )
        }


class CustomPasswordChangeForm(PasswordChangeForm):
    """
    Just to attach Tailwind-friendly widgets.
    You could also use PasswordChangeForm directly in the view.
    """

    old_password = forms.CharField(
        label="Current password",
        widget=forms.PasswordInput(
            attrs={
                "class": "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm",
                "autocomplete": "current-password",
            }
        ),
    )
    new_password1 = forms.CharField(
        label="New password",
        widget=forms.PasswordInput(
            attrs={
                "class": "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm",
                "autocomplete": "new-password",
            }
        ),
    )
    new_password2 = forms.CharField(
        label="Confirm new password",
        widget=forms.PasswordInput(
            attrs={
                "class": "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm",
                "autocomplete": "new-password",
            }
        ),
    )
