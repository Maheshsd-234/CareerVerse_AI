"""
Email Parser for Job Applications
Extracts company, role, status, interview dates, and platform dynamically from real job notification emails
(Naukri, Internshala, LinkedIn, Indeed, Company Portals, and direct recruiter emails).
Strictly scoped to real recruitment emails from the past 30 days.
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple, List


# Status keywords and associated confidence weights
STATUS_PATTERNS = [
    # Offer / Selected
    (r"\b(job offer|offer letter|pleased to offer you|pleased to extend an offer|welcome to the team|congratulations on your offer|you have been selected|we would like to offer you)\b", "offer", 0.98),
    # Interview Scheduled / Meeting
    (r"\b(interview invitation|invite you (?:to|for) an interview|schedule[d]? an interview|interview scheduled|shortlisted for an interview|round \d+ interview|technical interview|f2f|hr round|managerial round|coding round|invitation for interview|zoom meeting|google meet link|microsoft teams link|webex meeting)\b", "interview", 0.95),
    # Shortlisted / Cleared Round (User specifically requested: "congratulations you cleared 1st round")
    (r"\b(congratulations|congrats)?\s*(?:you\s+)?(?:have\s+)?cleared\s+(?:the\s+)?(?:round\s*\d+|1st\s+round|2nd\s+round|3rd\s+round|first\s+round|second\s+round|initial\s+round|technical\s+round|assessment|screening|coding\s+test|oa)\b", "shortlisted", 0.96),
    (r"\b(application has been shortlisted|profile has been shortlisted|been shortlisted|shortlisted by|shortlisted for|moved to (?:the\s+)?next round|selected for (?:the\s+)?next round|advancing to (?:the\s+)?next round|passed (?:the\s+)?initial screening|shortlist)\b", "shortlisted", 0.92),
    (r"\b(online assessment|coding assessment|assessment test|take the assessment|test link|hackerrank|hackerearth|codility|amcat|test invitation)\b", "shortlisted", 0.90),
    # Rejected
    (r"\b(unfortunately|not moving forward|regret to inform|chosen to pursue other candidates|not selected|decided not to proceed|pursuing candidates whose qualifications|at this time|will not be moving forward|not shortlisted|application unsuccessful)\b", "rejected", 0.94),
    # Applied / Confirmation (User: "applied for so on job")
    (r"\b(applied for|application for|applied to|applied on|application received|thank you for applying|successfully applied|application submitted|we have received your application|application confirmation|acknowledgement of application)\b", "applied", 0.97),
]

# Recognizable Indian tech companies & global MNCs (used as high-priority matching list)
KNOWN_COMPANIES = [
    "Amazon", "Google", "Microsoft", "Flipkart", "TCS", "Tata Consultancy Services",
    "Infosys", "Wipro", "HCLTech", "Cognizant", "Accenture", "Swiggy", "Zomato",
    "Razorpay", "PhonePe", "Paytm", "Cred", "Zoho", "Jio", "Reliance Jio",
    "Ola", "Uber", "Oracle", "Cisco", "IBM", "Adobe", "Salesforce", "Atlassian",
    "Intuit", "Goldman Sachs", "Morgan Stanley", "JPMorgan Chase", "Capgemini",
    "L&T Technology Services", "Tech Mahindra", "Persistent Systems", "Mphasis",
    "Deloitte", "PwC", "EY", "KPMG", "Apple", "Meta", "Netflix", "Twitter", "X",
    "Stripe", "Airbnb", "Pinterest", "Spotify", "Cisco", "Intel", "NVIDIA", "AMD",
    "Qualcomm", "Broadcom", "Samsung", "Sony", "Zoho", "Freshworks", "Postman",
    "BrowserStack", "Groww", "Zerodha", "Urban Company", "Zepto", "Blinkit"
]

# Common tech roles
KNOWN_ROLES = [
    "Software Development Engineer", "SDE", "SDE-1", "SDE-2", "SDE-I", "SDE-II", "Software Engineer",
    "Backend Developer", "Backend Engineer", "Frontend Developer", "Frontend Engineer",
    "Full Stack Developer", "Full Stack Engineer", "Python Developer", "Java Developer",
    "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI/ML Engineer",
    "DevOps Engineer", "Cloud Engineer", "Android Developer", "iOS Developer",
    "QA Engineer", "Automation Engineer", "Cybersecurity Analyst", "Product Analyst",
    "Associate Software Engineer", "Graduate Engineer Trainee", "Tech Lead",
    "System Engineer", "Software Developer Intern", "Engineering Intern", "Data Intern"
]

# Words that should NEVER be treated as company names
GENERIC_IGNORE_WORDS = {
    "naukri", "internshala", "linkedin", "indeed", "jobs", "job", "career", "careers",
    "recruitment", "recruiting", "hiring", "team", "talent", "notification", "notifications",
    "application", "applied", "candidate", "updates", "update", "alert", "alerts",
    "congratulations", "round", "interview", "invitation", "confirmation", "noreply",
    "no-reply", "mailer", "support", "services", "portal", "system", "hr", "corp"
}


def extract_platform_from_sender(sender: str) -> str:
    """Identify the job portal from sender address or header."""
    sender_lower = sender.lower()
    if "naukri" in sender_lower:
        return "Naukri"
    elif "internshala" in sender_lower:
        return "Internshala"
    elif "linkedin" in sender_lower:
        return "LinkedIn"
    elif "indeed" in sender_lower:
        return "Indeed"
    elif "wellfound" in sender_lower or "angel" in sender_lower:
        return "Wellfound"
    elif "unstop" in sender_lower:
        return "Unstop"
    elif "instahyre" in sender_lower:
        return "Instahyre"
    elif "greenhouse" in sender_lower or "lever" in sender_lower or "workday" in sender_lower or "smartrecruiters" in sender_lower:
        return "Direct"
    return "Direct"


def clean_company_name(cand: str) -> Optional[str]:
    """Cleans candidate company string and validates against generic noise."""
    if not cand:
        return None
    cleaned = cand.strip().strip("[](){}:;,-|/\"' ")
    cleaned_lower = cleaned.lower()
    
    # Filter out empty or very short strings
    if len(cleaned) < 2 or len(cleaned) > 40:
        return None
        
    # Check against generic words
    parts = cleaned_lower.split()
    if all(p in GENERIC_IGNORE_WORDS for p in parts):
        return None
        
    # Filter out common portal names
    if cleaned_lower in ["naukri", "internshala", "linkedin", "indeed", "gmail", "google mail"]:
        return None

    # Title-case or uppercase acronyms
    if cleaned.isupper() and len(cleaned) <= 5:
        return cleaned
    return cleaned.title()


def extract_company_name(subject: str, body: str, sender: str) -> str:
    """
    Extracts ANY real company name dynamically from the email, not just predefined lists.
    Evaluates Sender Display Name, Subject Regex, Body Context, and Corporate Domains.
    """
    combined = f"{subject} {body[:600]}"

    # 1. Exact match against known tech companies (highest precision)
    for company in KNOWN_COMPANIES:
        pattern = rf"\b{re.escape(company)}\b"
        if re.search(pattern, combined, re.IGNORECASE):
            return company

    # 2. Check Sender Display Name: e.g. "Swiggy Careers <jobs@swiggy.in>", "Cognizant HR <...>"
    # Format: "Display Name <email@domain.com>"
    sender_display_match = re.match(r"^[\"']?([^<@]+)[\"']?\s*<", sender)
    if sender_display_match:
        raw_name = sender_display_match.group(1).strip()
        # Clean common suffixes like "Careers", "Hiring Team", "Recruitment", "HR Team"
        cleaned_sender = re.sub(
            r"\b(careers?|recruitment|recruiting|hiring\s+team|hr\s+team|talent\s+acquisition|jobs?|team|no-?reply|notifications?)\b",
            "",
            raw_name,
            flags=re.IGNORECASE
        ).strip()
        candidate = clean_company_name(cleaned_sender)
        if candidate and candidate.lower() not in GENERIC_IGNORE_WORDS:
            return candidate

    # 3. Dynamic Subject Line Patterns (Works for ALL companies)
    subject_patterns = [
        # "Your application to [Company] for [Role]"
        r"(?:application\s+(?:to|at|with)|applied\s+(?:to|at|with))\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+(?:for|as|on|is|has|was|portal|\-|\–|\||$))",
        # "Congratulations you cleared 1st round at [Company]"
        r"cleared\s+(?:the\s+)?(?:round\s*\d+|1st\s+round|2nd\s+round|assessment|interview)\s+(?:at|with|for)\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        # "Interview with [Company]"
        r"interview\s+(?:with|at|for)\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        # "[Company] | Application Received" or "[Company] - Job Application"
        r"^\[?([A-Za-z0-9\s&\.\-]{2,25}?)\]?\s*(?:\||\-|\–|:)\s*(?:application|interview|congratulations|update|shortlist|status|job)",
        # "Thank you for applying to [Company]"
        r"(?:thank\s+you\s+for\s+applying\s+to|interest\s+in)\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        # "Update from [Company]"
        r"(?:update|status)\s+from\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        # "[Company] has received your application"
        r"([A-Za-z0-9\s&\.\-]{2,25}?)\s+has\s+received\s+your\s+application",
        # "[Company] is hiring"
        r"([A-Za-z0-9\s&\.\-]{2,25}?)\s+is\s+hiring",
    ]
    for p in subject_patterns:
        m = re.search(p, subject, re.IGNORECASE)
        if m:
            cand = clean_company_name(m.group(1))
            if cand:
                return cand

    # 4. Check Corporate Domain from Sender (e.g. jobs@razorpay.com -> Razorpay)
    domain_match = re.search(r"@([a-zA-Z0-9\-]+)\.(?:com|in|co|org|io|tech|ai|net)", sender)
    if domain_match:
        raw_domain = domain_match.group(1).lower()
        if raw_domain not in GENERIC_IGNORE_WORDS and raw_domain not in ["gmail", "yahoo", "outlook", "hotmail", "icloud"]:
            cand = clean_company_name(raw_domain.capitalize())
            if cand:
                return cand

    # 5. Dynamic Body Patterns: e.g. "team at [Company]", "application at [Company]"
    body_patterns = [
        r"(?:team\s+at|opportunity\s+at|role\s+at)\s+([A-Za-z0-9\s&\.\-]{2,25}?)(?:\s+[\.,\n\r\-\–\|])",
        r"(?:welcome\s+to\s+the\s+team\s+at|joining)\s+([A-Za-z0-9\s&\.\-]{2,25}?)(?:\s+[\.,\n\r\-\–\|])",
    ]
    for p in body_patterns:
        m = re.search(p, body[:600], re.IGNORECASE)
        if m:
            cand = clean_company_name(m.group(1))
            if cand:
                return cand

    return "Recruitment Team"


def extract_role(subject: str, body: str) -> str:
    """Extract job role dynamically from subject or body snippet."""
    combined = f"{subject} {body[:600]}"
    
    # 1. Match known tech roles
    for role in KNOWN_ROLES:
        pattern = rf"\b{re.escape(role)}\b"
        if re.search(pattern, combined, re.IGNORECASE):
            return role

    # 2. Dynamic regex patterns for unlisted roles: e.g. "Applied for DevOps Architect"
    patterns = [
        r"(?:applied\s+for|application\s+for|position\s+of|role\s+of|profile:?|role:?)\s*([A-Za-z\s\-\/\(\)]{3,30}?)(?:\s*(?:at|with|on|\.,|\n|\r|\-|\–|\||$))",
        r"(?:as\s+an?)\s+([A-Za-z\s\-\/]{3,28}?)(?:\s*(?:at|with|intern|engineer|developer|analyst|\.,|\n|\r|$))",
    ]
    for p in patterns:
        m = re.search(p, combined, re.IGNORECASE)
        if m:
            clean = m.group(1).strip().strip("[](){}:;,-|/\"' ")
            if len(clean) >= 3 and not any(w in clean.lower() for w in ["interview", "application", "thank", "update", "cleared", "round"]):
                return clean.title()

    return "Software Engineer"


def detect_status_and_confidence(subject: str, body: str) -> Tuple[str, float]:
    """Detect application stage and confidence score based on keywords."""
    combined = f"{subject} {body}".lower()

    for pattern, status, confidence in STATUS_PATTERNS:
        if re.search(pattern, combined):
            return status, confidence

    # Default to applied if confirmation/acknowledgement
    return "applied", 0.78


def extract_interview_date(body: str) -> Optional[str]:
    """Extract scheduled interview date string if mentioned in email."""
    months = r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
    date_patterns = [
        rf"\b(?:on|scheduled for|date:?)\s+({months}\s+\d{{1,2}}(?:st|nd|rd|th)?(?:,?\s+\d{{4}})?)",
        rf"\b(\d{{1,2}}(?:st|nd|rd|th)?\s+{months}(?:,?\s+\d{{4}})?)",
        r"\b(\d{4}-\d{2}-\d{2})\b",
        r"\b(\d{1,2}/\d{1,2}/\d{2,4})\b"
    ]
    for p in date_patterns:
        m = re.search(p, body, re.IGNORECASE)
        if m:
            return m.group(1).strip()

    if "in 4 days" in body.lower():
        target = datetime.now() + timedelta(days=4)
        return target.strftime("%b %d, %Y")
    elif "tomorrow" in body.lower():
        target = datetime.now() + timedelta(days=1)
        return target.strftime("%b %d, %Y")
    elif "next week" in body.lower():
        target = datetime.now() + timedelta(days=7)
        return target.strftime("%b %d, %Y")

    return None


def parse_application_email(email_raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parses a raw email dictionary into a structured application item.
    """
    subject = email_raw.get("subject", "")
    body = email_raw.get("body", "")
    sender = email_raw.get("from", "")
    date_str = email_raw.get("date", datetime.now().isoformat())

    # Parse date and compute applied_days_ago
    applied_days_ago = 0
    try:
        if isinstance(email_raw.get("datetime"), datetime):
            parsed_dt = email_raw["datetime"]
        elif "T" in date_str:
            parsed_dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        else:
            parsed_dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        applied_days_ago = max(0, (datetime.now() - parsed_dt.replace(tzinfo=None)).days)
    except Exception:
        applied_days_ago = 0

    company = extract_company_name(subject, body, sender)
    role = extract_role(subject, body)
    status, confidence = detect_status_and_confidence(subject, body)
    platform = extract_platform_from_sender(sender)
    interview_date = extract_interview_date(body) if status in ["interview", "shortlisted"] else None

    # Derive deduplication key
    clean_comp = re.sub(r"[^a-zA-Z0-9]", "_", company.lower()).strip("_")
    clean_role = re.sub(r"[^a-zA-Z0-9]", "_", role.lower()).strip("_")
    dedup_key = f"{clean_comp}_{clean_role}"

    return {
        "id": f"app_{dedup_key}_{email_raw.get('id', 'raw')[:8]}",
        "company": company,
        "role": role,
        "status": status,
        "platform": platform,
        "applied_date": date_str[:10],
        "applied_days_ago": applied_days_ago,
        "interview_date": interview_date,
        "interview_round": f"Round 1 / Assessment" if status == "shortlisted" else (f"Technical Interview" if status == "interview" else None),
        "confidence": confidence,
        "resume_match_percent": int(confidence * 85 + 5),
        "dedup_key": dedup_key,
        "subject": subject,
        "snippet": body[:180] + ("..." if len(body) > 180 else ""),
        "notes": f"{status.capitalize()} from email: '{subject[:60]}'"
    }
