import os
from typing import Any

import requests
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(tags=["firebase-auth"])


class FirebaseEmailPasswordRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    return_secure_token: bool = True


class FirebaseRefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


def _firebase_web_api_key() -> str:
    api_key = (os.getenv("FIREBASE_WEB_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FIREBASE_WEB_API_KEY is not configured",
        )
    return api_key


def _firebase_post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    try:
        response = requests.post(url, json=payload, timeout=12)
        data = response.json()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach Firebase Auth service",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Firebase Auth returned a non-JSON response",
        ) from exc

    if response.status_code >= 400:
        firebase_message = (
            data.get("error", {}).get("message")
            if isinstance(data, dict)
            else "FIREBASE_AUTH_ERROR"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase Auth error: {firebase_message}",
        )

    return data


def _firebase_post_form(url: str, form_data: dict[str, str]) -> dict[str, Any]:
    try:
        response = requests.post(url, data=form_data, timeout=12)
        data = response.json()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach Firebase Auth service",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Firebase Auth returned a non-JSON response",
        ) from exc

    if response.status_code >= 400:
        firebase_message = (
            data.get("error", {}).get("message")
            if isinstance(data, dict)
            else "FIREBASE_AUTH_ERROR"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase Auth error: {firebase_message}",
        )

    return data


@router.post("/api/auth/signup")
def firebase_signup(payload: FirebaseEmailPasswordRequest):
    api_key = _firebase_web_api_key()
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api_key}"

    return _firebase_post_json(
        url,
        {
            "email": payload.email,
            "password": payload.password,
            "returnSecureToken": payload.return_secure_token,
        },
    )


@router.post("/api/auth/signin")
def firebase_signin(payload: FirebaseEmailPasswordRequest):
    api_key = _firebase_web_api_key()
    url = (
        "https://identitytoolkit.googleapis.com/v1/"
        f"accounts:signInWithPassword?key={api_key}"
    )

    return _firebase_post_json(
        url,
        {
            "email": payload.email,
            "password": payload.password,
            "returnSecureToken": payload.return_secure_token,
        },
    )


@router.post("/api/auth/refresh")
def firebase_refresh(payload: FirebaseRefreshRequest):
    api_key = _firebase_web_api_key()
    url = f"https://securetoken.googleapis.com/v1/token?key={api_key}"

    return _firebase_post_form(
        url,
        {
            "grant_type": "refresh_token",
            "refresh_token": payload.refresh_token,
        },
    )
