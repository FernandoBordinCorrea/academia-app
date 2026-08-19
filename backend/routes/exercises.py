from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.models import Exercise, SessionExerciseLog, WorkoutSession, User
from schemas.schemas import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from auth.auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])


def _attach_last_logs(db: Session, current_user: User, exercises: List[Exercise]) -> List[Exercise]:
    logs = (
        db.query(SessionExerciseLog)
        .join(WorkoutSession)
        .filter(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.performed_at)
        .all()
    )
    last_by_exercise = {}
    for log in logs:
        last_by_exercise[log.exercise_id] = log

    for exercise in exercises:
        last_log = last_by_exercise.get(exercise.id)
        exercise.last_weight = last_log.weight_used if last_log else None
        exercise.last_reps = last_log.reps_used if last_log else None

    return exercises


@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create(data: ExerciseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercise = Exercise(**data.model_dump(), user_id=current_user.id)
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return _attach_last_logs(db, current_user, [exercise])[0]


@router.get("/", response_model=List[ExerciseResponse])
def get_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercises = db.query(Exercise).filter(Exercise.user_id == current_user.id).order_by(Exercise.created_at.desc()).all()
    return _attach_last_logs(db, current_user, exercises)


@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_by_id(exercise_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.user_id == current_user.id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    return _attach_last_logs(db, current_user, [exercise])[0]


@router.patch("/{exercise_id}", response_model=ExerciseResponse)
def update(exercise_id: int, data: ExerciseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.user_id == current_user.id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(exercise, field, value)

    db.commit()
    db.refresh(exercise)
    return _attach_last_logs(db, current_user, [exercise])[0]


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(exercise_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.user_id == current_user.id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")

    db.delete(exercise)
    db.commit()
