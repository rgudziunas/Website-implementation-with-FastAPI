A RESTful API for managing hospital appointments, patients, doctors, and medical services built with FastAPI and SQLAlchemy.
Features

Patient Management: CRUD operations for patient records
Doctor Management: Manage doctors with specializations and roles (main/assistant)
Appointment System: Schedule and manage appointments with multiple doctors
Service Management: Track medical services and link them to doctors
Appointment Services: Record which services were performed during appointments

Tech Stack

Framework: FastAPI
Database: MySQL
ORM: SQLAlchemy 2.0
Python: 3.12+

Database Schema
Main Entities

Admins: System administrators
Patients: Patient records with authentication
Doctors: Medical staff with specializations
Appointments: Scheduled patient visits
Services: Medical procedures/services
AppointmentDoctor: Many-to-many relationship between appointments and doctors
DoctorService: Many-to-many relationship between doctors and services
AppointmentDoctorService: Services performed during appointments# Website-implementation-with-FastAPIc