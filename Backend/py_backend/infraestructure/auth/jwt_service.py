from datetime import datetime, timedelta
from typing import Any, Optional

from jose import JWTError, jwt


class JWTService:
    def __init__(self, secret_key: str, algorithm: str = "HS256") -> None:
        self.secret_key = secret_key
        self.algorithm = algorithm

    def sign(self, payload: dict[str, Any], expires_minutes: int = 60) -> str:
        data = payload.copy()
        data["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
        return jwt.encode(data, self.secret_key, algorithm=self.algorithm)

    def verify(self, token: str) -> Optional[dict[str, Any]]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except JWTError:
            return None
