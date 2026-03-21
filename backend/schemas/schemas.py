from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# --- User ---

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    confirmpassword: str
    weight: float
    gender: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    weight: Optional[float]
    gender: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    confirmpassword: Optional[str] = None
    weight: Optional[float] = None
    gender: Optional[str] = None


# --- Token ---

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Exercise ---

class ExerciseCreate(BaseModel):
    name: str
    sets: int
    reps: int
    weight: float


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None


class ExerciseResponse(BaseModel):
    id: int
    name: str
    sets: int
    reps: int
    weight: float
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Workout ---

class WorkoutExerciseItem(BaseModel):
    exercise_id: int
    order: int


class WorkoutCreate(BaseModel):
    name: str
    exercises: List[WorkoutExerciseItem]


class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    exercises: Optional[List[WorkoutExerciseItem]] = None


class WorkoutExerciseResponse(BaseModel):
    exercise_id: int
    order: int
    exercise: ExerciseResponse

    class Config:
        from_attributes = True


class WorkoutResponse(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime
    items: List[WorkoutExerciseResponse]

    class Config:
        from_attributes = True


# --- Workout Session ---

class SessionExerciseLogCreate(BaseModel):
    exercise_id: int
    weight_used: float
    reps_used: Optional[int] = None


class WorkoutSessionCreate(BaseModel):
    workout_id: int
    duration_seconds: int
    calories_burned: Optional[float] = None
    logs: List[SessionExerciseLogCreate]


class SessionExerciseLogResponse(BaseModel):
    exercise_id: int
    weight_used: float
    reps_used: Optional[int]

    class Config:
        from_attributes = True


class WorkoutSessionResponse(BaseModel):
    id: int
    workout_id: int
    duration_seconds: int
    calories_burned: Optional[float]
    performed_at: datetime
    logs: List[SessionExerciseLogResponse]

    class Config:
        from_attributes = True
