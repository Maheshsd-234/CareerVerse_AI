"""FastAPI routes for ATS Analysis (Station 09: ATS Analyzer Card)."""

import os
import shutil
import tempfile
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, status

from backend.models.resume_models import ATSAnalyzeResponse, ATSAnalysis
from backend.services.ats_analyzer import ATSAnalyzer
from backend.services.resume_db import ResumeDB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ats", tags=["Station 09 - ATS Analyzer"])

resume_db = ResumeDB()
ats_analyzer = ATSAnalyzer(resume_db=resume_db)

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_resume_file_endpoint(
    file: UploadFile = File(...),
    jobDescription: Optional[str] = Form(None),
    userId: Optional[str] = Form("guest_user"),
    resumeId: Optional[str] = Form(None)
):
    """Analyze uploaded resume file (PDF, DOCX, TXT) against ATS criteria and optional Job Description."""
    allowed_extensions = {".pdf", ".docx", ".doc", ".txt", ".rtf"}
    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Please upload a PDF, DOCX, or TXT resume."
        )

    # Save to a temporary file
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename or f"resume{ext}")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await ats_analyzer.analyze(
            file_path=temp_path,
            job_description=jobDescription,
            user_id=userId,
            resume_id=resumeId
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=result.get("error", "Failed to parse and analyze resume.")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during ATS analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

@router.get("/analyses/{analysisId}", response_model=Dict[str, Any])
async def get_ats_analysis_endpoint(analysisId: str, userId: Optional[str] = Query("guest_user")):
    """Fetch stored ATS analysis results by analysis ID."""
    analysis = await resume_db.get_ats_analysis(userId, analysisId)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with ID '{analysisId}' not found."
        )
    return {
        "success": True,
        "analysis": analysis
    }

@router.post("/analyze-object", response_model=Dict[str, Any])
async def analyze_resume_object_endpoint(payload: Dict[str, Any]):
    """Live analysis of structured resume object (used in real-time Resume Builder preview)."""
    resume_data = payload.get("resume", payload)
    jd = payload.get("jobDescription", None)
    result = await ats_analyzer.analyze_resume_object(resume_data, job_description=jd)
    return result
