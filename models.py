# models.py
from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Integer, String, DateTime, ForeignKey, Enum as SqlEnum,
    Boolean, Numeric, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from database import Base

# ---------- Enums ----------
class AppointmentStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    canceled = "canceled"
    done = "done"

class DoctorRole(str, Enum):
    main = "main"
    assistant = "assistant"

# ---------- Admins ----------
class Admin(Base):
    __tablename__ = "admins"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

# ---------- Patients ----------
class Patient(Base):
    __tablename__ = "patients"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30))
    birth_date: Mapped[str | None] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )

# ---------- Doctors ----------
class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    specialization: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(120), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    role: Mapped[DoctorRole] = mapped_column(SqlEnum(DoctorRole), nullable=False, default=DoctorRole.main)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # link to appointments (unchanged)
    appointments: Mapped[list["AppointmentDoctor"]] = relationship(
        "AppointmentDoctor", back_populates="doctor", cascade="all, delete-orphan"
    )

    # NEW: many-to-many to services via DoctorService
    service_links: Mapped[list["DoctorService"]] = relationship(
        "DoctorService", back_populates="doctor", cascade="all, delete-orphan"
    )
    services: Mapped[list["Service"]] = relationship(
        "Service", secondary="doctor_services", back_populates="doctors",
        overlaps="service_links"
    )

# ---------- Appointments ----------
class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    status: Mapped[AppointmentStatus] = mapped_column(SqlEnum(AppointmentStatus), nullable=False, default=AppointmentStatus.pending)
    notes: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    doctors: Mapped[list["AppointmentDoctor"]] = relationship(
        "AppointmentDoctor", back_populates="appointment", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("idx_appt_patient_time", "patient_id", "start_at"),)

# ---------- Services ----------
class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    price: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    performed_items: Mapped[list["AppointmentDoctorService"]] = relationship(
        "AppointmentDoctorService", back_populates="service", cascade="all, delete-orphan"
    )

    # NEW: backref for doctor m:n
    doctor_links: Mapped[list["DoctorService"]] = relationship(
        "DoctorService", back_populates="service", cascade="all, delete-orphan"
    )
    doctors: Mapped[list["Doctor"]] = relationship(
        "Doctor", secondary="doctor_services", back_populates="services",
        overlaps="service_links"
    )

# ---------- Join: many doctors per appointment ----------
class AppointmentDoctor(Base):
    __tablename__ = "appointment_doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    appointment: Mapped["Appointment"] = relationship("Appointment", back_populates="doctors")
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="appointments")

    services: Mapped[list["AppointmentDoctorService"]] = relationship(
        "AppointmentDoctorService", back_populates="appointment_doctor", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("appointment_id", "doctor_id", name="uq_appt_doctor"),)

# ---------- NEW: Doctor <-> Service (M:N) ----------
class DoctorService(Base):
    __tablename__ = "doctor_services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="service_links", overlaps="doctors,services")
    service: Mapped["Service"] = relationship("Service", back_populates="doctor_links", overlaps="doctors,services")

    __table_args__ = (
        UniqueConstraint("doctor_id", "service_id", name="uq_doctor_service"),
    )  # Note the trailing comma to make it a tuple

# ---------- What a doctor did during an appointment ----------
class AppointmentDoctorService(Base):
    __tablename__ = "appointment_doctor_services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    appointment_doctor_id: Mapped[int] = mapped_column(ForeignKey("appointment_doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    appointment_doctor: Mapped["AppointmentDoctor"] = relationship("AppointmentDoctor", back_populates="services")
    service: Mapped["Service"] = relationship("Service", back_populates="performed_items")

    __table_args__ = (Index("idx_ads_apptdoc_service", "appointment_doctor_id", "service_id"),)
