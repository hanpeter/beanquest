import os
from contextlib import asynccontextmanager
from typing import Annotated

import psycopg_pool
from fastapi import APIRouter, Depends, FastAPI, Request, Response
from fastapi.responses import JSONResponse

from beanquest.application import Application
from beanquest.db import Database
from beanquest.errors import Conflict, NotFound
from beanquest.models import BrewingMethod, PastLog, RoastingMethod


# ---------------------------------------------------------------------------
# Lifespan: open/close the pool and wire dependencies into app.state
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise RuntimeError('DATABASE_URL environment variable is required')
    pool = psycopg_pool.ConnectionPool(database_url, open=True)
    app.state.application = Application(Database(pool))
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


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def get_application(request: Request) -> Application:
    return request.app.state.application


AppDep = Annotated[Application, Depends(get_application)]


# ---------------------------------------------------------------------------
# Brewing methods
# ---------------------------------------------------------------------------

brewing_router = APIRouter(prefix='/api/v1/brewing-methods', tags=['brewing-methods'])


@brewing_router.get('', response_model=list[BrewingMethod])
def list_brewing_methods(app: AppDep):
    return app.get_brewing_methods()


@brewing_router.post('', response_model=BrewingMethod, status_code=201)
def create_brewing_method(body: BrewingMethod, app: AppDep):
    return app.add_brewing_method(body)


@brewing_router.get('/{id}', response_model=BrewingMethod)
def get_brewing_method(id: int, app: AppDep):
    return app.get_brewing_method(id)


@brewing_router.put('/{id}', response_model=BrewingMethod)
def update_brewing_method(id: int, body: BrewingMethod, app: AppDep):
    return app.update_brewing_method(body.model_copy(update={'id': id}))


@brewing_router.delete('/{id}', status_code=204)
def delete_brewing_method(id: int, app: AppDep):
    app.delete_brewing_method(id)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Roasting methods
# ---------------------------------------------------------------------------

roasting_router = APIRouter(prefix='/api/v1/roasting-methods', tags=['roasting-methods'])


@roasting_router.get('', response_model=list[RoastingMethod])
def list_roasting_methods(app: AppDep):
    return app.get_roasting_methods()


@roasting_router.post('', response_model=RoastingMethod, status_code=201)
def create_roasting_method(body: RoastingMethod, app: AppDep):
    return app.add_roasting_method(body)


@roasting_router.get('/{id}', response_model=RoastingMethod)
def get_roasting_method(id: int, app: AppDep):
    return app.get_roasting_method(id)


@roasting_router.put('/{id}', response_model=RoastingMethod)
def update_roasting_method(id: int, body: RoastingMethod, app: AppDep):
    return app.update_roasting_method(body.model_copy(update={'id': id}))


@roasting_router.delete('/{id}', status_code=204)
def delete_roasting_method(id: int, app: AppDep):
    app.delete_roasting_method(id)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Past logs
# ---------------------------------------------------------------------------

past_logs_router = APIRouter(prefix='/api/v1/past-logs', tags=['past-logs'])


@past_logs_router.get('', response_model=list[PastLog])
def list_past_logs(app: AppDep):
    return app.get_past_logs()


@past_logs_router.post('', response_model=PastLog, status_code=201)
def create_past_log(body: PastLog, app: AppDep):
    return app.add_past_log(body)


@past_logs_router.get('/{id}', response_model=PastLog)
def get_past_log(id: int, app: AppDep):
    return app.get_past_log(id)


@past_logs_router.put('/{id}', response_model=PastLog)
def update_past_log(id: int, body: PastLog, app: AppDep):
    return app.update_past_log(body.model_copy(update={'id': id}))


@past_logs_router.delete('/{id}', status_code=204)
def delete_past_log(id: int, app: AppDep):
    app.delete_past_log(id)
    return Response(status_code=204)


app.include_router(brewing_router)
app.include_router(roasting_router)
app.include_router(past_logs_router)
