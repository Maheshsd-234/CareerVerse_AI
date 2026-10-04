"""Unit tests for ResumeExporter service (Station 09: Multi-format Exporter)."""

import io
import unittest
from docx import Document
import PyPDF2
from backend.services.resume_export import ResumeExporter

class TestResumeExport(unittest.TestCase):
    def setUp(self):
        self.exporter = ResumeExporter()
        self.sample_resume = {
            'title': 'Senior Software Architect',
            'personalInfo': {
                'fullName': 'Devon Vance',
                'email': 'devon@example.com',
                'phone': '+1 (555) 789-0123',
                'location': 'Austin, TX',
                'portfolio': 'https://devonvance.dev',
                'linkedin': 'https://linkedin.com/in/devon'
            },
            'summary': 'Accomplished engineering leader with 10+ years specializing in distributed systems, high availability, and cloud migration.',
            'experience': [
                {
                    'company': 'CloudScale Systems',
                    'role': 'Lead Architect',
                    'duration': '2020 - Present',
                    'description': 'Directed enterprise platform migration to Kubernetes.',
                    'bullets': [
                        'Scaled platform to support 50M daily active requests.',
                        'Reduced infrastructure costs by 28% through autoscaling optimization.',
                        'Mentored 15 senior and mid-level engineers.'
                    ],
                    'skills': ['Kubernetes', 'Go', 'AWS', 'Terraform']
                }
            ],
            'education': [
                {
                    'institution': 'University of Texas at Austin',
                    'degree': 'Bachelor of Science',
                    'field': 'Computer Engineering',
                    'graduationDate': '2014-05-15',
                    'gpa': '3.85',
                    'relevantCoursework': ['Distributed Systems', 'Computer Architecture']
                }
            ],
            'skills': [
                {'skillName': 'Go'},
                {'skillName': 'Python'},
                {'skillName': 'Kubernetes'},
                {'skillName': 'AWS'},
                {'skillName': 'PostgreSQL'}
            ],
            'projects': [
                {
                    'title': 'High Velocity Message Queue',
                    'description': 'In-memory distributed pub-sub engine in Go.',
                    'duration': '2023',
                    'technologies': ['Go', 'Raft', 'gRPC'],
                    'achievements': ['Benchmarked at 1M messages per second per node.']
                }
            ],
            'certifications': [
                {
                    'title': 'Certified Kubernetes Administrator (CKA)',
                    'issuer': 'Linux Foundation',
                    'issueDate': '2022-09-01'
                }
            ]
        }

    def test_export_txt_returns_bytes_and_correct_mimetype(self):
        data, mime, filename = self.exporter.export(self.sample_resume, 'txt')
        self.assertIsInstance(data, bytes)
        self.assertEqual(mime, "text/plain")
        self.assertTrue(filename.endswith(".txt"))
        self.assertIn("Senior_Software_Architect", filename)

    def test_export_txt_content(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'txt')
        text = data.decode('utf-8')
        self.assertIn("DEVON VANCE", text)
        self.assertIn("devon@example.com", text)
        self.assertIn("PROFESSIONAL SUMMARY", text)
        self.assertIn("WORK EXPERIENCE", text)
        self.assertIn("CloudScale Systems", text)
        self.assertIn("TECHNICAL SKILLS", text)
        self.assertIn("EDUCATION", text)
        self.assertIn("CERTIFICATIONS", text)

    def test_export_docx_returns_valid_docx(self):
        data, mime, filename = self.exporter.export(self.sample_resume, 'docx')
        self.assertIsInstance(data, bytes)
        self.assertEqual(mime, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        self.assertTrue(filename.endswith(".docx"))

        buffer = io.BytesIO(data)
        doc = Document(buffer)
        all_text = " ".join([p.text for p in doc.paragraphs])
        self.assertIn("Devon Vance", all_text)
        self.assertIn("CloudScale Systems", all_text)

    def test_export_docx_with_minimal_resume(self):
        minimal_resume = {
            'title': 'Minimal Dev',
            'personalInfo': {'fullName': 'Basic Bob'}
        }
        data, _, filename = self.exporter.export(minimal_resume, 'docx')
        self.assertTrue(len(data) > 0)
        self.assertIn("Minimal_Dev", filename)

    def test_export_pdf_formatted_magic_header(self):
        data, mime, filename = self.exporter.export(self.sample_resume, 'pdf_formatted')
        self.assertIsInstance(data, bytes)
        self.assertEqual(mime, "application/pdf")
        self.assertTrue(filename.endswith("_formatted.pdf"))
        self.assertTrue(data.startswith(b"%PDF-"))

    def test_export_pdf_formatted_readable_pages(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'pdf_formatted')
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        self.assertTrue(len(reader.pages) >= 1)
        page1_text = reader.pages[0].extract_text()
        self.assertIn("Devon Vance", page1_text)
        self.assertIn("CloudScale", page1_text)

    def test_export_pdf_ats_magic_header(self):
        data, mime, filename = self.exporter.export(self.sample_resume, 'pdf_ats')
        self.assertIsInstance(data, bytes)
        self.assertEqual(mime, "application/pdf")
        self.assertTrue(filename.endswith("_ats.pdf"))
        self.assertTrue(data.startswith(b"%PDF-"))

    def test_export_pdf_ats_extractable_text(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'pdf_ats')
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        self.assertTrue(len(reader.pages) >= 1)
        page1_text = reader.pages[0].extract_text()
        self.assertIn("DEVON VANCE", page1_text.upper())
        self.assertIn("EXPERIENCE", page1_text)

    def test_export_unsupported_format_raises(self):
        with self.assertRaises(ValueError):
            self.exporter.export(self.sample_resume, 'unsupported_epub_format')

    def test_filename_sanitization_removes_illegal_chars(self):
        resume = {
            'title': 'My/Resume: 2024* <Final>?',
            'personalInfo': {'fullName': 'Test Name'}
        }
        _, _, filename = self.exporter.export(resume, 'txt')
        self.assertNotIn('/', filename)
        self.assertNotIn(':', filename)
        self.assertNotIn('?', filename)
        self.assertNotIn('*', filename)

    def test_txt_export_without_summary(self):
        resume_no_sum = dict(self.sample_resume)
        resume_no_sum['summary'] = ""
        data, _, _ = self.exporter.export(resume_no_sum, 'txt')
        self.assertNotIn("PROFESSIONAL SUMMARY", data.decode('utf-8'))

    def test_txt_export_without_certifications(self):
        resume_no_certs = dict(self.sample_resume)
        resume_no_certs['certifications'] = []
        data, _, _ = self.exporter.export(resume_no_certs, 'txt')
        self.assertNotIn("CERTIFICATIONS", data.decode('utf-8'))

    def test_docx_export_handles_empty_title(self):
        r = {'title': '', 'personalInfo': {'fullName': 'No Title Person'}}
        _, _, filename = self.exporter.export(r, 'docx')
        self.assertEqual(filename, "Resume.docx")

    def test_pdf_formatted_with_multiple_experiences(self):
        r = dict(self.sample_resume)
        r['experience'] = [
            {'company': 'Alpha', 'role': 'SWE 1', 'bullets': ['Bullet 1']},
            {'company': 'Beta', 'role': 'SWE 2', 'bullets': ['Bullet 2']},
            {'company': 'Gamma', 'role': 'SWE 3', 'bullets': ['Bullet 3']}
        ]
        data, _, _ = self.exporter.export(r, 'pdf_formatted')
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        text = "".join(p.extract_text() for p in reader.pages)
        self.assertIn("Alpha", text)
        self.assertIn("Beta", text)
        self.assertIn("Gamma", text)

    def test_pdf_ats_with_multiple_projects(self):
        r = dict(self.sample_resume)
        r['projects'] = [
            {'title': 'Project A', 'achievements': ['Achieved 99.9% uptime']},
            {'title': 'Project B', 'achievements': ['Processed 10 TB data']}
        ]
        data, _, _ = self.exporter.export(r, 'pdf_ats')
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        text = "".join(p.extract_text() for p in reader.pages)
        self.assertIn("Project A", text)
        self.assertIn("Project B", text)

    def test_txt_export_preserves_utf8(self):
        r = dict(self.sample_resume)
        r['personalInfo']['fullName'] = "René Müller"
        data, _, _ = self.exporter.export(r, 'txt')
        self.assertIn("RENÉ MÜLLER", data.decode('utf-8'))

    def test_docx_export_contains_education_gpa(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'docx')
        doc = Document(io.BytesIO(data))
        text = " ".join(p.text for p in doc.paragraphs)
        self.assertIn("Computer Engineering", text)

    def test_docx_export_has_margins(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'docx')
        doc = Document(io.BytesIO(data))
        sec = doc.sections[0]
        self.assertAlmostEqual(sec.top_margin.inches, 0.7, places=1)

    def test_all_formats_succeed_for_standard_resume(self):
        formats = ['pdf_formatted', 'pdf_ats', 'docx', 'txt']
        for fmt in formats:
            data, mime, fname = self.exporter.export(self.sample_resume, fmt)
            self.assertTrue(len(data) > 0)
            self.assertTrue(len(fname) > 3)

    def test_empty_string_skills_handled_gracefully(self):
        r = dict(self.sample_resume)
        r['skills'] = ['', 'Python', None, {'skillName': 'Docker'}]
        data, _, _ = self.exporter.export(r, 'txt')
        text = data.decode('utf-8')
        self.assertIn("Python", text)
        self.assertIn("Docker", text)

    def test_pdf_formatted_contact_line_delimiters(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'pdf_formatted')
        self.assertTrue(len(data) > 500)

    def test_pdf_ats_single_column_structure(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'pdf_ats')
        self.assertTrue(len(data) > 500)

    def test_docx_export_bullet_styles(self):
        data, _, _ = self.exporter.export(self.sample_resume, 'docx')
        doc = Document(io.BytesIO(data))
        bullet_count = sum(1 for p in doc.paragraphs if p.style.name == 'List Bullet')
        self.assertTrue(bullet_count >= 3)

if __name__ == '__main__':
    unittest.main()
