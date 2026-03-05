from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
from typing import Optional, List
import os

# Secret de Supabase (Free Tier)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "super-secret-supabase-dev-key")
ALGORITHM = "HS256"

class AuthUser:
    def __init__(self, user_id: str, email: str, role: str):
        self.user_id = user_id
        self.email = email
        self.role = role

def get_current_user(request: Request) -> AuthUser:
    """
    Middleware de Autenticación 0 USD - Valida JWT de Supabase.
    LÓGICA SENIOR MASTER: Permitir bypass TOTAL en desarrollo.
    """
    if os.getenv("ENV") != "production":
        return AuthUser(user_id="dev-user", email="dev@igga.com", role="Oficina")
        
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")

    token = auth_header.split(" ")[1]
    
    try:
        # En Supabase el aud suele ser 'authenticated'
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM], audience="authenticated")
        user_id = payload.get("sub")
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})
        role = user_metadata.get("role", "Oficina")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        return AuthUser(user_id=user_id, email=email, role=role)
    except JWTError:
        # Fallback local incluso con token inválido si estamos en dev
        if os.getenv("ENV") != "production":
             return AuthUser(user_id="dev-user", email="dev@igga.com", role="Oficina")
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


def check_roles(allowed_roles: List[str]):
    """
    RBAC (Role-Based Access Control) para IGGA.
    """
    def role_verifier(user: AuthUser = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
        return user
    return role_verifier

# Factories de Dependencia (Senior Master RBAC)
def NeedRole(roles: List[str]):
    """Retorna una dependencia que valida roles."""
    def verifier(user: AuthUser = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Permiso denegado. Reclama rol en: {roles}"
            )
        return user
    return verifier

# Atajos para legibilidad
RequireOficina = NeedRole(["Oficina", "Coordinador Predial Senior"])
RequireSenior = NeedRole(["Coordinador Predial Senior", "Analista Ambiental"])
RequireUser = get_current_user
