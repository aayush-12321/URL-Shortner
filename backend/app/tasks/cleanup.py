from datetime import datetime, timezone

from sqlmodel import Session, select

from app.database.db import engine
from app.models.models import RefreshToken


def cleanup_expired_refresh_tokens() -> int:
    """Delete expired non-revoked refresh tokens and expired rows.

    Returns the number of deleted rows.
    """
    now = datetime.now(timezone.utc)
    with Session(engine) as session:
        expired_tokens = session.exec(
            select(RefreshToken).where(
                (RefreshToken.expires_at != None) & (RefreshToken.expires_at < now)
            )
        ).all()

        for token in expired_tokens:
            session.delete(token)

        session.commit()
        return len(expired_tokens)


if __name__ == "__main__":
    deleted_count = cleanup_expired_refresh_tokens()
    print(f"Deleted {deleted_count} expired refresh token(s)")
