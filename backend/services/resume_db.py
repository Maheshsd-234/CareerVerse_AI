"""Firestore operations and repository layer for Resume Station."""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class ResumeDB:
    """Manages persistence for Resumes and ATS analyses."""

    def __init__(self, db_client=None):
        self.db = db_client
        self._fallback_store: Dict[str, Dict[str, Any]] = {
            "resumes": {},
            "atsAnalyses": {}
        }
        self._backup_dir = os.path.join(os.path.dirname(__file__), "..", "data_store")
        os.makedirs(self._backup_dir, exist_ok=True)
        self._load_local_cache()

    def _load_local_cache(self):
        cache_path = os.path.join(self._backup_dir, "resume_store.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._fallback_store.update(data)
            except Exception as e:
                logger.warning(f"Could not load local resume store cache: {e}")

    def _save_local_cache(self):
        cache_path = os.path.join(self._backup_dir, "resume_store.json")
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(self._fallback_store, f, default=str, indent=2)
        except Exception as e:
            logger.warning(f"Could not save local resume store cache: {e}")

    async def save_resume(self, user_id: str, resume_id: str, resume_data: dict) -> bool:
        """Save resume document."""
        try:
            if self.db:
                # Firestore client provided
                doc_ref = self.db.collection('users').document(user_id).collection('resumes').document(resume_id)
                if hasattr(doc_ref, "set_async"):
                    await doc_ref.set_async(resume_data)
                elif hasattr(doc_ref, "set"):
                    doc_ref.set(resume_data)
                return True
        except Exception as e:
            logger.warning(f"Firestore save_resume failed, falling back to local store: {e}")

        # Fallback local store
        user_key = f"{user_id}:{resume_id}"
        self._fallback_store["resumes"][user_key] = resume_data
        self._save_local_cache()
        return True

    async def get_resume(self, user_id: str, resume_id: str) -> Optional[dict]:
        """Fetch single resume."""
        try:
            if self.db:
                doc_ref = self.db.collection('users').document(user_id).collection('resumes').document(resume_id)
                doc = await doc_ref.get() if hasattr(doc_ref, "get_async") else doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
        except Exception as e:
            logger.warning(f"Firestore get_resume failed, checking local store: {e}")

        user_key = f"{user_id}:{resume_id}"
        if user_key in self._fallback_store["resumes"]:
            return self._fallback_store["resumes"][user_key]
        
        # Check by resume_id alone if user_id doesn't match
        for k, v in self._fallback_store["resumes"].items():
            if v.get("id") == resume_id:
                return v
        return None

    async def get_all_resumes(self, user_id: str) -> List[dict]:
        """Fetch all resumes for a user."""
        try:
            if self.db:
                coll_ref = self.db.collection('users').document(user_id).collection('resumes')
                docs = await coll_ref.get() if hasattr(coll_ref, "get_async") else coll_ref.stream()
                results = [d.to_dict() for d in docs]
                if results:
                    return results
        except Exception as e:
            logger.warning(f"Firestore get_all_resumes failed, checking local store: {e}")

        matched = []
        for k, v in self._fallback_store["resumes"].items():
            if v.get("userId") == user_id or user_id == "all" or user_id == "guest_user":
                matched.append(v)
        return matched

    async def update_resume(self, user_id: str, resume_id: str, updates: dict) -> bool:
        """Update fields in resume."""
        try:
            if self.db:
                doc_ref = self.db.collection('users').document(user_id).collection('resumes').document(resume_id)
                if hasattr(doc_ref, "update_async"):
                    await doc_ref.update_async(updates)
                elif hasattr(doc_ref, "update"):
                    doc_ref.update(updates)
                return True
        except Exception as e:
            logger.warning(f"Firestore update_resume failed, updating local store: {e}")

        resume = await self.get_resume(user_id, resume_id)
        if resume:
            resume.update(updates)
            user_key = f"{user_id}:{resume_id}"
            self._fallback_store["resumes"][user_key] = resume
            self._save_local_cache()
            return True
        return False

    async def delete_resume(self, user_id: str, resume_id: str) -> bool:
        """Delete resume."""
        try:
            if self.db:
                doc_ref = self.db.collection('users').document(user_id).collection('resumes').document(resume_id)
                if hasattr(doc_ref, "delete_async"):
                    await doc_ref.delete_async()
                elif hasattr(doc_ref, "delete"):
                    doc_ref.delete()
        except Exception as e:
            logger.warning(f"Firestore delete_resume failed, deleting from local store: {e}")

        user_key = f"{user_id}:{resume_id}"
        if user_key in self._fallback_store["resumes"]:
            del self._fallback_store["resumes"][user_key]
            self._save_local_cache()
            return True
        return False

    async def save_ats_analysis(self, user_id: str, analysis_id: str, analysis_data: dict) -> bool:
        """Save ATS analysis."""
        try:
            if self.db:
                doc_ref = self.db.collection('users').document(user_id).collection('atsAnalyses').document(analysis_id)
                if hasattr(doc_ref, "set_async"):
                    await doc_ref.set_async(analysis_data)
                elif hasattr(doc_ref, "set"):
                    doc_ref.set(analysis_data)
                return True
        except Exception as e:
            logger.warning(f"Firestore save_ats_analysis failed, falling back to local store: {e}")

        key = f"{user_id}:{analysis_id}"
        self._fallback_store["atsAnalyses"][key] = analysis_data
        self._save_local_cache()
        return True

    async def get_ats_analysis(self, user_id: str, analysis_id: str) -> Optional[dict]:
        """Fetch ATS analysis."""
        try:
            if self.db:
                doc_ref = self.db.collection('users').document(user_id).collection('atsAnalyses').document(analysis_id)
                doc = await doc_ref.get() if hasattr(doc_ref, "get_async") else doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
        except Exception as e:
            logger.warning(f"Firestore get_ats_analysis failed, checking local store: {e}")

        key = f"{user_id}:{analysis_id}"
        if key in self._fallback_store["atsAnalyses"]:
            return self._fallback_store["atsAnalyses"][key]
        for k, v in self._fallback_store["atsAnalyses"].items():
            if v.get("id") == analysis_id:
                return v
        return None
