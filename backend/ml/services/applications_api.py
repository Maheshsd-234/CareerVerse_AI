"""
Station 10: Application Tracker API Router
Endpoints:
- POST /api/applications/sync-email
- GET  /api/applications/list/{user_id}
- GET  /api/applications/analytics/{user_id}
- PUT  /api/applications/update/{user_id}/{app_id}
- POST /api/applications/create/{user_id}
- DELETE /api/applications/delete/{user_id}/{app_id}
- GET  /api/applications/recommendations/{user_id}
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field

try:
    from gmail_service import gmail_sync_service
    from email_parser import parse_application_email
except ImportError:
    from .gmail_service import gmail_sync_service
    from .email_parser import parse_application_email

router = APIRouter(prefix="/api/applications", tags=["Application Tracker"])


class SyncEmailRequest(BaseModel):
    user_id: str = Field(..., description="Firebase User UID")
    access_token: Optional[str] = Field(None, description="Google OAuth access token (optional)")
    refresh_token: Optional[str] = Field(None, description="Google OAuth refresh token (optional)")
    user_email: Optional[str] = Field(None, description="Connected Google email address")
    provider: Optional[str] = Field("gmail", description="Email provider")
    mock_demo: Optional[bool] = Field(True, description="Sync sample applications if no token")


class UpdateApplicationRequest(BaseModel):
    status: Optional[str] = Field(None, description="Status: applied, shortlisted, interview, offer, rejected")
    notes: Optional[str] = Field(None, description="User interview or recruiter notes")
    interview_date: Optional[str] = Field(None, description="Interview scheduled date/time")
    company: Optional[str] = None
    role: Optional[str] = None
    platform: Optional[str] = None
    resume_match_percent: Optional[int] = None


class CreateApplicationRequest(BaseModel):
    company: str
    role: str
    platform: Optional[str] = "Direct"
    status: Optional[str] = "applied"
    applied_date: Optional[str] = None
    interview_date: Optional[str] = None
    salary_estimate: Optional[str] = None
    notes: Optional[str] = None
    resume_match_percent: Optional[int] = 75


@router.post("/sync-email")
def sync_email_applications(req: SyncEmailRequest):
    """
    Syncs candidate inbox from Gmail API or loads curated 30-application demo suite.
    Extracts Company, Role, Status, Interview Date & Platform.
    """
    try:
        result = gmail_sync_service.sync_user_inbox(
            user_id=req.user_id,
            access_token=req.access_token,
            refresh_token=req.refresh_token,
            user_email=req.user_email,
            mock_demo=req.mock_demo if req.access_token is None else False
        )
        return {
            "status": "success",
            "message": f"Successfully parsed and synced {result['synced_count']} job applications",
            "synced_count": result["synced_count"],
            "applications": result["applications"],
            "connected_email": result.get("connected_email", req.user_email),
            "is_real_inbox": result.get("is_real_inbox", False),
            "synced_at": result["synced_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email sync failed: {str(e)}")


@router.get("/list/{user_id}")
def get_user_applications(
    user_id: str = Path(..., description="Firebase User UID"),
    status: Optional[str] = Query(None, description="Filter by status (applied, shortlisted, interview, offer, rejected)"),
    platform: Optional[str] = Query(None, description="Filter by portal (Naukri, Internshala, LinkedIn, Indeed)")
):
    """
    Returns all parsed applications for the given user with optional status/platform filtering.
    """
    apps = gmail_sync_service.get_applications(user_id)
    if status and status.lower() != "all":
        apps = [a for a in apps if a.get("status", "").lower() == status.lower()]
    if platform and platform.lower() != "all":
        apps = [a for a in apps if a.get("platform", "").lower() == platform.lower()]

    return {
        "status": "success",
        "user_id": user_id,
        "total_count": len(apps),
        "applications": apps
    }


@router.get("/analytics/{user_id}")
def get_application_analytics(user_id: str = Path(..., description="Firebase User UID")):
    """
    Returns application funnel statistics (Applied -> Shortlisted -> Interviews -> Offers)
    along with conversion rates, platform breakdown, and timeline trend data.
    """
    analytics = gmail_sync_service.get_analytics(user_id)
    return {
        "status": "success",
        "user_id": user_id,
        **analytics
    }


@router.put("/update/{user_id}/{app_id}")
def update_application(
    user_id: str = Path(...),
    app_id: str = Path(...),
    req: UpdateApplicationRequest = ...
):
    """
    Manual status correction or notes update for an application.
    """
    updates = {k: v for k, v in req.dict().items() if v is not None}
    updated_app = gmail_sync_service.update_application(user_id, app_id, updates)
    if not updated_app:
        raise HTTPException(status_code=404, detail="Application not found")
    return {
        "status": "success",
        "message": "Application updated successfully",
        "application": updated_app
    }


@router.post("/create/{user_id}")
def create_application_manual(
    user_id: str = Path(...),
    req: CreateApplicationRequest = ...
):
    """
    Manually create an application outside of automated email sync.
    """
    new_app = gmail_sync_service.create_application(user_id, req.dict())
    return {
        "status": "success",
        "message": "Application created successfully",
        "application": new_app
    }


@router.delete("/delete/{user_id}/{app_id}")
def delete_application(
    user_id: str = Path(...),
    app_id: str = Path(...)
):
    """
    Delete an application entry.
    """
    success = gmail_sync_service.delete_application(user_id, app_id)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found")
    return {
        "status": "success",
        "message": "Application deleted successfully"
    }


@router.get("/recommendations/{user_id}")
def get_actionable_recommendations(user_id: str = Path(..., description="Firebase User UID")):
    """
    Returns AI-generated smart recommendations:
    1. Follow-up: applied > 7 days ago (e.g. TCS)
    2. Interview prep: upcoming interviews (e.g. Amazon Round 2)
    3. Resume improvement: match < 70% (e.g. Microsoft)
    """
    recs = gmail_sync_service.get_recommendations(user_id)
    return {
        "status": "success",
        "user_id": user_id,
        "recommendations": recs
    }


class ParseSingleEmailRequest(BaseModel):
    user_id: str = Field(..., description="User UID")
    from_address: str = Field("jobs-noreply@linkedin.com", description="Sender email address")
    subject: str = Field("Job Application Update", description="Subject line of email")
    body: str = Field(..., description="Email body snippet or notification text")


@router.post("/parse-single")
def parse_single_email_endpoint(req: ParseSingleEmailRequest):
    """
    Parses a single raw job notification email using the AI keyword & regex parser,
    extracts Company, Role, Status, and Interview dates, and appends to user's tracker.
    """
    try:
        email_data = {
            "from": req.from_address,
            "subject": req.subject,
            "body": req.body
        }
        parsed = parse_application_email(email_data)
        saved = gmail_sync_service.create_application(req.user_id, {
            "company": parsed.get("company", "Company"),
            "role": parsed.get("role", "Software Engineer"),
            "platform": parsed.get("platform", "Direct"),
            "status": parsed.get("status", "applied"),
            "applied_date": parsed.get("applied_date"),
            "interview_date": parsed.get("interview_date"),
            "interview_round": parsed.get("interview_round"),
            "notes": parsed.get("snippet") or req.body[:150],
            "resume_match_percent": parsed.get("resume_match_percent", 78),
            "confidence": parsed.get("confidence", 0.92)
        })
        return {
            "status": "success",
            "message": f"Successfully parsed email for {parsed.get('company')} ({parsed.get('status')})",
            "parsed_application": parsed,
            "saved_application": saved
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse email: {str(e)}")

