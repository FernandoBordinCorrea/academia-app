from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User
from schemas.schemas import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from auth.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if not data.name:
        raise HTTPException(status_code=422, detail="O nome é obrigatório")
    if not data.phone:
        raise HTTPException(status_code=422, detail="O telefone é obrigatório")
    if data.password != data.confirmpassword:
        raise HTTPException(status_code=422, detail="As senhas não conferem")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=422, detail="Email já cadastrado")

    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=422, detail="Email ou senha inválidos")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.password and data.password != data.confirmpassword:
        raise HTTPException(status_code=422, detail="As senhas não conferem")

    if data.name:
        current_user.name = data.name
    if data.phone:
        current_user.phone = data.phone
    if data.email:
        if db.query(User).filter(User.email == data.email, User.id != current_user.id).first():
            raise HTTPException(status_code=422, detail="Email já em uso")
        current_user.email = data.email
    if data.password:
        current_user.password = hash_password(data.password)

    db.commit()
    db.refresh(current_user)
    return current_user
