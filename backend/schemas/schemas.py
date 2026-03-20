from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# --- User ---

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    confirmpassword: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    confirmpassword: Optional[str] = None


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
