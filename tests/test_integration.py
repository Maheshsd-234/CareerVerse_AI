"""Integration tests for Station 09: Resume Station FastAPI endpoints and user workflows."""

import io
import unittest
import asyncio
import httpx
from fastapi import FastAPI
from backend.routes.resume_routes import router as resume_router
from backend.routes.ats_routes import router as ats_router

test_app = FastAPI()
test_app.include_router(resume_router)
test_app.include_router(ats_router)

class TestStation09Integration(unittest.TestCase):
    def setUp(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.test_user = "integration_test_user"

    def tearDown(self):
        self.loop.close()

    def _client(self):
        return httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test")

    def test_create_resume_endpoint_success(self):
        async def _run():
            async with self._client() as c:
                payload = {
                    "template": "ats_optimized",
                    "userId": self.test_user,
                    "title": "Integration Test Resume"
                }
                resp = await c.post("/api/resumes/create", json=payload)
                self.assertEqual(resp.status_code, 201)
                data = resp.json()
                self.assertTrue(data["success"])
                self.assertIn("resumeId", data)
                self.assertEqual(data["resume"]["title"], "Integration Test Resume")
        self.loop.run_until_complete(_run())

    def test_create_resume_invalid_template(self):
        async def _run():
            async with self._client() as c:
                payload = {
                    "template": "invalid_template_xyz",
                    "userId": self.test_user
                }
                resp = await c.post("/api/resumes/create", json=payload)
                self.assertEqual(resp.status_code, 422)  # Pydantic pattern validation
        self.loop.run_until_complete(_run())

    def test_list_resumes_endpoint(self):
        async def _run():
            async with self._client() as c:
                await c.post("/api/resumes/create", json={"template": "modern", "userId": self.test_user})
                resp = await c.get(f"/api/resumes?userId={self.test_user}")
                self.assertEqual(resp.status_code, 200)
                resumes = resp.json()
                self.assertIsInstance(resumes, list)
                self.assertTrue(len(resumes) >= 1)
        self.loop.run_until_complete(_run())

    def test_get_resume_by_id_success(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "minimal", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                get_resp = await c.get(f"/api/resumes/{resume_id}?userId={self.test_user}")
                self.assertEqual(get_resp.status_code, 200)
                self.assertEqual(get_resp.json()["id"], resume_id)
        self.loop.run_until_complete(_run())

    def test_get_resume_by_id_not_found(self):
        async def _run():
            async with self._client() as c:
                get_resp = await c.get(f"/api/resumes/nonexistent_resume_999?userId={self.test_user}")
                self.assertEqual(get_resp.status_code, 404)
        self.loop.run_until_complete(_run())

    def test_update_resume_section_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                update_payload = {
                    "section": "personalInfo",
                    "data": {
                        "fullName": "Samantha Smith",
                        "email": "samantha@company.com",
                        "phone": "+1 555 4321",
                        "location": "Boston, MA"
                    }
                }
                put_resp = await c.put(f"/api/resumes/{resume_id}/sections/personalInfo?userId={self.test_user}", json=update_payload)
                self.assertEqual(put_resp.status_code, 200)
                res = put_resp.json()
                self.assertTrue(res["success"])
                self.assertEqual(res["resume"]["personalInfo"]["fullName"], "Samantha Smith")
                self.assertTrue(res["atsScore"] > 0)
        self.loop.run_until_complete(_run())

    def test_export_resume_txt_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                export_resp = await c.post(
                    f"/api/resumes/{resume_id}/export?userId={self.test_user}",
                    json={"format": "txt"}
                )
                self.assertEqual(export_resp.status_code, 200)
                self.assertIn("text/plain", export_resp.headers["content-type"])
                self.assertTrue(len(export_resp.content) > 50)
        self.loop.run_until_complete(_run())

    def test_export_resume_pdf_formatted_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "modern", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                export_resp = await c.post(
                    f"/api/resumes/{resume_id}/export?userId={self.test_user}",
                    json={"format": "pdf_formatted"}
                )
                self.assertEqual(export_resp.status_code, 200)
                self.assertIn("application/pdf", export_resp.headers["content-type"])
                self.assertTrue(export_resp.content.startswith(b"%PDF-"))
        self.loop.run_until_complete(_run())

    def test_export_resume_pdf_ats_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                export_resp = await c.post(
                    f"/api/resumes/{resume_id}/export?userId={self.test_user}",
                    json={"format": "pdf_ats"}
                )
                self.assertEqual(export_resp.status_code, 200)
                self.assertIn("application/pdf", export_resp.headers["content-type"])
                self.assertTrue(export_resp.content.startswith(b"%PDF-"))
        self.loop.run_until_complete(_run())

    def test_export_resume_docx_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "minimal", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                export_resp = await c.post(
                    f"/api/resumes/{resume_id}/export?userId={self.test_user}",
                    json={"format": "docx"}
                )
                self.assertEqual(export_resp.status_code, 200)
                self.assertTrue(len(export_resp.content) > 100)
        self.loop.run_until_complete(_run())

    def test_duplicate_resume_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                dup_resp = await c.post(
                    f"/api/resumes/{resume_id}/duplicate?userId={self.test_user}",
                    json={"newTitle": "Cloned Resume for SRE"}
                )
                self.assertEqual(dup_resp.status_code, 200)
                dup_data = dup_resp.json()
                self.assertTrue(dup_data["success"])
                self.assertEqual(dup_data["resume"]["title"], "Cloned Resume for SRE")
        self.loop.run_until_complete(_run())

    def test_delete_resume_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                del_resp = await c.delete(f"/api/resumes/{resume_id}?userId={self.test_user}")
                self.assertEqual(del_resp.status_code, 200)
                self.assertTrue(del_resp.json()["success"])

                get_again = await c.get(f"/api/resumes/{resume_id}?userId={self.test_user}")
                self.assertEqual(get_again.status_code, 404)
        self.loop.run_until_complete(_run())

    def test_ats_analyze_file_endpoint_txt(self):
        async def _run():
            async with self._client() as c:
                resume_txt = b"""
                John Developer
                john@example.com | 555-0123
                SUMMARY: Senior Python developer with strong Docker, AWS, and FastAPI knowledge.
                EXPERIENCE:
                Software Engineer at Acme:
                - Built REST microservices improving response speed by 45%.
                SKILLS: Python, FastAPI, Docker, AWS, React, SQL
                """
                files = {"file": ("my_resume.txt", io.BytesIO(resume_txt), "text/plain")}
                data = {
                    "jobDescription": "We need a Python developer who knows Docker, AWS, and FastAPI.",
                    "userId": self.test_user
                }
                resp = await c.post("/api/ats/analyze", files=files, data=data)
                self.assertEqual(resp.status_code, 200)
                body = resp.json()
                self.assertTrue(body["success"])
                self.assertIn("atsScore", body)
                self.assertTrue(body["atsScore"]["overall"] >= 65)
                self.assertTrue(body["jdComparison"]["matchPercentage"] >= 80)
        self.loop.run_until_complete(_run())

    def test_ats_analyze_unsupported_file_extension(self):
        async def _run():
            async with self._client() as c:
                files = {"file": ("unsupported.exe", io.BytesIO(b"binary"), "application/octet-stream")}
                resp = await c.post("/api/ats/analyze", files=files)
                self.assertEqual(resp.status_code, 400)
                self.assertIn("Unsupported file format", resp.json()["detail"])
        self.loop.run_until_complete(_run())

    def test_ats_get_analysis_by_id(self):
        async def _run():
            async with self._client() as c:
                resume_txt = b"Jane Engineer. Python and AWS specialist. Improved API latency by 35%."
                files = {"file": ("analysis_test.txt", io.BytesIO(resume_txt), "text/plain")}
                post_resp = await c.post("/api/ats/analyze", files=files, data={"userId": self.test_user})
                self.assertEqual(post_resp.status_code, 200)
                analysis_id = post_resp.json()["analysisId"]

                get_resp = await c.get(f"/api/ats/analyses/{analysis_id}?userId={self.test_user}")
                self.assertEqual(get_resp.status_code, 200)
                self.assertEqual(get_resp.json()["analysis"]["id"], analysis_id)
        self.loop.run_until_complete(_run())

    def test_ats_analyze_object_endpoint(self):
        async def _run():
            async with self._client() as c:
                payload = {
                    "resume": {
                        "personalInfo": {"fullName": "Live Object Test"},
                        "summary": "Full stack engineer experienced in React, TypeScript, and Python.",
                        "skills": [{"skillName": "React"}, {"skillName": "Python"}, {"skillName": "AWS"}]
                    },
                    "jobDescription": "Looking for React and Python engineer."
                }
                resp = await c.post("/api/ats/analyze-object", json=payload)
                self.assertEqual(resp.status_code, 200)
                res = resp.json()
                self.assertTrue(res["success"])
                self.assertIn("atsScore", res)
                self.assertTrue(res["atsScore"]["overall"] >= 50)
        self.loop.run_until_complete(_run())

    def test_end_to_end_user_workflow(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]

                exp_payload = {
                    "section": "experience",
                    "data": [
                        {
                            "company": "E2E Tech Labs",
                            "role": "Principal Software Engineer",
                            "duration": "2022 - Present",
                            "description": "Architected distributed streaming pipelines.",
                            "bullets": [
                                "Boosted database throughput by 45% and reduced latency by 30%.",
                                "Automated CI/CD deployments using Docker and AWS."
                            ],
                            "skills": ["Python", "AWS", "Docker", "SQL", "FastAPI"]
                        }
                    ]
                }
                await c.put(f"/api/resumes/{resume_id}/sections/experience?userId={self.test_user}", json=exp_payload)

                exp_txt = await c.post(f"/api/resumes/{resume_id}/export?userId={self.test_user}", json={"format": "txt"})
                self.assertEqual(exp_txt.status_code, 200)

                files = {"file": ("exported_resume.txt", io.BytesIO(exp_txt.content), "text/plain")}
                data = {
                    "jobDescription": "We are seeking a Principal Software Engineer with deep Python, Docker, AWS, and FastAPI experience.",
                    "userId": self.test_user
                }
                ats_resp = await c.post("/api/ats/analyze", files=files, data=data)
                self.assertEqual(ats_resp.status_code, 200)
                ats_data = ats_resp.json()
                self.assertTrue(ats_data["atsScore"]["overall"] >= 75)
                self.assertTrue(ats_data["jdComparison"]["matchPercentage"] >= 80)
        self.loop.run_until_complete(_run())

    def test_export_invalid_format_returns_422(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]
                resp = await c.post(f"/api/resumes/{resume_id}/export?userId={self.test_user}", json={"format": "invalid_xyz"})
                self.assertEqual(resp.status_code, 422)
        self.loop.run_until_complete(_run())

    def test_duplicate_updates_timestamp(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]
                d_resp = await c.post(f"/api/resumes/{resume_id}/duplicate?userId={self.test_user}", json={"newTitle": "Time Check"})
                self.assertEqual(d_resp.status_code, 200)
                self.assertIn("updatedAt", d_resp.json()["resume"])
        self.loop.run_until_complete(_run())

    def test_ats_analysis_not_found(self):
        async def _run():
            async with self._client() as c:
                resp = await c.get(f"/api/ats/analyses/unknown_analysis_999?userId={self.test_user}")
                self.assertEqual(resp.status_code, 404)
        self.loop.run_until_complete(_run())

    def test_update_summary_section_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]
                resp = await c.put(
                    f"/api/resumes/{resume_id}/sections/summary?userId={self.test_user}",
                    json={"section": "summary", "data": "New senior bio."}
                )
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(resp.json()["resume"]["summary"], "New senior bio.")
        self.loop.run_until_complete(_run())

    def test_update_skills_section_endpoint(self):
        async def _run():
            async with self._client() as c:
                c_resp = await c.post("/api/resumes/create", json={"template": "ats_optimized", "userId": self.test_user})
                resume_id = c_resp.json()["resumeId"]
                resp = await c.put(
                    f"/api/resumes/{resume_id}/sections/skills?userId={self.test_user}",
                    json={"section": "skills", "data": [{"skillName": "Rust"}, {"skillName": "Go"}]}
                )
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(len(resp.json()["resume"]["skills"]), 2)
        self.loop.run_until_complete(_run())

if __name__ == '__main__':
    unittest.main()
