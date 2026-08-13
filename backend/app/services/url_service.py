import string
import random
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.models.models import ShortenedURL, URLCreate, ClickLog


class URLService:
    """Service for URL shortening operations"""
    
    # Characters for generating short codes (alphanumeric)
    CHARACTERS = string.ascii_letters + string.digits
    SHORT_CODE_LENGTH = 6
    
    @staticmethod
    def generate_short_code(length: int = SHORT_CODE_LENGTH) -> str:
        """Generate a random short code"""
        return "".join(random.choices(URLService.CHARACTERS, k=length))
    
    @staticmethod
    def generate_unique_short_code(session: Session, length: int = SHORT_CODE_LENGTH, max_attempts: int = 10) -> str:
        """Generate a unique short code that doesn't exist in database"""
        for _ in range(max_attempts):
            short_code = URLService.generate_short_code(length)
            
            # Check if it already exists
            existing = session.exec(
                select(ShortenedURL).where(ShortenedURL.short_code == short_code)
            ).first()
            
            if not existing:
                return short_code
        
        # If max_attempts reached, use longer code
        return URLService.generate_unique_short_code(session, length + 1, 1)
    
    @staticmethod
    def create_shortened_url(
        session: Session,
        url_create: URLCreate
    ) -> ShortenedURL:
        """Create a new shortened URL"""
        short_code = URLService.generate_unique_short_code(session)
        
        shortened_url = ShortenedURL(
            original_url=url_create.original_url,
            short_code=short_code,
            description=url_create.description,
            expires_at=url_create.expires_at,
            created_at=datetime.now(timezone.utc)
        )
        
        session.add(shortened_url)
        session.commit()
        session.refresh(shortened_url)
        
        return shortened_url
    
    @staticmethod
    def get_shortened_url(session: Session, short_code: str) -> ShortenedURL | None:
        """Get a shortened URL by its short code"""
        return session.exec(
            select(ShortenedURL).where(ShortenedURL.short_code == short_code)
        ).first()
    
    @staticmethod
    def get_original_url(session: Session, short_code: str) -> str | None:
        """Get the original URL and increment click count"""
        shortened_url = URLService.get_shortened_url(session, short_code)
        
        if not shortened_url:
            return None
        
        # Check if URL has expired
        if shortened_url.expires_at and datetime.now(timezone.utc) > shortened_url.expires_at:
            return None
        
        # Increment click count
        shortened_url.click_count += 1
        session.add(shortened_url)
        session.commit()
        
        # Log the click
        click_log = ClickLog(
            short_code=short_code,
            clicked_at=datetime.now(timezone.utc)
        )
        session.add(click_log)
        session.commit()
        
        return shortened_url.original_url
    
    @staticmethod
    def get_url_stats(session: Session, short_code: str) -> ShortenedURL | None:
        """Get statistics for a shortened URL"""
        return URLService.get_shortened_url(session, short_code)
    
    @staticmethod
    def delete_shortened_url(session: Session, short_code: str) -> bool:
        """Delete a shortened URL and its click logs"""
        shortened_url = URLService.get_shortened_url(session, short_code)
        
        if not shortened_url:
            return False
        
        # Delete associated click logs
        click_logs = session.exec(
            select(ClickLog).where(ClickLog.short_code == short_code)
        ).all()
        
        for click_log in click_logs:
            session.delete(click_log)
        
        # Delete the shortened URL
        session.delete(shortened_url)
        session.commit()
        
        return True
    
    @staticmethod
    def update_shortened_url(
        session: Session,
        short_code: str,
        description: str | None = None,
        expires_at: datetime | None = None
    ) -> ShortenedURL | None:
        """Update a shortened URL"""
        shortened_url = URLService.get_shortened_url(session, short_code)
        
        if not shortened_url:
            return None
        
        if description is not None:
            shortened_url.description = description
        
        if expires_at is not None:
            shortened_url.expires_at = expires_at
        
        session.add(shortened_url)
        session.commit()
        session.refresh(shortened_url)
        
        return shortened_url
    
    @staticmethod
    def get_all_urls(session: Session, skip: int = 0, limit: int = 10) -> list[ShortenedURL]:
        """Get all shortened URLs with pagination"""
        return session.exec(
            select(ShortenedURL).offset(skip).limit(limit)
        ).all()
