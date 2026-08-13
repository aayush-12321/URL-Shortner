from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session
from app.database.db import get_session
from app.models.models import URLCreate, URLResponse, URLUpdate, ShortenedURL
from app.services.url_service import URLService

router = APIRouter(prefix="/api/v1", tags=["urls"])


@router.post(
    "/shorten",
    response_model=URLResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a shortened URL",
    responses={
        201: {"description": "Successfully created shortened URL"},
        400: {"description": "Invalid URL provided"}
    }
)
def create_shortened_url(
    url_create: URLCreate,
    session: Session = Depends(get_session)
):
    """
    Create a new shortened URL.
    
    - **original_url**: The long URL to shorten (required)
    - **description**: Optional description for the URL
    - **expires_at**: Optional expiration datetime
    
    Returns the shortened URL with short code and metadata.
    """
    try:
        shortened_url = URLService.create_shortened_url(session, url_create)
        return URLResponse(
            short_code=shortened_url.short_code,
            original_url=shortened_url.original_url,
            click_count=shortened_url.click_count,
            created_at=shortened_url.created_at,
            description=shortened_url.description
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create shortened URL: {str(e)}"
        )


@router.get(
    "/{short_code}",
    summary="Redirect to original URL",
    status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    responses={
        307: {"description": "Redirect to original URL"},
        404: {"description": "Short code not found"},
        410: {"description": "URL has expired"}
    }
)
def redirect_to_original(
    short_code: str,
    session: Session = Depends(get_session)
):
    """
    Redirect to the original URL using the short code.
    Increments click counter on each access.
    """
    original_url = URLService.get_original_url(session, short_code)
    
    if not original_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Short code not found or URL has expired"
        )
    
    return RedirectResponse(url=original_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get(
    "/stats/{short_code}",
    response_model=URLResponse,
    summary="Get URL statistics",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "URL statistics"},
        404: {"description": "Short code not found"}
    }
)
def get_url_stats(
    short_code: str,
    session: Session = Depends(get_session)
):
    """
    Get statistics for a shortened URL including click count.
    """
    shortened_url = URLService.get_url_stats(session, short_code)
    
    if not shortened_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Short code not found"
        )
    
    return URLResponse(
        short_code=shortened_url.short_code,
        original_url=shortened_url.original_url,
        click_count=shortened_url.click_count,
        created_at=shortened_url.created_at,
        description=shortened_url.description
    )


@router.patch(
    "/stats/{short_code}",
    response_model=URLResponse,
    summary="Update URL metadata",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "URL updated successfully"},
        404: {"description": "Short code not found"}
    }
)
def update_url(
    short_code: str,
    url_update: URLUpdate,
    session: Session = Depends(get_session)
):
    """
    Update URL metadata like description or expiration date.
    """
    updated_url = URLService.update_shortened_url(
        session,
        short_code,
        description=url_update.description,
        expires_at=url_update.expires_at
    )
    
    if not updated_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Short code not found"
        )
    
    return URLResponse(
        short_code=updated_url.short_code,
        original_url=updated_url.original_url,
        click_count=updated_url.click_count,
        created_at=updated_url.created_at,
        description=updated_url.description
    )


@router.delete(
    "/stats/{short_code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a shortened URL",
    responses={
        204: {"description": "URL deleted successfully"},
        404: {"description": "Short code not found"}
    }
)
def delete_url(
    short_code: str,
    session: Session = Depends(get_session)
):
    """
    Delete a shortened URL and all its click logs.
    """
    deleted = URLService.delete_shortened_url(session, short_code)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Short code not found"
        )
    
    return None


@router.get(
    "/list/all",
    response_model=list[URLResponse],
    summary="List all shortened URLs",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "List of all shortened URLs"}
    }
)
def list_all_urls(
    skip: int = 0,
    limit: int = 10,
    session: Session = Depends(get_session)
):
    """
    Get a paginated list of all shortened URLs.
    
    - **skip**: Number of URLs to skip (default: 0)
    - **limit**: Maximum number of URLs to return (default: 10, max: 100)
    """
    if limit > 100:
        limit = 100
    
    urls = URLService.get_all_urls(session, skip=skip, limit=limit)
    
    return [
        URLResponse(
            short_code=url.short_code,
            original_url=url.original_url,
            click_count=url.click_count,
            created_at=url.created_at,
            description=url.description
        )
        for url in urls
    ]
