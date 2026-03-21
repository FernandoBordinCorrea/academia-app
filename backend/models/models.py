from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    password = Column(String, nullable=False)
    weight = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exercises = relationship("Exercise", back_populates="owner")
    workouts = relationship("Workout", back_populates="owner")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="exercises")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="workouts")
    items = relationship("WorkoutExercise", back_populates="workout", order_by="WorkoutExercise.order", cascade="all, delete-orphan")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    order = Column(Integer, nullable=False)

    workout = relationship("Workout", back_populates="items")
    exercise = relationship("Exercise")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    calories_burned = Column(Float, nullable=True)
    performed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    workout = relationship("Workout")
    logs = relationship("SessionExerciseLog", back_populates="session", cascade="all, delete-orphan")


class SessionExerciseLog(Base):
    __tablename__ = "session_exercise_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    weight_used = Column(Float, nullable=False)
    reps_used = Column(Integer, nullable=True)

    session = relationship("WorkoutSession", back_populates="logs")
    exercise = relationship("Exercise")
