from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Dict, List
from datetime import datetime
from database import get_db
from models.models import WorkoutSession, SessionExerciseLog, Workout, User
from schemas.schemas import WorkoutSessionCreate, WorkoutSessionResponse
from auth.auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(data: WorkoutSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workout).filter(Workout.id == data.workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    session = WorkoutSession(
        user_id=current_user.id,
        workout_id=data.workout_id,
        duration_seconds=data.duration_seconds,
        calories_burned=data.calories_burned,
    )
    db.add(session)
    db.flush()

    for log in data.logs:
        db.add(SessionExerciseLog(
            session_id=session.id,
            exercise_id=log.exercise_id,
            weight_used=log.weight_used,
            reps_used=log.reps_used,
        ))

    db.commit()
    db.refresh(session)
    return session


@router.get("/monthly-stats", response_model=dict)
def get_monthly_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            func.strftime('%Y-%m', WorkoutSession.performed_at) == now.strftime('%Y-%m'),
        )
        .all()
    )
    total_workouts = len(sessions)
    total_calories = sum(s.calories_burned for s in sessions if s.calories_burned is not None)
    return {"total_workouts": total_workouts, "total_calories": round(total_calories)}


@router.get("/last-weights/{workout_id}", response_model=Dict[int, float])
def get_last_weights(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    result = {}
    for item in workout.items:
        last_log = (
            db.query(SessionExerciseLog)
            .join(WorkoutSession)
            .filter(
                WorkoutSession.user_id == current_user.id,
                SessionExerciseLog.exercise_id == item.exercise_id,
            )
            .order_by(desc(WorkoutSession.performed_at))
            .first()
        )
        if last_log:
            result[item.exercise_id] = last_log.weight_used

    return result


@router.get("/exercise-history/{exercise_id}", response_model=List[dict])
def get_exercise_history(exercise_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = (
        db.query(SessionExerciseLog)
        .join(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            SessionExerciseLog.exercise_id == exercise_id,
        )
        .order_by(WorkoutSession.performed_at)
        .all()
    )

    return [
        {
            "date": log.session.performed_at.strftime("%d/%m"),
            "weight_used": log.weight_used,
            "reps_used": log.reps_used,
        }
        for log in logs
    ]


@router.get("/by-date", response_model=Dict[str, List[dict]])
def get_sessions_by_date(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    all_sessions = (
        db.query(WorkoutSession)
        .join(Workout)
        .filter(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.performed_at)
        .all()
    )

    result = {}
    for session in all_sessions:
        date_str = session.performed_at.strftime("%Y-%m-%d")
        if date_str not in result:
            result[date_str] = []
        result[date_str].append({
            "workout_name": session.workout.name,
            "duration_seconds": session.duration_seconds,
            "calories_burned": session.calories_burned,
        })

    return result
