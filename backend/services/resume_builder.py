"""ResumeBuilder service class: handles resume lifecycle, template pre-population,
granular section updates, versioning, duplication, and automatic ATS recalculation.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from backend.config.resume_config import TEMPLATES
from backend.services.resume_db import ResumeDB
from backend.services.ats_analyzer import ATSAnalyzer

logger = logging.getLogger(__name__)

class ResumeBuilder:
    """Manages resumes for users across all lifecycle operations."""

    def __init__(self, db_client=None, resume_db: Optional[ResumeDB] = None, ats_analyzer: Optional[ATSAnalyzer] = None):
        self.db = db_client
        self.resume_db = resume_db or ResumeDB(db_client)
        self.ats_analyzer = ats_analyzer or ATSAnalyzer(db_client, self.resume_db)
        self.templates = TEMPLATES

    def get_templates(self) -> Dict[str, dict]:
        """Return available templates."""
        return self.templates

    async def create_resume(
        self,
        user_id: str,
        template: str = "ats_optimized",
        title: Optional[str] = None,
        personal_info: Optional[dict] = None
    ) -> Dict[str, Any]:
        """Create new resume from template with default initial values and calculated ATS score."""
        try:
            if template not in self.templates:
                return {'success': False, 'error': f'Invalid template: {template}. Allowed: {list(self.templates.keys())}'}

            resume_id = f"resume_{uuid.uuid4().hex[:8]}"
            template_meta = self.templates[template]

            pi = {
                'fullName': 'Alex Morgan',
                'email': 'alex.morgan@example.com',
                'phone': '+1 (555) 234-5678',
                'location': 'San Francisco, CA',
                'portfolio': 'https://alexmorgan.dev',
                'linkedin': 'https://linkedin.com/in/alexmorgan'
            }
            if personal_info:
                pi.update(personal_info)

            resume_data = {
                'id': resume_id,
                'userId': user_id or 'guest_user',
                'title': title or f"{pi.get('fullName', 'My')} Resume - {template_meta['name']}",
                'template': template,
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                'isPrimary': False,
                'personalInfo': pi,
                'summary': "Results-driven Software Engineer with solid expertise in modern web frameworks, Python, cloud architectures, and scalable API development. Proven record of optimizing performance and delivering high-quality distributed software.",
                'experience': [
                    {
                        'id': f"exp_{uuid.uuid4().hex[:6]}",
                        'company': 'TechFlow Solutions',
                        'role': 'Full Stack Software Engineer',
                        'duration': 'Jun 2023 - Present',
                        'description': 'Engineered scalable microservices and responsive user interfaces.',
                        'bullets': [
                            'Architected high-throughput REST APIs using FastAPI and PostgreSQL, reducing latency by 32%.',
                            'Containerized full application suite using Docker and orchestrated deployments on AWS ECS.',
                            'Collaborated in Agile sprints with cross-functional teams to release features 2 weeks ahead of schedule.'
                        ],
                        'skills': ['Python', 'FastAPI', 'React', 'Docker', 'AWS', 'PostgreSQL'],
                        'isHighlight': True
                    }
                ],
                'education': [
                    {
                        'id': f"edu_{uuid.uuid4().hex[:6]}",
                        'institution': 'State Institute of Technology',
                        'degree': 'Bachelor of Science',
                        'field': 'Computer Science & Engineering',
                        'graduationDate': '2023-05-15',
                        'gpa': '3.8/4.0',
                        'relevantCoursework': ['Data Structures & Algorithms', 'Database Systems', 'Cloud Computing', 'Operating Systems']
                    }
                ],
                'skills': [
                    {'skillId': 'sk_1', 'skillName': 'Python', 'level': 'advanced', 'endorsements': 12, 'yearsOfExperience': 3, 'isHighlight': True, 'relatedProjects': []},
                    {'skillId': 'sk_2', 'skillName': 'React', 'level': 'advanced', 'endorsements': 10, 'yearsOfExperience': 2.5, 'isHighlight': True, 'relatedProjects': []},
                    {'skillId': 'sk_3', 'skillName': 'Docker', 'level': 'intermediate', 'endorsements': 6, 'yearsOfExperience': 2, 'isHighlight': False, 'relatedProjects': []},
                    {'skillId': 'sk_4', 'skillName': 'AWS', 'level': 'intermediate', 'endorsements': 5, 'yearsOfExperience': 1.5, 'isHighlight': False, 'relatedProjects': []},
                    {'skillId': 'sk_5', 'skillName': 'SQL', 'level': 'advanced', 'endorsements': 8, 'yearsOfExperience': 3, 'isHighlight': True, 'relatedProjects': []},
                    {'skillId': 'sk_6', 'skillName': 'FastAPI', 'level': 'intermediate', 'endorsements': 7, 'yearsOfExperience': 2, 'isHighlight': False, 'relatedProjects': []}
                ],
                'projects': [
                    {
                        'id': f"proj_{uuid.uuid4().hex[:6]}",
                        'title': 'AI Career Analytics Platform',
                        'description': 'Built an intelligent career assessment engine with ML skill benchmarking and personalized learning roadmaps.',
                        'duration': 'Jan 2024 - Apr 2024',
                        'technologies': ['Python', 'FastAPI', 'React', 'TypeScript', 'Tailwind', 'Docker'],
                        'link': 'https://github.com/example/career-analytics',
                        'achievements': [
                            'Benchmarked over 20,000 engineering profiles with 94% recommendation accuracy.',
                            'Optimized database queries, cutting response times by 45%.'
                        ]
                    }
                ],
                'certifications': [
                    {
                        'id': f"cert_{uuid.uuid4().hex[:6]}",
                        'title': 'AWS Certified Cloud Practitioner',
                        'issuer': 'Amazon Web Services',
                        'issueDate': '2023-11-01',
                        'credentialUrl': 'https://aws.amazon.com/verification'
                    }
                ],
                'atsOptimization': {
                    'score': 0,
                    'keywords': [],
                    'missingKeywords': [],
                    'suggestions': [],
                    'lastOptimizedAt': datetime.utcnow().isoformat()
                },
                'versions': [
                    {
                        'version': 1,
                        'createdAt': datetime.utcnow().isoformat(),
                        'summary': f'Initial version created from {template_meta["name"]} template'
                    }
                ],
                'currentVersion': 1
            }

            # Calculate initial ATS score
            initial_analysis = await self.ats_analyzer.analyze_resume_object(resume_data)
            score_data = initial_analysis.get('atsScore', {})
            overall = int(score_data.get('overall', 75))

            resume_data['atsOptimization'] = {
                'score': overall,
                'keywords': [k.get('keyword') for k in initial_analysis.get('keywords', {}).get('found', [])],
                'missingKeywords': [k.get('keyword') for k in initial_analysis.get('keywords', {}).get('missing', [])[:5]],
                'suggestions': [s.get('action') for s in initial_analysis.get('recommendations', {}).get('immediate', [])],
                'lastOptimizedAt': datetime.utcnow().isoformat()
            }

            await self.resume_db.save_resume(user_id, resume_id, resume_data)
            logger.info(f"Created resume {resume_id} for user {user_id}")

            return {
                'success': True,
                'resumeId': resume_id,
                'resume': resume_data,
                'message': f"Resume successfully created using '{template_meta['name']}' template"
            }
        except Exception as e:
            logger.error(f"Error creating resume: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}

    async def get_resume(self, user_id: str, resume_id: str) -> Optional[dict]:
        """Fetch a specific resume."""
        return await self.resume_db.get_resume(user_id, resume_id)

    async def get_all_resumes(self, user_id: str) -> List[dict]:
        """Fetch all resumes for given user. If none exist, auto-create a starter resume."""
        resumes = await self.resume_db.get_all_resumes(user_id)
        if not resumes:
            created = await self.create_resume(user_id, template="ats_optimized")
            if created.get('success'):
                resumes = [created['resume']]
        return resumes

    async def update_resume_section(
        self,
        user_id: str,
        resume_id: str,
        section: str,
        data: Any
    ) -> Dict[str, Any]:
        """Granular update to a single section with automatic ATS re-scoring."""
        valid_sections = [
            'personalInfo', 'summary', 'experience', 'education',
            'skills', 'projects', 'certifications', 'title', 'template', 'isPrimary'
        ]
        if section not in valid_sections:
            return {'success': False, 'error': f"Invalid section '{section}'. Allowed: {valid_sections}"}

        resume = await self.get_resume(user_id, resume_id)
        if not resume:
            return {'success': False, 'error': f"Resume '{resume_id}' not found"}

        # Apply update
        resume[section] = data
        resume['updatedAt'] = datetime.utcnow().isoformat()

        # Recalculate ATS score
        new_analysis = await self.ats_analyzer.analyze_resume_object(resume)
        overall_score = int(new_analysis.get('atsScore', {}).get('overall', 70))

        resume['atsOptimization'] = {
            'score': overall_score,
            'keywords': [k.get('keyword') for k in new_analysis.get('keywords', {}).get('found', [])],
            'missingKeywords': [k.get('keyword') for k in new_analysis.get('keywords', {}).get('missing', [])[:5]],
            'suggestions': [s.get('action') for s in new_analysis.get('recommendations', {}).get('immediate', [])],
            'lastOptimizedAt': datetime.utcnow().isoformat()
        }

        await self.resume_db.save_resume(user_id, resume_id, resume)

        return {
            'success': True,
            'message': f"Section '{section}' updated successfully",
            'atsScore': overall_score,
            'atsOptimization': resume['atsOptimization'],
            'resume': resume
        }

    async def delete_resume(self, user_id: str, resume_id: str) -> Dict[str, Any]:
        """Delete resume document."""
        deleted = await self.resume_db.delete_resume(user_id, resume_id)
        if deleted:
            return {'success': True, 'message': 'Resume deleted successfully'}
        return {'success': False, 'error': 'Resume not found or could not be deleted'}

    async def duplicate_resume(self, user_id: str, resume_id: str, new_title: str) -> Dict[str, Any]:
        """Duplicate an existing resume into a fresh document with updated timestamps."""
        original = await self.get_resume(user_id, resume_id)
        if not original:
            return {'success': False, 'error': 'Source resume not found'}

        new_id = f"resume_{uuid.uuid4().hex[:8]}"
        dup_data = dict(original)
        dup_data['id'] = new_id
        dup_data['title'] = new_title or f"Copy of {original.get('title', 'Resume')}"
        dup_data['createdAt'] = datetime.utcnow().isoformat()
        dup_data['updatedAt'] = datetime.utcnow().isoformat()
        dup_data['isPrimary'] = False
        dup_data['versions'] = [
            {
                'version': 1,
                'createdAt': datetime.utcnow().isoformat(),
                'summary': f"Duplicated from {original.get('title', resume_id)}"
            }
        ]
        dup_data['currentVersion'] = 1

        await self.resume_db.save_resume(user_id, new_id, dup_data)
        return {
            'success': True,
            'resumeId': new_id,
            'resume': dup_data,
            'message': f"Duplicated as '{dup_data['title']}'"
        }
