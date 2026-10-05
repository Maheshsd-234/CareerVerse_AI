"""FastAPI routes for Resume management (Station 09: Resume Builder)."""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import Response

from backend.models.resume_models import (
    Resume,
    ResumeCreateRequest,
    ResumeSectionUpdateRequest,
    ResumeExportRequest,
    ResumeDuplicateRequest
)
from backend.services.resume_builder import ResumeBuilder
from backend.services.resume_export import ResumeExporter
from backend.services.resume_db import ResumeDB
from backend.services.ats_analyzer import ATSAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resumes", tags=["Station 09 - Resumes"])

# Service singletons
resume_db = ResumeDB()
ats_analyzer = ATSAnalyzer(resume_db=resume_db)
resume_builder = ResumeBuilder(resume_db=resume_db, ats_analyzer=ats_analyzer)
resume_exporter = ResumeExporter()

@router.post("/create", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_resume_endpoint(request: ResumeCreateRequest):
    """Create a new resume initialized from a template."""
    user_id = request.userId or "guest_user"
    personal_info_dict = request.personalInfo.model_dump() if request.personalInfo else None
    
    result = await resume_builder.create_resume(
        user_id=user_id,
        template=request.template,
        title=request.title,
        personal_info=personal_info_dict
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to create resume"))
    return result

@router.get("", response_model=List[Dict[str, Any]])
async def list_resumes_endpoint(userId: Optional[str] = Query("guest_user")):
    """List all resumes for a user."""
    resumes = await resume_builder.get_all_resumes(userId)
    return resumes

@router.get("/{resumeId}", response_model=Dict[str, Any])
async def get_resume_endpoint(resumeId: str, userId: Optional[str] = Query("guest_user")):
    """Retrieve single resume by ID."""
    resume = await resume_builder.get_resume(userId, resumeId)
    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume '{resumeId}' not found")
    return resume

@router.put("/{resumeId}/sections/{section}", response_model=Dict[str, Any])
async def update_resume_section_endpoint(
    resumeId: str,
    section: str,
    payload: ResumeSectionUpdateRequest,
    userId: Optional[str] = Query("guest_user")
):
    """Update a specific resume section with instant ATS re-scoring."""
    result = await resume_builder.update_resume_section(
        user_id=userId,
        resume_id=resumeId,
        section=section,
        data=payload.data
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Update failed"))
    return result

@router.post("/{resumeId}/export")
async def export_resume_endpoint(
    resumeId: str,
    request: ResumeExportRequest,
    userId: Optional[str] = Query("guest_user")
):
    """Export resume to PDF (formatted / ATS), DOCX, or TXT."""
    resume = None
    if request.resume_data:
        try:
            resume = Resume(**request.resume_data)
        except Exception as ex:
            logger.warning(f"Could not parse direct resume_data: {ex}")

    if not resume:
        resume = await resume_builder.get_resume(userId, resumeId)

    if not resume:
        # Safe fallback so export never fails with 404 even for unsaved or demo resumes
        sample_dict = resume_builder._get_sample_resume_data("modern")
        sample_dict["id"] = resumeId
        sample_dict["userId"] = userId
        resume = Resume(**sample_dict)

    try:
        content_bytes, media_type, filename = resume_exporter.export(resume, request.format)
        return Response(
            content=content_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logger.error(f"Resume export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resumeId}", response_model=Dict[str, Any])
async def delete_resume_endpoint(resumeId: str, userId: Optional[str] = Query("guest_user")):
    """Delete a resume document."""
    result = await resume_builder.delete_resume(userId, resumeId)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Delete failed"))
    return result

@router.post("/{resumeId}/duplicate", response_model=Dict[str, Any])
async def duplicate_resume_endpoint(
    resumeId: str,
    payload: ResumeDuplicateRequest,
    userId: Optional[str] = Query("guest_user")
):
    """Duplicate an existing resume."""
    result = await resume_builder.duplicate_resume(userId, resumeId, payload.newTitle)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Duplicate failed"))
    return result
