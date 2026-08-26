from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, oauth2_scheme, decode_token
from app.models import User, AthleteProfile, CoachProfile, UserRole
from app.schemas import UserCreate, UserLogin, Token, UserOut

router = APIRouter()


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user


@router.post("/register", response_model=Token)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role.lower()
    )
    db.add(user)
    db.flush()

    if user.role == UserRole.ATHLETE.value or user.role == "athlete":
        anon_id = f"SUBJ_{uuid.uuid4().hex[:8].upper()}"
        athlete_profile = AthleteProfile(
            user_id=user.id,
            date_of_birth=user_in.date_of_birth,
            gender=user_in.gender,
            height_cm=user_in.height_cm,
            weight_kg=user_in.weight_kg,
            sport=user_in.sport or "General Fitness",
            training_level=user_in.training_level or "Intermediate",
            anonymized_subject_id=anon_id
        )
        db.add(athlete_profile)
    elif user.role == UserRole.COACH.value or user.role == "coach":
        coach_profile = CoachProfile(
            user_id=user.id,
            organization=user_in.organization or "Elite Academy",
            specialization=user_in.specialization or "Youth Strength & Conditioning"
        )
        db.add(coach_profile)

    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id, extra_claims={"role": user.role, "email": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name
    }


@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled")

    access_token = create_access_token(subject=user.id, extra_claims={"role": user.role, "email": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name
    }


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
