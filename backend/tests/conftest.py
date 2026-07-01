"""
Shared fixtures for backend whitebox tests.

Strategy:
  - Do NOT override DATABASE_URL; let database.py create its MySQL engine normally.
    SQLAlchemy is lazy — no connection is made until a query runs.
  - Create a separate SQLite in-memory engine for tests.
  - Override the `get_db` FastAPI dependency in every TestClient to yield
    a SQLite session instead of a MySQL session.
  - The main.py lifespan tries to connect to MySQL and fails silently (try/except).
  - Tables are created fresh before each test via Base.metadata on the SQLite engine.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from utils import get_password_hash, create_access_token
import models

# In-memory SQLite shared across all tests in the process.
# StaticPool ensures every SQLAlchemy call reuses the same underlying connection,
# which is required for in-memory SQLite (a new connection → empty DB).
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_Session = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


@pytest.fixture(autouse=True)
def fresh_db():
    """Drop and recreate all tables before every test → guaranteed clean state."""
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)
    yield


@pytest.fixture()
def db(fresh_db):
    session = _Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    """TestClient whose routes use the SQLite test session."""
    def _override():
        yield db

    app.dependency_overrides[get_db] = _override
    # raise_server_exceptions=False: prevents test failures on expected 4xx/5xx
    # but we still get the status codes. Keep True so unexpected 500s aren't hidden.
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_user(db, *, ID="testuser", PW="password123",
              name="테스트유저", nickname="테스터", phone="010-1234-5678",
              district="26110"):
    u = models.User(
        ID=ID, PW=get_password_hash(PW),
        name=name, nickname=nickname,
        phone_num=phone, district_code=district,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def user(db):
    return make_user(db)


@pytest.fixture()
def user2(db):
    return make_user(db, ID="other", name="다른유저", nickname="다른테스터",
                     phone="010-9999-0000")


@pytest.fixture()
def user_token(user):
    return create_access_token({"sub": user.ID})


@pytest.fixture()
def user2_token(user2):
    return create_access_token({"sub": user2.ID})


@pytest.fixture()
def admin_token():
    return create_access_token({"sub": "admin"})


@pytest.fixture()
def auth(user_token):
    return bearer(user_token)


@pytest.fixture()
def auth2(user2_token):
    return bearer(user2_token)


@pytest.fixture()
def admin_auth(admin_token):
    return bearer(admin_token)


def make_report(db, *, user_id=None, title="테스트 제보", category="안전",
                region="해운대구", lat=35.16, lng=129.16, status="개선예정"):
    r = models.Report(
        user_id=user_id, title=title, category=category,
        region=region, lat=lat, lng=lng, status=status,
        progress_step=1,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def make_proposal(db, *, user_id=None, title="테스트 제안", category="안전",
                  region="해운대구", lat=35.16, lng=129.16):
    p = models.NewProposal(
        user_id=user_id, title=title, category=category,
        content="제안 내용", region=region, lat=lat, lng=lng,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
