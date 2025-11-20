# Healthcare Appointment Management System

A full-stack web application for managing hospital appointments, patients, doctors, and medical services. Built with FastAPI backend and React frontend, featuring JWT authentication, role-based access control, and a modern responsive UI.

## Features

### Patient Features
- User registration and authentication
- Book appointments with doctors
- View and manage personal appointments
- Browse available doctors and services
- Update profile information

### Admin Features
- Dashboard with system overview
- Manage patients, doctors, and services
- Approve/reject appointment requests
- Track appointment services and billing
- Complete CRUD operations on all entities

### System Features
- JWT-based authentication with refresh tokens
- Role-based access control (Admin/Patient)
- Multiple doctors per appointment
- Service tracking and pricing
- Appointment status management (pending, approved, rejected, canceled, done)

## Tech Stack

### Backend
- **Framework:** FastAPI 0.116.1
- **Database:** MySQL with Azure support
- **ORM:** SQLAlchemy 2.0
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt
- **Python:** 3.12+

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Form Handling:** React Hook Form + Yup validation
- **HTTP Client:** Axios
- **UI Components:** Headless UI, Framer Motion, React Icons

## Database Schema

### Main Entities

- **Admins**: System administrators with authentication
- **Patients**: Patient records with authentication and profile data
- **Doctors**: Medical staff with specializations and roles (main/assistant)
- **Appointments**: Scheduled patient visits with status tracking
- **Services**: Medical procedures/services with pricing
- **RefreshTokens**: JWT refresh token storage

### Relationships

- **AppointmentDoctor**: Many-to-many between appointments and doctors
- **DoctorService**: Many-to-many between doctors and services
- **AppointmentDoctorService**: Services performed during specific appointments

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # Database configuration
│   ├── auth.py              # Authentication utilities
│   ├── auth_routes.py       # Login/register endpoints
│   ├── patient.py           # Patient CRUD endpoints
│   ├── doctors.py           # Doctor CRUD endpoints
│   ├── appointment.py       # Appointment CRUD endpoints
│   ├── services.py          # Service CRUD endpoints
│   ├── init_db.py           # Database initialization script
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API service layer
│   │   ├── context/         # React context providers
│   │   └── App.jsx          # Main application component
│   ├── package.json
│   └── .env.example
│
└── startup.sh               # Azure deployment startup script
```

## Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- MySQL database
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Website-implementation-with-FastAPI
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create .env file with database configuration
export DATABASE_URL="mysql+pymysql://user:password@localhost:3306/healthcare_db"

# Initialize database
python init_db.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Update .env with your API URL
# VITE_API_URL=http://localhost:8000
```

## Running the Application

### Development Mode

**Backend:**
```bash
# From project root
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
# From frontend directory
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/` and are automatically served by FastAPI in production.

**Backend:**
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

### Backend
- `DATABASE_URL`: MySQL connection string (required)
  - Format: `mysql+pymysql://user:password@host:port/database`
  - Azure format: Include SSL configuration for Azure MySQL

### Frontend
- `VITE_API_URL`: Backend API base URL
  - Development: `http://localhost:8000`
  - Production: Your deployed backend URL

## API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new patient
- `POST /api/auth/login` - Login (admin/patient)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

**Patients:**
- `GET /api/patients` - List patients (admin)
- `GET /api/patients/{id}` - Get patient details
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient (admin)

**Doctors:**
- `GET /api/doctors` - List doctors
- `POST /api/doctors` - Create doctor (admin)
- `PUT /api/doctors/{id}` - Update doctor (admin)
- `DELETE /api/doctors/{id}` - Delete doctor (admin)

**Appointments:**
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Delete appointment

**Services:**
- `GET /api/services` - List services
- `POST /api/services` - Create service (admin)
- `PUT /api/services/{id}` - Update service (admin)
- `DELETE /api/services/{id}` - Delete service (admin)

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived token for API requests (included in Authorization header)
- **Refresh Token**: Long-lived token for obtaining new access tokens
- **Role-based Access**: Admin and Patient roles with different permissions

### Default Admin Credentials

After running `init_db.py` (if admin creation is enabled):
- Username: `admin`
- Password: `ChangeThisPassword123!`

**⚠️ Important:** Change the default password immediately after first login.

## Deployment

The application is configured for Azure App Service deployment:

1. **Backend**: FastAPI serves both API and static frontend files
2. **Startup Script**: `startup.sh` configures the uvicorn server
3. **CORS**: Configured to allow frontend access
4. **Database**: Supports Azure MySQL with SSL

### Azure Deployment Steps

1. Create Azure App Service (Python 3.12)
2. Create Azure MySQL Flexible Server
3. Configure environment variables in App Service
4. Deploy code via Git or Azure CLI
5. Run `python init_db.py` to initialize database

## License

This project is for educational purposes.