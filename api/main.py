import psycopg2
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.limiter import limiter
from api.routes import router

LOCALHOSTS = {"127.0.0.1", "::1"}

app = FastAPI(
    title="Transjakarta GTFS API",
    description="Read-only API for Transjakarta GTFS network intelligence data",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: only allow frontend origin (prinsip #8: security)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.exception_handler(psycopg2.Error)
async def psycopg2_exception_handler(request: Request, exc: psycopg2.Error):
    return JSONResponse(status_code=500, content={"detail": "Database error"})


@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.exception_handler(422)
async def custom_422_handler(request: Request, exc):
    return JSONResponse(status_code=422, content={"detail": "Validation error"})


@app.get("/", include_in_schema=False)
@limiter.limit("30/minute")
async def root(request: Request):
    return {
        "service": "Transjakarta GTFS API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health(request: Request):
    return {"status": "ok"}


@app.get("/docs", include_in_schema=False)
@limiter.limit("10/minute")
async def restricted_docs(request: Request):
    if request.client.host not in LOCALHOSTS:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Transjakarta GTFS API")


@app.get("/redoc", include_in_schema=False)
@limiter.limit("10/minute")
async def restricted_redoc(request: Request):
    if request.client.host not in LOCALHOSTS:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return get_redoc_html(openapi_url="/openapi.json", title="Transjakarta GTFS API")
