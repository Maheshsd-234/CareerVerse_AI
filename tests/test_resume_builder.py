"""Unit tests for ResumeBuilder service (Station 09: Resume Builder Card)."""

import unittest
import asyncio
from backend.services.resume_builder import ResumeBuilder
from backend.services.resume_db import ResumeDB
from backend.services.ats_analyzer import ATSAnalyzer
from backend.config.resume_config import TEMPLATES

class TestResumeBuilder(unittest.TestCase):
    def setUp(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.resume_db = ResumeDB()
        self.ats_analyzer = ATSAnalyzer(resume_db=self.resume_db)
        self.builder = ResumeBuilder(resume_db=self.resume_db, ats_analyzer=self.ats_analyzer)
        self.user_id = "test_user_builder"

    def tearDown(self):
        self.loop.close()

    def test_load_templates(self):
        templates = self.builder.get_templates()
        self.assertIn("ats_optimized", templates)
        self.assertIn("modern", templates)
        self.assertIn("minimal", templates)
        self.assertEqual(len(templates), 3)

    def test_template_properties(self):
        templates = self.builder.get_templates()
        for key, tmpl in templates.items():
            self.assertIn("name", tmpl)
            self.assertIn("description", tmpl)
            self.assertIn("sections", tmpl)
            self.assertIn("styling", tmpl)
            self.assertTrue(len(tmpl["sections"]) >= 5)

    def test_create_resume_ats_optimized(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="ats_optimized")
            self.assertTrue(res["success"])
            self.assertIn("resumeId", res)
            self.assertEqual(res["resume"]["template"], "ats_optimized")
            self.assertTrue(res["resume"]["atsOptimization"]["score"] > 0)
        self.loop.run_until_complete(_run())

    def test_create_resume_modern(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="modern", title="Modern Profile")
            self.assertTrue(res["success"])
            self.assertEqual(res["resume"]["title"], "Modern Profile")
            self.assertEqual(res["resume"]["template"], "modern")
        self.loop.run_until_complete(_run())

    def test_create_resume_minimal(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="minimal")
            self.assertTrue(res["success"])
            self.assertEqual(res["resume"]["template"], "minimal")
        self.loop.run_until_complete(_run())

    def test_create_resume_invalid_template(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="nonexistent_template")
            self.assertFalse(res["success"])
            self.assertIn("Invalid template", res["error"])
        self.loop.run_until_complete(_run())

    def test_get_resume_success(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="ats_optimized")
            resume_id = res["resumeId"]
            fetched = await self.builder.get_resume(self.user_id, resume_id)
            self.assertIsNotNone(fetched)
            self.assertEqual(fetched["id"], resume_id)
        self.loop.run_until_complete(_run())

    def test_get_resume_not_found(self):
        async def _run():
            fetched = await self.builder.get_resume(self.user_id, "unknown_resume_id_999")
            self.assertIsNone(fetched)
        self.loop.run_until_complete(_run())

    def test_get_all_resumes(self):
        async def _run():
            resumes = await self.builder.get_all_resumes(self.user_id)
            self.assertIsInstance(resumes, list)
            self.assertTrue(len(resumes) >= 1)
        self.loop.run_until_complete(_run())

    def test_update_personal_info(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            new_info = {
                "fullName": "Jane Doe",
                "email": "jane@tech.io",
                "phone": "+1 800 555 0199",
                "location": "Seattle, WA"
            }
            updated = await self.builder.update_resume_section(self.user_id, r_id, "personalInfo", new_info)
            self.assertTrue(updated["success"])
            self.assertEqual(updated["resume"]["personalInfo"]["fullName"], "Jane Doe")
        self.loop.run_until_complete(_run())

    def test_update_summary(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            new_summary = "Expert Cloud Architect with 8+ years designing microservices."
            updated = await self.builder.update_resume_section(self.user_id, r_id, "summary", new_summary)
            self.assertTrue(updated["success"])
            self.assertEqual(updated["resume"]["summary"], new_summary)
        self.loop.run_until_complete(_run())

    def test_update_experience(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            exp_data = [{
                "id": "exp_custom_1",
                "company": "Amazon",
                "role": "Senior Engineer",
                "duration": "2021 - 2024",
                "description": "Led team of 12 engineers",
                "bullets": ["Increased throughput by 50%", "Saved $200K in infrastructure"],
                "skills": ["AWS", "Python", "Kubernetes"],
                "isHighlight": True
            }]
            updated = await self.builder.update_resume_section(self.user_id, r_id, "experience", exp_data)
            self.assertTrue(updated["success"])
            self.assertEqual(len(updated["resume"]["experience"]), 1)
            self.assertEqual(updated["resume"]["experience"][0]["company"], "Amazon")
        self.loop.run_until_complete(_run())

    def test_update_skills(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            skills_data = [
                {"skillId": "sk_1", "skillName": "Python", "level": "expert", "endorsements": 25, "yearsOfExperience": 5, "isHighlight": True, "relatedProjects": []},
                {"skillId": "sk_2", "skillName": "Machine Learning", "level": "advanced", "endorsements": 18, "yearsOfExperience": 3, "isHighlight": True, "relatedProjects": []}
            ]
            updated = await self.builder.update_resume_section(self.user_id, r_id, "skills", skills_data)
            self.assertTrue(updated["success"])
            self.assertEqual(len(updated["resume"]["skills"]), 2)
            self.assertEqual(updated["resume"]["skills"][0]["skillName"], "Python")
        self.loop.run_until_complete(_run())

    def test_update_education(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            edu_data = [{
                "id": "edu_1",
                "institution": "Stanford University",
                "degree": "Master of Science",
                "field": "Computer Science",
                "graduationDate": "2022-06-15",
                "gpa": "3.95/4.0",
                "relevantCoursework": ["Distributed Systems", "AI"]
            }]
            updated = await self.builder.update_resume_section(self.user_id, r_id, "education", edu_data)
            self.assertTrue(updated["success"])
            self.assertEqual(updated["resume"]["education"][0]["institution"], "Stanford University")
        self.loop.run_until_complete(_run())

    def test_update_projects(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            proj_data = [{
                "id": "proj_1",
                "title": "Realtime Fraud Detector",
                "description": "Stream processing pipeline",
                "duration": "2024",
                "technologies": ["Kafka", "Python", "FastAPI"],
                "achievements": ["Handled 10,000 req/sec"]
            }]
            updated = await self.builder.update_resume_section(self.user_id, r_id, "projects", proj_data)
            self.assertTrue(updated["success"])
            self.assertEqual(updated["resume"]["projects"][0]["title"], "Realtime Fraud Detector")
        self.loop.run_until_complete(_run())

    def test_update_certifications(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            cert_data = [{
                "id": "c1",
                "title": "Google Professional Cloud Architect",
                "issuer": "Google Cloud",
                "issueDate": "2024-01-10",
                "credentialUrl": "https://cloud.google.com"
            }]
            updated = await self.builder.update_resume_section(self.user_id, r_id, "certifications", cert_data)
            self.assertTrue(updated["success"])
            self.assertEqual(updated["resume"]["certifications"][0]["title"], "Google Professional Cloud Architect")
        self.loop.run_until_complete(_run())

    def test_update_invalid_section(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            updated = await self.builder.update_resume_section(self.user_id, r_id, "invalid_section_foo", {})
            self.assertFalse(updated["success"])
            self.assertIn("Invalid section", updated["error"])
        self.loop.run_until_complete(_run())

    def test_ats_rescore_on_update(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            rich_skills = [
                {"skillName": "Python", "level": "expert"},
                {"skillName": "Machine Learning", "level": "expert"},
                {"skillName": "AWS", "level": "advanced"},
                {"skillName": "Docker", "level": "advanced"},
                {"skillName": "Kubernetes", "level": "advanced"},
                {"skillName": "React", "level": "advanced"},
                {"skillName": "SQL", "level": "expert"},
                {"skillName": "FastAPI", "level": "expert"}
            ]
            updated = await self.builder.update_resume_section(self.user_id, r_id, "skills", rich_skills)
            self.assertTrue(updated["success"])
            new_score = updated["atsScore"]
            self.assertTrue(new_score >= 50)
        self.loop.run_until_complete(_run())

    def test_duplicate_resume(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            orig_id = created["resumeId"]
            dup = await self.builder.duplicate_resume(self.user_id, orig_id, "Target Backend Role Resume")
            self.assertTrue(dup["success"])
            self.assertNotEqual(dup["resumeId"], orig_id)
            self.assertEqual(dup["resume"]["title"], "Target Backend Role Resume")
        self.loop.run_until_complete(_run())

    def test_delete_resume(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            del_res = await self.builder.delete_resume(self.user_id, r_id)
            self.assertTrue(del_res["success"])
            fetched = await self.builder.get_resume(self.user_id, r_id)
            self.assertIsNone(fetched)
        self.loop.run_until_complete(_run())

    def test_resume_default_personal_info(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="ats_optimized")
            pi = res["resume"]["personalInfo"]
            self.assertIn("fullName", pi)
            self.assertIn("email", pi)
            self.assertIn("phone", pi)
        self.loop.run_until_complete(_run())

    def test_resume_version_initialization(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="ats_optimized")
            self.assertEqual(res["resume"]["currentVersion"], 1)
            self.assertTrue(len(res["resume"]["versions"]) >= 1)
        self.loop.run_until_complete(_run())

    def test_update_title_section(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            res = await self.builder.update_resume_section(self.user_id, r_id, "title", "Custom Role Resume")
            self.assertTrue(res["success"])
            self.assertEqual(res["resume"]["title"], "Custom Role Resume")
        self.loop.run_until_complete(_run())

    def test_update_primary_flag(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            res = await self.builder.update_resume_section(self.user_id, r_id, "isPrimary", True)
            self.assertTrue(res["success"])
            self.assertTrue(res["resume"]["isPrimary"])
        self.loop.run_until_complete(_run())

    def test_update_template_style(self):
        async def _run():
            created = await self.builder.create_resume(self.user_id, template="ats_optimized")
            r_id = created["resumeId"]
            res = await self.builder.update_resume_section(self.user_id, r_id, "template", "modern")
            self.assertTrue(res["success"])
            self.assertEqual(res["resume"]["template"], "modern")
        self.loop.run_until_complete(_run())

    def test_duplicate_nonexistent_resume(self):
        async def _run():
            dup = await self.builder.duplicate_resume(self.user_id, "fake_id_123", "New Copy")
            self.assertFalse(dup["success"])
            self.assertIn("not found", dup["error"].lower())
        self.loop.run_until_complete(_run())

    def test_update_nonexistent_resume(self):
        async def _run():
            res = await self.builder.update_resume_section(self.user_id, "fake_id_123", "summary", "New text")
            self.assertFalse(res["success"])
        self.loop.run_until_complete(_run())

    def test_delete_nonexistent_resume(self):
        async def _run():
            res = await self.builder.delete_resume(self.user_id, "fake_id_123")
            self.assertFalse(res["success"])
        self.loop.run_until_complete(_run())

    def test_custom_personal_info_creation(self):
        async def _run():
            custom_pi = {"fullName": "Marcus Brody", "location": "Chicago, IL"}
            res = await self.builder.create_resume(self.user_id, template="ats_optimized", personal_info=custom_pi)
            self.assertEqual(res["resume"]["personalInfo"]["fullName"], "Marcus Brody")
            self.assertEqual(res["resume"]["personalInfo"]["location"], "Chicago, IL")
        self.loop.run_until_complete(_run())

    def test_ats_suggestions_included(self):
        async def _run():
            res = await self.builder.create_resume(self.user_id, template="ats_optimized")
            suggestions = res["resume"]["atsOptimization"]["suggestions"]
            self.assertIsInstance(suggestions, list)
        self.loop.run_until_complete(_run())

if __name__ == '__main__':
    unittest.main()
