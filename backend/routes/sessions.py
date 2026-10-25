from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract
from typing import Dict, List
from datetime import datetime
from database import get_db
from models.models import WorkoutSession, SessionExerciseLog, SessionExerciseSetLog, Workout, User
from schemas.schemas import WorkoutSessionCreate, WorkoutSessionResponse, LastExerciseLogResponse
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
    )
    db.add(session)
    db.flush()

    for log in data.logs:
        exercise_log = SessionExerciseLog(
            session_id=session.id,
            exercise_id=log.exercise_id,
            weight_used=log.weight_used,
            reps_used=log.reps_used,
        )
        db.add(exercise_log)
        db.flush()

        for set_log in log.sets:
            db.add(SessionExerciseSetLog(
                session_exercise_log_id=exercise_log.id,
                set_number=set_log.set_number,
                weight_used=set_log.weight_used,
                reps_used=set_log.reps_used,
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
            extract('year', WorkoutSession.performed_at) == now.year,
            extract('month', WorkoutSession.performed_at) == now.month,
        )
        .all()
    )
    total_workouts = len(sessions)
    return {"total_workouts": total_workouts}


@router.get("/last-log/{workout_id}", response_model=Dict[int, LastExerciseLogResponse])
def get_last_log(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
            last_log.sets.sort(key=lambda s: s.set_number)
            result[item.exercise_id] = last_log

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

    result = []
    for log in logs:
        date = log.session.performed_at.strftime("%d/%m")
        if log.sets:
            for set_log in sorted(log.sets, key=lambda s: s.set_number):
                result.append({"date": date, "weight_used": set_log.weight_used, "reps_used": set_log.reps_used})
        else:
            result.append({"date": date, "weight_used": log.weight_used, "reps_used": log.reps_used})

    return result


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
        })

    return result
