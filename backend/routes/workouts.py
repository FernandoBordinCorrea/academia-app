from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.models import Workout, WorkoutExercise, Exercise, User
from schemas.schemas import WorkoutCreate, WorkoutUpdate, WorkoutResponse
from auth.auth import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("/", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create(data: WorkoutCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not data.exercises:
        raise HTTPException(status_code=422, detail="Adicione pelo menos um exercício ao treino")

    workout = Workout(name=data.name, user_id=current_user.id)
    db.add(workout)
    db.flush()

    for item in data.exercises:
        exercise = db.query(Exercise).filter(Exercise.id == item.exercise_id, Exercise.user_id == current_user.id).first()
        if not exercise:
            raise HTTPException(status_code=404, detail=f"Exercício {item.exercise_id} não encontrado")
        db.add(WorkoutExercise(workout_id=workout.id, exercise_id=item.exercise_id, order=item.order))

    db.commit()
    db.refresh(workout)
    return workout


@router.get("/", response_model=List[WorkoutResponse])
def get_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Workout).filter(Workout.user_id == current_user.id).order_by(Workout.created_at.desc()).all()


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_by_id(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    return workout


@router.patch("/{workout_id}", response_model=WorkoutResponse)
def update(workout_id: int, data: WorkoutUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    if data.name is not None:
        workout.name = data.name

    if data.exercises is not None:
        if not data.exercises:
            raise HTTPException(status_code=422, detail="Adicione pelo menos um exercício ao treino")

        db.query(WorkoutExercise).filter(WorkoutExercise.workout_id == workout.id).delete()

        for item in data.exercises:
            exercise = db.query(Exercise).filter(Exercise.id == item.exercise_id, Exercise.user_id == current_user.id).first()
            if not exercise:
                raise HTTPException(status_code=404, detail=f"Exercício {item.exercise_id} não encontrado")
            db.add(WorkoutExercise(workout_id=workout.id, exercise_id=item.exercise_id, order=item.order))

    db.commit()
    db.refresh(workout)
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    db.delete(workout)
    db.commit()
