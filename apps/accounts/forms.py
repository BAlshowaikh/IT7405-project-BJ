from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm

User = get_user_model()


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={
                "class": "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm",
                "placeholder": "you@example.com",
            }
        ),
    )

    class Meta(UserCreationForm.Meta):  # type: ignore
        model = User
        # we want username + email (password1/2 come from UserCreationForm)
        fields = ("username", "email")

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("This email is already in use.")
        return email


class ProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["username", "email"]
        widgets = {
            "username": forms.TextInput(
                attrs={
                    "class": "block w-full rounded-md border border-slate-500/60 bg-white "
                             "px-3 py-2 text-slate-900 text-sm "
                             "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
                    "placeholder": "Username",
                    "autocomplete": "username",
                }
            ),
            "email": forms.EmailInput(
                attrs={
                    "class": "block w-full rounded-md border border-slate-500/60 bg-white "
                             "px-3 py-2 text-slate-900 text-sm "
                             "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
                    "placeholder": "you@example.com",
                    "autocomplete": "email",
                }
            ),
        }

    # Make sure new username is unique (except for current user)
    def clean_username(self):
        username = self.cleaned_data.get("username")
        qs = User.objects.filter(username__iexact=username).exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("This username is already in use.")
        return username

    # Make sure new email is unique (except for current user)
    def clean_email(self):
        email = self.cleaned_data.get("email")
        if not email:
            raise forms.ValidationError("Email is required.")
        qs = User.objects.filter(email__iexact=email).exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("This email is already in use.")
        return email


class CustomPasswordChangeForm(PasswordChangeForm):
    old_password = forms.CharField(
        label="Current password",
        widget=forms.PasswordInput(
            attrs={
                "class": "block w-full rounded-md border border-slate-500/60 bg-white "
                         "px-3 py-2 text-slate-900 text-sm "
                         "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
                "autocomplete": "current-password",
            }
        ),
    )
    new_password1 = forms.CharField(
        label="New password",
        widget=forms.PasswordInput(
            attrs={
                "class": "block w-full rounded-md border border-slate-500/60 bg-white "
                         "px-3 py-2 text-slate-900 text-sm "
                         "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
                "autocomplete": "new-password",
            }
        ),
    )
    new_password2 = forms.CharField(
        label="Confirm new password",
        widget=forms.PasswordInput(
            attrs={
                "class": "block w-full rounded-md border border-slate-500/60 bg-white "
                         "px-3 py-2 text-slate-900 text-sm "
                         "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
                "autocomplete": "new-password",
            }
        ),
    )