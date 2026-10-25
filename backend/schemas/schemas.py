from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List

from .validators import validate_password, validate_phone


# --- User ---

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    confirmpassword: str
    weight: float
    gender: str

    _validate_phone = field_validator('phone')(validate_phone)
    _validate_password = field_validator('password')(validate_password)


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

    @field_validator('phone')
    @classmethod
    def _validate_phone(cls, value):
        return validate_phone(value) if value is not None else value

    @field_validator('password')
    @classmethod
    def _validate_password(cls, value):
        return validate_password(value) if value is not None else value


# --- Token ---

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Exercise ---

class ExerciseCreate(BaseModel):
    name: str


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None


class ExerciseResponse(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime
    last_weight: Optional[float] = None
    last_reps: Optional[int] = None

    class Config:
        from_attributes = True


# --- Workout ---

class WorkoutExerciseItem(BaseModel):
    exercise_id: int
    order: int
    sets: int
    reps: int
    weight: float


class WorkoutCreate(BaseModel):
    name: str
    exercises: List[WorkoutExerciseItem]


class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    exercises: Optional[List[WorkoutExerciseItem]] = None


class WorkoutExerciseResponse(BaseModel):
    exercise_id: int
    order: int
    sets: int
    reps: int
    weight: float
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

class SessionExerciseSetLogCreate(BaseModel):
    set_number: int
    weight_used: float
    reps_used: int


class SessionExerciseLogCreate(BaseModel):
    exercise_id: int
    weight_used: float
    reps_used: Optional[int] = None
    sets: List[SessionExerciseSetLogCreate] = []


class WorkoutSessionCreate(BaseModel):
    workout_id: int
    duration_seconds: int
    logs: List[SessionExerciseLogCreate]


class SessionExerciseSetLogResponse(BaseModel):
    set_number: int
    weight_used: float
    reps_used: int

    class Config:
        from_attributes = True


class SessionExerciseLogResponse(BaseModel):
    exercise_id: int
    weight_used: float
    reps_used: Optional[int]
    sets: List[SessionExerciseSetLogResponse] = []

    class Config:
        from_attributes = True


class LastExerciseLogResponse(BaseModel):
    weight_used: float
    reps_used: Optional[int]
    sets: List[SessionExerciseSetLogResponse] = []

    class Config:
        from_attributes = True


class WorkoutSessionResponse(BaseModel):
    id: int
    workout_id: int
    duration_seconds: int
    performed_at: datetime
    logs: List[SessionExerciseLogResponse]

    class Config:
        from_attributes = True
