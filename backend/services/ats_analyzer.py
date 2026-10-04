"""ATS Analyzer Service: parses resumes, evaluates ATS compatibility, detects metrics,
matches against Job Descriptions, and produces actionable scoring and recommendations.
"""

import os
import re
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

import PyPDF2
from docx import Document

from backend.config.resume_config import ATS_CORE_KEYWORDS, HIGH_PRIORITY_KEYWORDS, SCORING_WEIGHTS

logger = logging.getLogger(__name__)

# Standard English stopwords fallback
FALLBACK_STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
    'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
    'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as',
    'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
}

class ATSAnalyzer:
    """Analyzes resumes for ATS compatibility, keyword density, and JD matching."""

    def __init__(self, db_client=None, resume_db=None):
        self.db = db_client
        self.resume_db = resume_db
        self.ats_keywords = ATS_CORE_KEYWORDS
        self.high_priority_keywords = HIGH_PRIORITY_KEYWORDS
        self.stop_words = FALLBACK_STOPWORDS

    async def analyze(
        self,
        file_path: str,
        job_description: Optional[str] = None,
        user_id: Optional[str] = "guest_user",
        resume_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Main resume analysis method from file path."""
        try:
            # 1. Parse text from file
            resume_text = await self._parse_resume(file_path)

            # 2. Check formatting
            formatting_issues = await self._check_formatting(file_path)

            # 3. Analyze keywords
            keyword_analysis = self._analyze_keywords(resume_text)

            # 4. Check for metrics
            metrics_found = self._check_for_metrics(resume_text)

            # 5. Simulate ATS parsing
            parsed_text = self._simulate_ats_parsing(resume_text)

            # 6. Compare with Job Description
            jd_comparison = None
            if job_description and job_description.strip():
                jd_comparison = self._compare_with_jd(resume_text, job_description)

            # 7. Calculate overall ATS scores
            ats_score = self._calculate_ats_score(
                formatting_issues,
                keyword_analysis,
                metrics_found,
                jd_comparison
            )

            # 8. Actionable recommendations
            recommendations = self._generate_recommendations(
                formatting_issues,
                keyword_analysis,
                jd_comparison,
                ats_score
            )

            # Warnings check
            warnings = []
            if len(resume_text.strip()) < 200:
                warnings.append("Resume contains very little text. Ensure content is readable by text extractors.")
            if ats_score.get("overall", 0) < 60:
                warnings.append("Overall ATS match is below recommended threshold (70%). Follow prioritized actions.")

            analysis_id = f"analysis_{uuid.uuid4().hex[:8]}"
            analysis_result = {
                'id': analysis_id,
                'userId': user_id or 'guest_user',
                'resumeId': resume_id,
                'analyzedAt': datetime.utcnow().isoformat(),
                'atsScore': ats_score,
                'keywords': keyword_analysis,
                'formattingIssues': formatting_issues,
                'metricsFound': metrics_found,
                'jdComparison': jd_comparison,
                'recommendations': recommendations,
                'parsedText': parsed_text[:600],
                'warnings': warnings,
                'fileName': os.path.basename(file_path)
            }

            # Save in DB if available
            if self.resume_db and user_id:
                await self.resume_db.save_ats_analysis(user_id, analysis_id, analysis_result)

            return {
                'success': True,
                'analysisId': analysis_id,
                'analysis': analysis_result,
                'atsScore': ats_score,
                'keywords': keyword_analysis,
                'formattingIssues': formatting_issues,
                'metricsFound': metrics_found,
                'jdComparison': jd_comparison,
                'recommendations': recommendations,
                'parsedText': parsed_text[:600],
                'warnings': warnings
            }

        except Exception as e:
            logger.error(f"ATS analysis error: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

    async def analyze_resume_object(self, resume: dict, job_description: Optional[str] = None) -> Dict[str, Any]:
        """Analyze resume directly from structured dictionary object (for live preview in builder)."""
        try:
            resume_text = self._resume_dict_to_text(resume)
            keyword_analysis = self._analyze_keywords(resume_text)
            metrics_found = self._check_for_metrics(resume_text)
            parsed_text = self._simulate_ats_parsing(resume_text)

            formatting_issues = []
            # Check length heuristic
            word_count = len(resume_text.split())
            if word_count < 150:
                formatting_issues.append({
                    'id': 'low_content',
                    'severity': 'warning',
                    'type': 'insufficient_content',
                    'description': f'Resume is only {word_count} words.',
                    'suggestion': 'Expand on project details and quantifiable responsibilities.'
                })
            elif word_count > 1200:
                formatting_issues.append({
                    'id': 'too_long',
                    'severity': 'warning',
                    'type': 'length_warning',
                    'description': f'Resume is {word_count} words (may exceed 2 pages).',
                    'suggestion': 'Concise bullet points help human recruiters scan quicker.'
                })

            jd_comparison = None
            if job_description and job_description.strip():
                jd_comparison = self._compare_with_jd(resume_text, job_description)

            ats_score = self._calculate_ats_score(
                formatting_issues,
                keyword_analysis,
                metrics_found,
                jd_comparison
            )

            recommendations = self._generate_recommendations(
                formatting_issues,
                keyword_analysis,
                jd_comparison,
                ats_score
            )

            return {
                'success': True,
                'atsScore': ats_score,
                'keywords': keyword_analysis,
                'formattingIssues': formatting_issues,
                'metricsFound': metrics_found,
                'jdComparison': jd_comparison,
                'recommendations': recommendations,
                'parsedText': parsed_text[:600]
            }
        except Exception as e:
            logger.error(f"Resume object analysis failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'atsScore': {'overall': 50, 'formatting': 80, 'readability': 70, 'keywords': 40, 'metrics': 40, 'parsing': 85},
                'keywords': {'found': [], 'missing': [], 'foundCount': 0, 'totalChecked': len(self.ats_keywords), 'matchPercentage': 0},
                'recommendations': {'immediate': [], 'shortTerm': [], 'longTerm': []}
            }

    def _resume_dict_to_text(self, resume: dict) -> str:
        """Serialize structured resume dict into unified searchable text."""
        parts: List[str] = []

        pi = resume.get('personalInfo', {})
        if isinstance(pi, dict):
            parts.extend([
                pi.get('fullName', ''),
                pi.get('email', ''),
                pi.get('phone', ''),
                pi.get('location', '')
            ])

        parts.append(resume.get('summary', ''))

        for exp in resume.get('experience', []):
            if isinstance(exp, dict):
                parts.append(exp.get('company', ''))
                parts.append(exp.get('role', ''))
                parts.append(exp.get('description', ''))
                parts.extend(exp.get('bullets', []))
                parts.extend(exp.get('skills', []))

        for edu in resume.get('education', []):
            if isinstance(edu, dict):
                parts.append(edu.get('institution', ''))
                parts.append(edu.get('degree', ''))
                parts.append(edu.get('field', ''))
                parts.extend(edu.get('relevantCoursework', []))

        for sk in resume.get('skills', []):
            if isinstance(sk, dict):
                parts.append(sk.get('skillName', ''))
            elif isinstance(sk, str):
                parts.append(sk)

        for proj in resume.get('projects', []):
            if isinstance(proj, dict):
                parts.append(proj.get('title', ''))
                parts.append(proj.get('description', ''))
                parts.extend(proj.get('technologies', []))
                parts.extend(proj.get('achievements', []))

        for cert in resume.get('certifications', []):
            if isinstance(cert, dict):
                parts.append(cert.get('title', ''))
                parts.append(cert.get('issuer', ''))

        return ' '.join(str(p) for p in parts if p)

    async def _parse_resume(self, file_path: str) -> str:
        """Extract plain text from uploaded resume file."""
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            return self._extract_from_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return self._extract_from_docx(file_path)
        elif ext in ['.txt', '.rtf']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file format: {ext}. Please provide PDF, DOCX, or TXT.")

    def _extract_from_pdf(self, file_path: str) -> str:
        text = ""
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return text

    def _extract_from_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text]
        # Also extract table text
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text:
                        paragraphs.append(cell.text)
        return "\n".join(paragraphs)

    async def _check_formatting(self, file_path: str) -> List[dict]:
        """Detect ATS red-flags such as multiple columns, embedded tables, and images."""
        issues = []
        ext = os.path.splitext(file_path)[1].lower()

        try:
            if ext == '.pdf':
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    page_count = len(reader.pages)
                    if page_count > 2:
                        issues.append({
                            'id': 'page_length_pdf',
                            'severity': 'warning',
                            'type': 'excessive_pages',
                            'description': f'Resume contains {page_count} pages.',
                            'suggestion': 'ATS scanners and screeners favor 1-2 concise pages.'
                        })
                    if page_count == 0:
                        issues.append({
                            'id': 'empty_pdf',
                            'severity': 'error',
                            'type': 'no_content',
                            'description': 'PDF has no readable pages.',
                            'suggestion': 'Ensure the PDF contains selectable text and is not a scanned image.'
                        })

            elif ext in ['.docx', '.doc']:
                doc = Document(file_path)
                if len(doc.tables) > 1:
                    issues.append({
                        'id': 'table_layout',
                        'severity': 'warning',
                        'type': 'tables_detected',
                        'description': f'Document contains {len(doc.tables)} tables.',
                        'suggestion': 'Certain ATS parsers fail to parse multi-column tables cleanly. Use standard bulleted lists.'
                    })

                image_count = 0
                for rel in doc.part.rels.values():
                    if "image" in rel.target_ref:
                        image_count += 1

                if image_count > 0:
                    issues.append({
                        'id': 'images_detected',
                        'severity': 'info',
                        'type': 'graphic_elements',
                        'description': f'Found {image_count} graphics/images.',
                        'suggestion': 'Keep avatars and icons minimal; ATS parser ignores non-text artifacts.'
                    })
        except Exception as e:
            logger.warning(f"Error checking formatting for {file_path}: {e}")

        return issues

    def _analyze_keywords(self, resume_text: str) -> Dict[str, Any]:
        """Scan resume text against standard ATS keywords bank and identify missing essentials."""
        found = []
        missing = []
        text_lower = resume_text.lower()

        for kw in self.ats_keywords:
            kw_clean = kw.lower()
            # Use regex word boundary where appropriate
            pattern = r'\b' + re.escape(kw_clean) + r'\b'
            matches = list(re.finditer(pattern, text_lower))
            if matches:
                found.append({
                    'keyword': kw,
                    'count': len(matches),
                    'found': True,
                    'locations': [m.start() for m in matches[:5]]
                })
            else:
                priority = 'high' if kw in self.high_priority_keywords else 'medium'
                missing.append({
                    'keyword': kw,
                    'priority': priority
                })

        found_count = len(found)
        total = len(self.ats_keywords)
        pct = round((found_count / total * 100), 1) if total else 0.0

        return {
            'found': found,
            'missing': missing,
            'foundCount': found_count,
            'totalChecked': total,
            'matchPercentage': pct
        }

    def _check_for_metrics(self, resume_text: str) -> Dict[str, Any]:
        """Verify presence of quantifiable business outcomes (%, $, X improvements)."""
        metric_regexes = [
            r'\b\d+(?:\.\d+)?%',                           # 25%, 99.4%
            r'\$\s?\d+(?:,\d+)*(?:\.\d+)?(?:\s?[KkMmBb])?', # $50K, $1.2M, $500,000
            r'\b\d+(?:\.\d+)?[xX]\b',                       # 3x, 10x
            r'\bincreased\s+by\s+\d+',                      # increased by 40
            r'\breduced\s+by\s+\d+',                        # reduced by 30
            r'\bsaved\s+\$?\d+'                            # saved $10,000
        ]

        found_items = []
        for reg in metric_regexes:
            matches = re.findall(reg, resume_text, flags=re.IGNORECASE)
            found_items.extend(matches)

        unique_metrics = list(dict.fromkeys(found_items))[:12]
        has_adequate = len(unique_metrics) >= 3

        return {
            'metricsFound': len(unique_metrics),
            'examples': unique_metrics,
            'hasMetrics': has_adequate,
            'recommendation': 'Excellent quantitative impact demonstrated!' if has_adequate else 'Add more measurable results (e.g. "Boosted throughput by 35%") to attract hiring managers.'
        }

    def _simulate_ats_parsing(self, resume_text: str) -> str:
        """Strip styling noise to preview what an applicant tracking parser extracts."""
        parsed = re.sub(r'[•\-\*\u2022\u25cf\u25cb]', ' ', resume_text)
        parsed = re.sub(r'\s+', ' ', parsed)
        parsed = re.sub(r'[^a-zA-Z0-9\s\.,\-\(\)/@]', '', parsed)
        return parsed.strip()

    def _compare_with_jd(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Perform bi-directional skill comparison against target job description."""
        jd_skills = self._extract_skills_from_text(job_description)
        resume_skills = self._extract_skills_from_text(resume_text)

        resume_skills_lower = {s.lower() for s in resume_skills}
        matching = [s for s in jd_skills if s.lower() in resume_skills_lower]
        missing = [s for s in jd_skills if s.lower() not in resume_skills_lower]

        total_jd = len(jd_skills)
        match_pct = round((len(matching) / total_jd * 100), 1) if total_jd > 0 else 75.0

        required_skills = [
            {'skill': s, 'found': True, 'frequency': job_description.lower().count(s.lower())}
            for s in matching
        ]
        nice_to_have = [
            {'skill': s, 'found': False, 'frequency': job_description.lower().count(s.lower())}
            for s in missing
        ]

        recommendations = []
        if missing:
            top_missing = missing[:4]
            recommendations.append(f"Target JD strongly looks for: {', '.join(top_missing)}. Incorporate your relevant work with these.")
        if match_pct >= 80:
            recommendations.append("High qualification match with target JD! Proceed with confidence.")
        else:
            recommendations.append("Tailor bullet points to reflect role-specific terminology found in the JD.")

        return {
            'jobDescriptionId': 'custom_jd',
            'matchPercentage': match_pct,
            'requiredSkills': required_skills,
            'niceToHaveSkills': nice_to_have,
            'matchingSkills': matching,
            'missingSkills': missing,
            'recommendations': recommendations
        }

    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract identified technical competencies from raw text."""
        skills_found = []
        text_lower = text.lower()
        for kw in self.ats_keywords:
            if re.search(r'\b' + re.escape(kw.lower()) + r'\b', text_lower):
                skills_found.append(kw)
        return list(dict.fromkeys(skills_found))

    def _calculate_ats_score(
        self,
        formatting_issues: List[dict],
        keywords: dict,
        metrics: dict,
        jd_comp: Optional[dict]
    ) -> Dict[str, float]:
        """Synthesize overall and multi-dimensional ATS readiness scores."""
        scores: Dict[str, float] = {}

        # Formatting score
        errors = sum(1 for i in formatting_issues if i.get('severity') == 'error')
        warnings = sum(1 for i in formatting_issues if i.get('severity') == 'warning')
        scores['formatting'] = max(20.0, float(100 - (errors * 25) - (warnings * 8)))

        # Keywords score (scale relative to target 20% coverage of whole universe)
        raw_pct = keywords.get('matchPercentage', 0.0)
        # 30% of total keyword pool is an exceptional tech resume
        keyword_score = min(100.0, (raw_pct / 25.0) * 100.0) if raw_pct > 0 else 30.0
        scores['keywords'] = round(keyword_score, 1)

        # Readability heuristic
        scores['readability'] = 88.0

        # Metrics score
        found_m = metrics.get('metricsFound', 0)
        scores['metrics'] = min(100.0, 50.0 + (found_m * 12.5))

        # Parsing fidelity
        scores['parsing'] = 92.0

        # Overall composite
        if jd_comp and 'matchPercentage' in jd_comp:
            w = SCORING_WEIGHTS['with_jd']
            overall = (
                scores['formatting'] * w['formatting'] +
                scores['keywords'] * w['keywords'] +
                scores['readability'] * w['readability'] +
                scores['metrics'] * w['metrics'] +
                jd_comp['matchPercentage'] * w['jd_match']
            )
        else:
            w = SCORING_WEIGHTS['without_jd']
            overall = (
                scores['formatting'] * w['formatting'] +
                scores['keywords'] * w['keywords'] +
                scores['readability'] * w['readability'] +
                scores['metrics'] * w['metrics']
            )

        scores['overall'] = round(min(100.0, max(10.0, overall)), 1)
        return scores

    def _generate_recommendations(
        self,
        formatting_issues: List[dict],
        keywords: dict,
        jd_comp: Optional[dict],
        ats_score: Dict[str, float]
    ) -> Dict[str, List[dict]]:
        """Synthesize structured time-prioritized recommendations."""
        immediate = []
        short_term = []
        long_term = []

        # Formatting issues
        for issue in formatting_issues:
            impact = 'high' if issue.get('severity') == 'error' else 'medium'
            immediate.append({
                'action': issue.get('suggestion', issue.get('description', '')),
                'impact': impact
            })

        # Missing High Priority Keywords
        missing_kw = [k for k in keywords.get('missing', []) if k.get('priority') == 'high']
        if missing_kw:
            top_missing = [k['keyword'] for k in missing_kw[:4]]
            immediate.append({
                'action': f"Add in-demand core keywords to your skills & projects: {', '.join(top_missing)}.",
                'impact': 'high'
            })

        # Metrics
        if ats_score.get('metrics', 0) < 70:
            short_term.append({
                'action': 'Add quantifiable metrics (e.g., percentages, latencies reduced, user volume) to at least 3 bullet points.',
                'impact': 'high'
            })

        # JD alignment
        if jd_comp and jd_comp.get('missingSkills'):
            skills_preview = ', '.join(jd_comp['missingSkills'][:3])
            short_term.append({
                'action': f"Tailor your profile to match Job Description skills: {skills_preview}.",
                'impact': 'medium'
            })

        # General enhancements
        short_term.append({
            'action': 'Ensure every project bullet begins with an active strong action verb (e.g., Architected, Engineered, Streamlined).',
            'impact': 'medium'
        })

        long_term.append({
            'action': 'Include direct links to live deployed demo applications and verified GitHub repositories.',
            'impact': 'medium'
        })
        long_term.append({
            'action': 'Acquire certified cloud or domain credentials (e.g., AWS Solutions Architect, Kubernetes CKA) to cement keyword authority.',
            'impact': 'low'
        })

        return {
            'immediate': immediate,
            'shortTerm': short_term,
            'longTerm': long_term
        }
