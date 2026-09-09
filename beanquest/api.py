import os
import pathlib
from contextlib import asynccontextmanager
from typing import Annotated

import psycopg_pool
from fastapi import APIRouter, Depends, FastAPI, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict

from beanquest.application import Application
from beanquest.auth import AccessTokenAuth, NormalizedEmail, PasswordAuth, StrongPassword
from beanquest.db import Database
from beanquest.errors import Conflict, InvalidCredentials, NotFound, RateLimited, Unauthorized
from beanquest.models import BrewingMethod, PastLog, RoastingMethod, User

STATIC_DIR = pathlib.Path(__file__).parent / 'static'
_DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 4 * 60 * 60  # 4 hours


# ---------------------------------------------------------------------------
# Lifespan: open/close the pool and wire dependencies into app.state
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise RuntimeError('DATABASE_URL environment variable is required')
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        raise RuntimeError('JWT_SECRET environment variable is required')
    ttl_seconds = int(os.environ.get('ACCESS_TOKEN_TTL_SECONDS', _DEFAULT_ACCESS_TOKEN_TTL_SECONDS))
    pool = psycopg_pool.ConnectionPool(database_url, open=True)
    app.state.application = Application(Database(pool), PasswordAuth())
    app.state.auth = AccessTokenAuth(jwt_secret, ttl_seconds)
    try:
        yield
    finally:
        pool.close()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(lifespan=lifespan, title='Beanquest')


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(NotFound)
def handle_not_found(_request: Request, exc: NotFound):
    return JSONResponse(status_code=404, content={'detail': str(exc)})


@app.exception_handler(Conflict)
def handle_conflict(_request: Request, exc: Conflict):
    return JSONResponse(status_code=409, content={'detail': str(exc)})


@app.exception_handler(Unauthorized)
def handle_unauthorized(_request: Request, exc: Unauthorized):
    return JSONResponse(status_code=401, content={'detail': str(exc)})


@app.exception_handler(InvalidCredentials)
def handle_invalid_credentials(_request: Request, exc: InvalidCredentials):
    return JSONResponse(
        status_code=401,
        content={'detail': str(exc), 'attempts_left': exc.attempts_left},
    )


@app.exception_handler(RateLimited)
def handle_rate_limited(_request: Request, exc: RateLimited):
    return JSONResponse(
        status_code=429,
        content={'detail': str(exc)},
        headers={'Retry-After': str(exc.retry_after_seconds)},
    )


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

def get_application(request: Request) -> Application:
    return request.app.state.application


def get_auth(request: Request) -> AccessTokenAuth:
    return request.app.state.auth


_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(
    auth: Annotated[AccessTokenAuth, Depends(get_auth)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> int:
    if credentials is None:
        raise Unauthorized('missing authorization header')
    return auth.verify(credentials.credentials)


AppDep = Annotated[Application, Depends(get_application)]
AuthDep = Annotated[AccessTokenAuth, Depends(get_auth)]
CurrentUserDep = Annotated[int, Depends(get_current_user_id)]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

auth_router = APIRouter(prefix='/api/v1/auth', tags=['auth'])


class LookupRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    email: NormalizedEmail


class LookupResponse(BaseModel):
    exists: bool


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    first_name: str
    last_name: str
    email: NormalizedEmail
    password: StrongPassword


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    email: NormalizedEmail
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


@auth_router.post('/lookup', response_model=LookupResponse)
def lookup(body: LookupRequest, app: AppDep):
    return LookupResponse(exists=app.email_exists(body.email))


@auth_router.post('/signup', response_model=TokenResponse, status_code=201)
def signup(body: SignupRequest, app: AppDep, auth: AuthDep):
    user = app.create_user_with_password(
        User(first_name=body.first_name, last_name=body.last_name, email=body.email),
        body.password,
    )
    return TokenResponse(access_token=auth.create(user.id))


@auth_router.post('/login', response_model=TokenResponse)
def login(body: LoginRequest, app: AppDep, auth: AuthDep):
    user = app.verify_password_login(body.email, body.password)
    return TokenResponse(access_token=auth.create(user.id))


@auth_router.get('/me', response_model=User)
def get_me(app: AppDep, user_id: CurrentUserDep):
    return app.get_user(user_id)


# ---------------------------------------------------------------------------
# Brewing methods
# ---------------------------------------------------------------------------

brewing_router = APIRouter(prefix='/api/v1/brewing-methods', tags=['brewing-methods'])


class _BrewingMethodIn(BrewingMethod):
    # user_id is required on BrewingMethod itself (db/application enforce a
    # real owner) but must never come from the client — this is the route's
    # body type only, immediately overwritten with the authenticated user.
    user_id: int = 0


@brewing_router.get('', response_model=list[BrewingMethod])
def list_brewing_methods(app: AppDep, user_id: CurrentUserDep):
    return app.get_brewing_methods(user_id)


@brewing_router.post('', response_model=BrewingMethod, status_code=201)
def create_brewing_method(body: _BrewingMethodIn, app: AppDep, user_id: CurrentUserDep):
    return app.add_brewing_method(body.model_copy(update={'user_id': user_id}))


@brewing_router.get('/{id}', response_model=BrewingMethod)
def get_brewing_method(id: int, app: AppDep, user_id: CurrentUserDep):
    return app.get_brewing_method(id, user_id)


@brewing_router.put('/{id}', response_model=BrewingMethod)
def update_brewing_method(id: int, body: _BrewingMethodIn, app: AppDep, user_id: CurrentUserDep):
    return app.update_brewing_method(body.model_copy(update={'id': id, 'user_id': user_id}))


@brewing_router.delete('/{id}', status_code=204)
def delete_brewing_method(id: int, app: AppDep, user_id: CurrentUserDep):
    app.delete_brewing_method(id, user_id)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Roasting methods
# ---------------------------------------------------------------------------

roasting_router = APIRouter(prefix='/api/v1/roasting-methods', tags=['roasting-methods'])


class _RoastingMethodIn(RoastingMethod):
    user_id: int = 0


@roasting_router.get('', response_model=list[RoastingMethod])
def list_roasting_methods(app: AppDep, user_id: CurrentUserDep):
    return app.get_roasting_methods(user_id)


@roasting_router.post('', response_model=RoastingMethod, status_code=201)
def create_roasting_method(body: _RoastingMethodIn, app: AppDep, user_id: CurrentUserDep):
    return app.add_roasting_method(body.model_copy(update={'user_id': user_id}))


@roasting_router.get('/{id}', response_model=RoastingMethod)
def get_roasting_method(id: int, app: AppDep, user_id: CurrentUserDep):
    return app.get_roasting_method(id, user_id)


@roasting_router.put('/{id}', response_model=RoastingMethod)
def update_roasting_method(id: int, body: _RoastingMethodIn, app: AppDep, user_id: CurrentUserDep):
    return app.update_roasting_method(body.model_copy(update={'id': id, 'user_id': user_id}))


@roasting_router.delete('/{id}', status_code=204)
def delete_roasting_method(id: int, app: AppDep, user_id: CurrentUserDep):
    app.delete_roasting_method(id, user_id)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Past logs
# ---------------------------------------------------------------------------

past_logs_router = APIRouter(prefix='/api/v1/past-logs', tags=['past-logs'])


class _PastLogIn(PastLog):
    user_id: int = 0


@past_logs_router.get('', response_model=list[PastLog])
def list_past_logs(app: AppDep, user_id: CurrentUserDep):
    return app.get_past_logs(user_id)


@past_logs_router.post('', response_model=PastLog, status_code=201)
def create_past_log(body: _PastLogIn, app: AppDep, user_id: CurrentUserDep):
    return app.add_past_log(body.model_copy(update={'user_id': user_id}))


@past_logs_router.get('/{id}', response_model=PastLog)
def get_past_log(id: int, app: AppDep, user_id: CurrentUserDep):
    return app.get_past_log(id, user_id)


@past_logs_router.put('/{id}', response_model=PastLog)
def update_past_log(id: int, body: _PastLogIn, app: AppDep, user_id: CurrentUserDep):
    return app.update_past_log(body.model_copy(update={'id': id, 'user_id': user_id}))


@past_logs_router.delete('/{id}', status_code=204)
def delete_past_log(id: int, app: AppDep, user_id: CurrentUserDep):
    app.delete_past_log(id, user_id)
    return Response(status_code=204)


app.include_router(auth_router)
app.include_router(brewing_router)
app.include_router(roasting_router)
app.include_router(past_logs_router)


# ---------------------------------------------------------------------------
# SPA static serving (only when the frontend has been built)
# ---------------------------------------------------------------------------

if STATIC_DIR.exists():
    app.mount('/assets', StaticFiles(directory=STATIC_DIR / 'assets'), name='assets')

    @app.get('/{full_path:path}', include_in_schema=False)
    def spa_fallback() -> FileResponse:
        return FileResponse(STATIC_DIR / 'index.html')
