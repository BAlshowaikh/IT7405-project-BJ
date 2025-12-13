# IT7405-project-

# CoHub – Personal Task Management Web Application

CoHub is a web-based task management application developed using **Python, Django, and MongoDB**. The system allows users to manage personal tasks, track productivity, and save helpful tips, with a clean and responsive user interface.

This project was developed as part of a university coursework to demonstrate NoSQL database usage, Django architecture, and full-stack web application development.

---

## 🚀 Features

- User authentication (signup, login, logout)
- Create, view, update, and delete personal tasks
- Task prioritization, status tracking, and deadlines
- Dashboard with task statistics
- Productivity tips generation and management
- User profile management (update username, email, password)
- Responsive and user-friendly UI

---

## 🛠️ Technologies Used

### Backend
- Python
- Django 3.2
- Djongo (MongoDB integration)
- MongoDB (Atlas / Local)
- Django ORM (used as Object–Document Mapper)

### Frontend
- Tailwind CSS
- Django Template Language (DTL)
- JavaScript (Fetch API)
- Iconify CDN

### Tools
- Conda (virtual environment)
- Git & GitHub

---

## 📁 Project Structure

COHUB/
├── apps/
│   ├── accounts/        # Authentication & profile management
│   ├── tasks/           # Task & productivity tips logic
│   ├── projects/        # Project models (future use)
├── core/                # Django configuration
├── static/              # Static files (CSS, JS, icons)
├── templates/           # Base templates and partials
├── manage.py
├── requirements.txt
└── README.md

---

## 🧩 Architecture

The application follows Django’s **Model–View–Template (MVT)** architecture:

- **Models** define MongoDB document structures (Task, Tip)
- **Views** handle business logic using class-based and function-based views
- **Templates** render dynamic HTML using Django Template Language

Djongo enables Django models to map directly to MongoDB documents, allowing seamless NoSQL integration.

---

## ⚙️ Setup & Installation

### 1. Clone the repository
git clone https://github.com/your-username/cohub.git
cd cohub

### 2. Create & activate Conda environment
conda create -n cohub_env python=3.x
conda activate cohub_env

### 3. Install dependencies
pip install -r requirements.txt

### 4. Configure environment variables
Create a .env file in the project root:

MONGODB_ATLAS_URI=your_mongodb_atlas_uri
MONGODB_LOCAL_URI=mongodb://localhost:27017/

### 5. Run migrations
python manage.py makemigrations
python manage.py migrate

### 6. Start the development server
python manage.py runserver

Access the application at:
http://127.0.0.1:8000/

---

## 🗄️ Database

- MongoDB is used as the NoSQL database
- Reference-based data modeling is applied
- Indexes are used to optimize frequent queries
- Djongo acts as the ODM layer

---

## 🔐 Admin Panel

Django Admin is enabled for development and testing purposes.

Access:
/admin

---

## 📽️ Project Demonstration Video

A professional demo video showcasing the problem statement, motivation, design, implementation, database connectivity, and system functionality is available at:

Video Link: (add link here)

---

## 🧠 Challenges & Learning

- Integrating Django class-based views with Djongo
- Designing a flexible task model supporting both personal and future project tasks
- Handling MongoDB document identifiers within Django
- Ensuring clean separation of concerns using MVT architecture

---

## 🔮 Future Enhancements

- Project collaboration features
- Task assignment between users
- Team dashboards and progress tracking
- Notifications and reminders
- Role-based access control

---

## 👩‍💻 Author
@BAlshowaikh

---

## 📄 License
This project is developed for educational purposes.
