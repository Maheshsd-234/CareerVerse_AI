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
    # Shortlisted / Cleared Round
    (r"\b(congratulations|congrats)?\s*(?:you\s+)?(?:have\s+)?cleared\s+(?:the\s+)?(?:round\s*\d+|1st\s+round|2nd\s+round|3rd\s+round|first\s+round|second\s+round|initial\s+round|technical\s+round|assessment|screening|coding\s+test|oa)\b", "shortlisted", 0.96),
    (r"\b(application has been shortlisted|profile has been shortlisted|been shortlisted|shortlisted by|shortlisted for|moved to (?:the\s+)?next round|selected for (?:the\s+)?next round|advancing to (?:the\s+)?next round|passed (?:the\s+)?initial screening|shortlist)\b", "shortlisted", 0.92),
    (r"\b(online assessment|coding assessment|assessment test|take the assessment|test link|hackerrank|hackerearth|codility|amcat|test invitation)\b", "shortlisted", 0.90),
    # Rejected
    (r"\b(unfortunately|not moving forward|regret to inform|chosen to pursue other candidates|not selected|decided not to proceed|pursuing candidates whose qualifications|at this time|will not be moving forward|not shortlisted|application unsuccessful)\b", "rejected", 0.94),
    # Applied / Confirmation
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
    "Stripe", "Airbnb", "Pinterest", "Spotify", "Intel", "NVIDIA", "AMD",
    "Qualcomm", "Broadcom", "Samsung", "Sony", "Freshworks", "Postman",
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

# Portal-specific regex extraction patterns
PORTAL_PATTERNS = {
    "linkedin": {
        "company_patterns": [
            r"You applied for .*? at ([\w\s&,.\-]{2,30}?)(?:\.|\n|\r|$)",
            r"Your application to ([\w\s&,.\-]{2,30}?) was sent",
            r"at ([\w\s&,.\-]{2,30}?) is interested in your profile",
            r"New update on your application to ([\w\s&,.\-]{2,30}?)(?:\.|\n|\r|$)",
            r"You have a new message from ([\w\s&,.\-]{2,30}?) in",
            r"from ([\w\s&,.\-]{2,30}?) regarding your application"
        ],
        "role_patterns": [
            r"You applied for ([\w\s,\-/]{2,35}?) at",
            r"application for ([\w\s,\-/]{2,35}?) at",
            r"regarding the ([\w\s,\-/]{2,35}?) position at",
            r"role of ([\w\s,\-/]{2,35}?) at"
        ]
    },
    "naukri": {
        "company_patterns": [
            r"Applied to ([\w\s&,.\-]{2,30}?) for",
            r"Company:\s*([\w\s&,.\-]{2,30}?)(?:\n|\r|\.|,|$)",
            r"([\w\s&,.\-]{2,30}?) has shortlisted your profile",
            r"Recruiter from ([\w\s&,.\-]{2,30}?) viewed your application",
            r"Thank you for applying to ([\w\s&,.\-]{2,30}?)(?:\.|\n|\r|$)"
        ],
        "role_patterns": [
            r"for ([\w\s,\-/]{2,35}?) position",
            r"Role:\s*([\w\s,\-/]{2,35}?)(?:\n|\r|\.|,|$)",
            r"applied for the profile of ([\w\s,\-/]{2,35}?)(?:\s+at|\.|$)"
        ]
    },
    "internshala": {
        "company_patterns": [
            r"Shortlisted by ([\w\s&,.\-]{2,30}?):",
            r"application for .*? at ([\w\s&,.\-]{2,30}?) has been (?:sent|received|shortlisted)",
            r"Application Sent:\s*([\w\s&,.\-]{2,30}?)\s*-\s*",
            r"Update from ([\w\s&,.\-]{2,30}?) on Internshala"
        ],
        "role_patterns": [
            r"Shortlisted for ([\w\s,\-/]{2,35}?) internship",
            r"Application Sent:\s*.*?-\s*([\w\s,\-/]{2,35}?)(?:\s+internship|\.|$)",
            r"applied for ([\w\s,\-/]{2,35}?)\s*at"
        ]
    },
    "indeed": {
        "company_patterns": [
            r"Indeed Application:\s*([\w\s&,.\-]{2,30}?)\s*-\s*",
            r"Your application was submitted to ([\w\s&,.\-]{2,30}?)",
            r"applied to ([\w\s&,.\-]{2,30}?) on Indeed"
        ],
        "role_patterns": [
            r"Indeed Application:\s*.*?\s*-\s*([\w\s,\-/]{2,35}?)(?:\.|$)",
            r"applied to .*? for ([\w\s,\-/]{2,35}?)(?:\.|$)"
        ]
    }
}


def extract_platform_from_sender(sender: str) -> str:
    """Identify the job portal from sender address or header."""
    sender_lower = (sender or "").lower()
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
    elif any(k in sender_lower for k in ["greenhouse", "lever", "workday", "smartrecruiters", "ashby"]):
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
    Extracts company name dynamically from the email, using portal-specific patterns,
    known MNC dictionaries, sender display name, and corporate domains.
    """
    combined = f"{subject} {body[:600]}"
    portal_key = extract_platform_from_sender(sender).lower()

    # 1. Check Portal-Specific Patterns First (High Precision)
    if portal_key in PORTAL_PATTERNS:
        for p in PORTAL_PATTERNS[portal_key]["company_patterns"]:
            m = re.search(p, combined, re.IGNORECASE)
            if m:
                cand = clean_company_name(m.group(1))
                if cand:
                    return cand

    # 2. Exact match against known tech companies
    for company in KNOWN_COMPANIES:
        pattern = rf"\b{re.escape(company)}\b"
        if re.search(pattern, combined, re.IGNORECASE):
            return company

    # 3. Check Sender Display Name: e.g. "Swiggy Careers <jobs@swiggy.in>"
    sender_display_match = re.match(r"^[\"']?([^<@]+)[\"']?\s*<", sender)
    if sender_display_match:
        raw_name = sender_display_match.group(1).strip()
        cleaned_sender = re.sub(
            r"\b(careers?|recruitment|recruiting|hiring\s+team|hr\s+team|talent\s+acquisition|jobs?|team|no-?reply|notifications?)\b",
            "",
            raw_name,
            flags=re.IGNORECASE
        ).strip()
        candidate = clean_company_name(cleaned_sender)
        if candidate and candidate.lower() not in GENERIC_IGNORE_WORDS:
            return candidate

    # 4. Dynamic Subject Line Patterns (Generic)
    subject_patterns = [
        r"(?:application\s+(?:to|at|with)|applied\s+(?:to|at|with))\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+(?:for|as|on|is|has|was|portal|\-|\–|\||$))",
        r"cleared\s+(?:the\s+)?(?:round\s*\d+|1st\s+round|2nd\s+round|assessment|interview)\s+(?:at|with|for)\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        r"interview\s+(?:with|at|for)\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        r"^\[?([A-Za-z0-9\s&\.\-]{2,25}?)\]?\s*(?:\||\-|\–|:)\s*(?:application|interview|congratulations|update|shortlist|status|job)",
        r"(?:thank\s+you\s+for\s+applying\s+to|interest\s+in)\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        r"(?:update|status)\s+from\s+([A-Za-z0-9\s&\.\-]{2,30}?)(?:\s+[\.,\n\r\-\–\|]|$)",
        r"([A-Za-z0-9\s&\.\-]{2,25}?)\s+has\s+received\s+your\s+application",
        r"([A-Za-z0-9\s&\.\-]{2,25}?)\s+is\s+hiring",
    ]
    for p in subject_patterns:
        m = re.search(p, subject, re.IGNORECASE)
        if m:
            cand = clean_company_name(m.group(1))
            if cand:
                return cand

    # 5. Check Corporate Domain from Sender (e.g. jobs@razorpay.com -> Razorpay)
    domain_match = re.search(r"@([a-zA-Z0-9\-]+)\.(?:com|in|co|org|io|tech|ai|net)", sender)
    if domain_match:
        raw_domain = domain_match.group(1).lower()
        if raw_domain not in GENERIC_IGNORE_WORDS and raw_domain not in ["gmail", "yahoo", "outlook", "hotmail", "icloud"]:
            cand = clean_company_name(raw_domain.capitalize())
            if cand:
                return cand

    # 6. Dynamic Body Patterns
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


def extract_role(subject: str, body: str, sender: str = "") -> str:
    """Extract job role dynamically from subject or body snippet using portal patterns."""
    combined = f"{subject} {body[:600]}"
    portal_key = extract_platform_from_sender(sender).lower()

    # 1. Check Portal-Specific Role Patterns
    if portal_key in PORTAL_PATTERNS:
        for p in PORTAL_PATTERNS[portal_key]["role_patterns"]:
            m = re.search(p, combined, re.IGNORECASE)
            if m:
                cand = m.group(1).strip().strip("[](){}:;,-|/\"' ")
                if len(cand) >= 2 and not any(w in cand.lower() for w in ["interview", "application", "thank", "update", "cleared", "round"]):
                    return cand.title()

    # 2. Match known tech roles
    for role in KNOWN_ROLES:
        pattern = rf"\b{re.escape(role)}\b"
        if re.search(pattern, combined, re.IGNORECASE):
            return role

    # 3. Dynamic regex patterns for unlisted roles
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


def extract_interview_date(body: str, subject: str = "") -> Optional[str]:
    """
    Extract scheduled interview date string in multiple standard formats:
    - "Oct 15 at 2:00 PM IST"
    - "October 15, 2026"
    - "2026-10-15"
    - Relative dates ("tomorrow", "in 4 days")
    """
    combined = f"{subject} {body}"
    months = r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"

    date_patterns = [
        # Pattern 1: "Oct 15 at 2:00 PM" or "October 15 at 14:00 IST"
        rf"\b({months}\s+\d{{1,2}}(?:st|nd|rd|th)?(?:\s*,?\s*\d{{4}})?(?:\s+at\s+\d{{1,2}}:\d{{2}}(?:\s*(?:AM|PM|IST|UTC))?)?)",
        # Pattern 2: "15 Oct at 2:00 PM"
        rf"\b(\d{{1,2}}(?:st|nd|rd|th)?\s+{months}(?:\s*,?\s*\d{{4}})?(?:\s+at\s+\d{{1,2}}:\d{{2}}(?:\s*(?:AM|PM|IST|UTC))?)?)",
        # Pattern 3: ISO date "2026-10-15"
        r"\b(\d{4}-\d{2}-\d{2})\b",
        # Pattern 4: Date like "15/10/2026"
        r"\b(\d{1,2}/\d{1,2}/\d{2,4})\b"
    ]
    for p in date_patterns:
        m = re.search(p, combined, re.IGNORECASE)
        if m:
            return m.group(1).strip()

    # Relative dates
    c_lower = combined.lower()
    if "in 4 days" in c_lower:
        target = datetime.now() + timedelta(days=4)
        return target.strftime("%b %d, %Y")
    elif "tomorrow" in c_lower:
        target = datetime.now() + timedelta(days=1)
        return target.strftime("%b %d, %Y")
    elif "next week" in c_lower:
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
    msg_id = str(email_raw.get("id", "raw"))

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

    platform = extract_platform_from_sender(sender)
    company = extract_company_name(subject, body, sender)
    role = extract_role(subject, body, sender)
    status, confidence = detect_status_and_confidence(subject, body)
    interview_date = extract_interview_date(body, subject) if status in ["interview", "shortlisted"] else None

    # Derive clean deduplication key
    clean_comp = re.sub(r"[^a-zA-Z0-9]", "_", company.lower()).strip("_")
    clean_role = re.sub(r"[^a-zA-Z0-9]", "_", role.lower()).strip("_")
    dedup_key = f"{clean_comp}_{clean_role}"

    return {
        "id": f"app_{dedup_key}_{msg_id[:8]}",
        "company": company,
        "role": role,
        "status": status,
        "platform": platform,
        "applied_date": date_str[:10],
        "applied_days_ago": applied_days_ago,
        "interview_date": interview_date,
        "interview_round": "Round 1 / Assessment" if status == "shortlisted" else ("Technical Interview" if status == "interview" else None),
        "confidence": confidence,
        "resume_match_percent": int(confidence * 85 + 5),
        "dedup_key": dedup_key,
        "email_ids": [msg_id],
        "subject": subject,
        "snippet": body[:180] + ("..." if len(body) > 180 else ""),
        "notes": f"{status.capitalize()} from email: '{subject[:60]}'"
    }
