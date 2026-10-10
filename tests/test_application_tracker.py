"""
Unit and Integration Tests for Station 10: Application Tracker
Verifies:
1. Empty Gmail handling (0 applications, no fake data injection)
2. Portal-specific email parsing (LinkedIn, Naukri, Internshala, Indeed)
3. Multi-format date extraction (standard, relative, timestamped)
4. Deduplication engine (unique card per company+role)
5. Follow-up detection and status progression (Applied -> Shortlisted -> Interview)
6. Zero mock data on real sync & get
"""

import sys
import os
from datetime import datetime, timedelta

# Ensure backend/ml/services is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "ml", "services")))

from email_parser import (
    parse_application_email,
    extract_company_name,
    extract_role,
    extract_interview_date,
    detect_status_and_confidence,
    extract_platform_from_sender,
)
from gmail_service import (
    GmailApplicationSyncService,
    deduplicate_applications,
)


def test_empty_gmail_returns_zero_applications():
    """
    Test 1: Empty Gmail
    When user connects a real Gmail account with no job emails,
    system must return 0 applications, NOT 30 fake ones.
    """
    service = GmailApplicationSyncService()
    test_uid = "empty_user_123"

    # User sync with no token (or empty inbox) and mock_demo=False
    result = service.sync_user_inbox(
        user_id=test_uid,
        access_token=None,
        user_email="fresh_candidate@gmail.com",
        mock_demo=False
    )

    assert result["synced_count"] == 0
    assert result["applications"] == []
    assert len(service.get_applications(test_uid)) == 0


def test_real_linkedin_email_parsing():
    """
    Test 2: Real LinkedIn email parsing
    Verifies company, role, platform, and applied status.
    """
    raw_email = {
        "id": "msg_lnk_99",
        "from": "jobs-noreply@linkedin.com",
        "subject": "You applied for Software Engineer at Google",
        "body": "Your application for Software Engineer at Google was submitted on Oct 02, 2026. View your application on LinkedIn.",
        "date": "2026-10-02"
    }

    parsed = parse_application_email(raw_email)
    assert parsed["company"] == "Google"
    assert "Software Engineer" in parsed["role"]
    assert parsed["platform"] == "LinkedIn"
    assert parsed["status"] == "applied"
    assert parsed["applied_date"] == "2026-10-02"
    assert "msg_lnk_99" in parsed["email_ids"]


def test_real_naukri_email_parsing():
    """
    Test 3: Real Naukri email parsing
    Verifies company, role, and platform.
    """
    raw_email = {
        "id": "msg_nak_88",
        "from": "naukri@notification.naukri.com",
        "subject": "Applied to Infosys for Specialist Programmer position",
        "body": "Thank you for applying to Infosys. Your application for Specialist Programmer position has been sent to the recruiter.",
        "date": "2026-10-03"
    }

    parsed = parse_application_email(raw_email)
    assert parsed["company"] == "Infosys"
    assert "Specialist Programmer" in parsed["role"]
    assert parsed["platform"] == "Naukri"
    assert parsed["status"] == "applied"


def test_real_internshala_email_parsing():
    """
    Test 4: Real Internshala email parsing
    """
    raw_email = {
        "id": "msg_int_77",
        "from": "student@internshala.com",
        "subject": "Shortlisted by Razorpay: Backend Developer Intern",
        "body": "Congratulations! Your application has been shortlisted by Razorpay for Backend Developer Intern. Complete the assessment task.",
        "date": "2026-10-04"
    }

    parsed = parse_application_email(raw_email)
    assert parsed["company"] == "Razorpay"
    assert "Backend Developer" in parsed["role"]
    assert parsed["platform"] == "Internshala"
    assert parsed["status"] == "shortlisted"


def test_multi_format_date_extraction():
    """
    Test 5: Multi-format interview date extraction
    """
    # Format 1: "Oct 15 at 2:00 PM IST"
    d1 = extract_interview_date("Your interview is scheduled on Oct 15 at 2:00 PM IST via Google Meet.")
    assert d1 is not None and "Oct 15" in d1

    # Format 2: ISO Date "2026-10-25"
    d2 = extract_interview_date("Please join the panel on 2026-10-25 for technical screening.")
    assert d2 == "2026-10-25"

    # Format 3: "October 18, 2026"
    d3 = extract_interview_date("Interview scheduled for October 18, 2026.")
    assert d3 is not None and "October 18" in d3

    # Format 4: Relative "in 4 days"
    d4 = extract_interview_date("Your round will take place in 4 days.")
    assert d4 is not None


def test_deduplication_engine():
    """
    Test 6: Deduplication Engine
    Multiple emails regarding the same company + role should produce 1 card,
    with all message IDs linked.
    """
    email_1 = {
        "id": "msg_001",
        "company": "Amazon",
        "role": "SDE-1",
        "status": "applied",
        "platform": "LinkedIn",
        "applied_date": "2026-10-01",
        "email_ids": ["msg_001"]
    }
    email_2 = {
        "id": "msg_002",
        "company": "Amazon",
        "role": "SDE-1",
        "status": "shortlisted",
        "platform": "LinkedIn",
        "applied_date": "2026-10-03",
        "email_ids": ["msg_002"]
    }

    merged = deduplicate_applications([email_1, email_2])

    assert len(merged) == 1
    assert merged[0]["company"] == "Amazon"
    assert merged[0]["status"] == "shortlisted"
    assert "msg_001" in merged[0]["email_ids"]
    assert "msg_002" in merged[0]["email_ids"]


def test_follow_up_detection_and_status_progression():
    """
    Test 7: Follow-Up Email Detection
    Day 1: "Applied" email -> card: Applied
    Day 8: "Interview scheduled" email -> updates existing card to Interview,
    extracts interview date, links both emails, no duplicate cards created.
    """
    email_applied = {
        "id": "msg_amz_applied",
        "from": "jobs-noreply@linkedin.com",
        "subject": "You applied for Software Engineer at Amazon",
        "body": "Thank you for applying to Amazon for the Software Engineer role.",
        "date": "2026-09-25"
    }
    email_interview = {
        "id": "msg_amz_interview",
        "from": "recruiting@amazon.com",
        "subject": "Interview Invitation: Amazon - Software Engineer",
        "body": "We are pleased to invite you for your Technical Interview on Oct 12 at 2:00 PM IST via Amazon Chime.",
        "date": "2026-10-03"
    }

    parsed_1 = parse_application_email(email_applied)
    parsed_2 = parse_application_email(email_interview)

    # Initial application synced
    stage1 = deduplicate_applications([parsed_1])
    assert len(stage1) == 1
    assert stage1[0]["status"] == "applied"
    assert stage1[0]["email_ids"] == ["msg_amz_applied"]

    # Follow-up arrives 8 days later
    stage2 = deduplicate_applications([parsed_2], existing_apps=stage1)
    assert len(stage2) == 1  # Still 1 card! No duplicate!
    assert stage2[0]["status"] == "interview"  # Upgraded to interview!
    assert stage2[0]["interview_date"] is not None
    assert "Oct 12" in stage2[0]["interview_date"]
    assert "msg_amz_applied" in stage2[0]["email_ids"]
    assert "msg_amz_interview" in stage2[0]["email_ids"]


def test_no_hardcoded_data_in_fresh_sync():
    """
    Test 8: Zero fake data on fresh sync & get_applications
    """
    service = GmailApplicationSyncService()
    fresh_user = "user_no_fake_data_999"

    # User has not synced yet
    assert service.get_applications(fresh_user) == []

    # User syncs real account with no job emails
    res = service.sync_user_inbox(fresh_user, mock_demo=False)
    assert res["synced_count"] == 0
    assert res["applications"] == []
    assert service.get_applications(fresh_user) == []
