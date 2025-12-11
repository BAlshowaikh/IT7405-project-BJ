from django.urls import path

# Import the views (controller) from the views file inside account folder
from .views import SignUpView, SignInView, LogoutView, landing_page

# So the main route will start with "accounts"
app_name = "accounts"

# NOTES:
# NOTE NO1: The name "urlpatterns" is a MUST When Django's URL resolver loads your application's urls.py file,
#  it specifically searches for a list or tuple named urlpatterns

# NOTE NO2: The "as_view()" method converts the Views (because they are classes in general) into a callable function 
# that will fire whenever the path is being visited

# NOTE NO3: Instead of hardcoding the URL path (like /accounts/signup/) in your 
# templates and views, you use this nickname "name" (like "signup").
urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    path("login/", SignInView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
