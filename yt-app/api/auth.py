import os
from typing import Any, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from google.auth import exceptions as google_auth_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

_DEFAULT_PUBLIC_PATHS = {
    "/",
    "/api/healthchecker",
    "/api/db-check",
    "/api/auth/signup",
    "/api/auth/signin",
    "/api/auth/refresh",
    "/docs",
    "/redoc",
    "/openapi.json",
}

_PUBLIC_PREFIXES = ("/docs", "/redoc")


def _to_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def _normalize_path(path: str) -> str:
    return path.rstrip("/") or "/"


def _public_paths() -> set[str]:
    paths = set(_DEFAULT_PUBLIC_PATHS)
    raw_paths = os.getenv("FIREBASE_AUTH_PUBLIC_PATHS", "")

    for raw_path in raw_paths.split(","):
        path = raw_path.strip()
        if not path:
            continue
        if not path.startswith("/"):
            path = f"/{path}"
        paths.add(_normalize_path(path))

    return {_normalize_path(path) for path in paths}


def _extract_bearer_token(authorization_header: Optional[str]) -> str:
    if not authorization_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    scheme, _, token = authorization_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header. Use: Bearer <firebase_id_token>",
        )

    return token.strip()


def _verify_firebase_token(token: str, project_id: str) -> dict[str, Any]:
    request_adapter = google_requests.Request()

    try:
        claims = id_token.verify_firebase_token(
            token,
            request_adapter,
            audience=project_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {exc}") from exc
    except google_auth_exceptions.GoogleAuthError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify token against Firebase certificates",
        ) from exc

    if not claims:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    return dict(claims) 


def configure_firebase_auth(app: FastAPI) -> None:
    auth_enabled = _to_bool(os.getenv("FIREBASE_AUTH_ENABLED"), default=False)
    project_id = (os.getenv("FIREBASE_PROJECT_ID") or "").strip()
    public_paths = _public_paths()

    @app.middleware("http")
    async def firebase_auth_middleware(request: Request, call_next):
        path = _normalize_path(request.url.path)

        if request.method == "OPTIONS":
            return await call_next(request)

        if path in public_paths or any(path.startswith(prefix) for prefix in _PUBLIC_PREFIXES):
            return await call_next(request)

        if not auth_enabled:
            return await call_next(request)

        if not project_id:
            return JSONResponse(
                status_code=500,
                content={
                    "detail": (
                        "Firebase auth is enabled, but FIREBASE_PROJECT_ID is not configured"
                    )
                },
            )

        try:
            token = _extract_bearer_token(request.headers.get("Authorization"))
            request.state.firebase_user = _verify_firebase_token(token, project_id)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

        return await call_next(request)


def get_current_firebase_user(request: Request) -> dict[str, Any]:
    user = getattr(request.state, "firebase_user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
