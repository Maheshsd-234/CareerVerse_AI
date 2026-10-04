"""
CareerVerse AI - Dynamic Personalized Roadmap & Adaptive Weekly Assessment Engine Router
Exposes endpoints for deterministic personalized roadmap planning, what-if simulation,
NetworkX prerequisite graph, and dynamic 15-question weekly Groq assessment execution.
"""

import os
import sys
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
if CUR_DIR not in sys.path:
    sys.path.insert(0, CUR_DIR)

from roadmap_planning_engine import roadmap_planning_engine
from skill_graph import skill_graph

router = APIRouter(prefix="/api/roadmap", tags=["Dynamic Roadmap Engine"])


class PlanGenerateRequest(BaseModel):
    user_id: str = Field("guest_user", description="Authenticated user ID")
    target_role_id: str = Field("software-engineer", description="Target role ID from roles catalog")
    experience_level: str = Field("Beginner", description="Beginner | Intermediate | Advanced | Expert")
    weekly_hours: float = Field(10.0, ge=1.0, le=80.0, description="Available study hours per week")
    target_date: Optional[str] = Field(None, description="ISO format deadline date e.g. 2026-12-31")
    target_timeline_months: Optional[int] = Field(6, ge=1, le=48, description="Target timeline in months")
    learning_preference: str = Field("Balanced", description="Balanced | Theory Heavy | Practice Heavy | Project Heavy | Interview Focused")
    goal: str = Field("First Job", description="Internship | First Job | Career Transition | Placement | Skill Development")
    current_role: Optional[str] = Field(None, description="Current role for Career Transition mode")
    known_skills: List[str] = Field(default_factory=list, description="List of skills user already knows")
    assessment_scores: Dict[str, float] = Field(default_factory=dict, description="Verified assessment scores or domain ratings")
    specialization: Optional[str] = Field(None, description="Optional chosen specialization branch")
    mvcp_mode: bool = Field(False, description="Enable Minimum Viable Career Path mode")


class PlanAdaptRequest(BaseModel):
    roadmap: Dict[str, Any] = Field(..., description="Active roadmap object")
    event_type: str = Field(..., description="assessment_result | task_completed | weekly_hours_changed")
    payload: Dict[str, Any] = Field(..., description="Event payload details")


class PlanSimulateRequest(BaseModel):
    current_roadmap: Dict[str, Any] = Field(..., description="Active roadmap object to simulate against")
    simulated_weekly_hours: float = Field(10.0, ge=1.0, le=80.0, description="Simulated weekly hours")
    simulated_target_date: Optional[str] = Field(None, description="Simulated deadline ISO string")
    simulated_mvcp_mode: Optional[bool] = Field(None, description="Simulate MVCP toggle")


class PlanCommandRequest(BaseModel):
    command_text: str = Field(..., description="Natural language prompt e.g. 'I have only 5 hours this week'")
    current_roadmap: Dict[str, Any] = Field(..., description="Active roadmap object")


class AssessmentGenerateRequest(BaseModel):
    roadmap_id: str = Field("active_roadmap", description="Roadmap ID")
    week_id: str = Field(..., description="Target Week ID")
    week_number: int = Field(1, description="Week Number")
    role: str = Field("Machine Learning Engineer", description="Target Role")
    user_level: str = Field("Beginner", description="User Experience Level")
    topics: List[str] = Field(default_factory=list, description="Week topics")
    learning_objectives: Optional[List[str]] = Field(default_factory=list, description="Learning objectives")
    weak_topics: Optional[List[str]] = Field(default_factory=list, description="Weak topics from previous attempt")
    attempt_number: Optional[int] = Field(1, description="Attempt number")


class AssessmentSubmitRequest(BaseModel):
    assessment_id: str = Field(..., description="Generated Assessment ID")
    week_id: str = Field(..., description="Week ID")
    roadmap: Dict[str, Any] = Field(..., description="Current active roadmap object")
    answers: Dict[str, int] = Field(..., description="User selected answers { question_id: option_index }")


@router.get("/skill-graph")
def get_skill_graph():
    """Returns nodes and edges of the NetworkX prerequisite graph for visualization."""
    return skill_graph.export_graph_for_visualization()


@router.post("/generate-plan")
def generate_personalized_plan(payload: PlanGenerateRequest):
    """
    Deterministic Dynamic Personalized Roadmap Generation.
    Calculates Skill Gap Analysis, NetworkX DAG Prerequisite Resolution,
    Capacity & Timeline Feasibility, and Hierarchical Phase/Month/Week/Task breakdown.
    """
    try:
        plan = roadmap_planning_engine.generate_roadmap(
            user_id=payload.user_id,
            target_role_id=payload.target_role_id,
            experience_level=payload.experience_level,
            weekly_hours=payload.weekly_hours,
            target_date=payload.target_date,
            target_timeline_months=payload.target_timeline_months,
            learning_preference=payload.learning_preference,
            goal=payload.goal,
            current_role=payload.current_role,
            known_skills=payload.known_skills,
            assessment_scores=payload.assessment_scores,
            specialization=payload.specialization,
            mvcp_mode=payload.mvcp_mode
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap plan: {str(e)}")


@router.post("/adapt-plan")
def adapt_plan(payload: PlanAdaptRequest):
    """
    Adaptive Roadmap Mutator.
    Reacts dynamically to assessment scores, task completions, or schedule changes.
    """
    try:
        adapted = roadmap_planning_engine.adapt_roadmap(
            roadmap=payload.roadmap,
            event_type=payload.event_type,
            payload=payload.payload
        )
        return adapted
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to adapt roadmap: {str(e)}")


@router.post("/simulate-plan")
def simulate_plan(payload: PlanSimulateRequest):
    """
    What-If Roadmap Simulator.
    Simulates variations in hours, deadlines, and MVCP mode without altering the active plan.
    """
    try:
        sim = roadmap_planning_engine.simulate_plan(
            current_roadmap=payload.current_roadmap,
            simulated_weekly_hours=payload.simulated_weekly_hours,
            simulated_target_date=payload.simulated_target_date,
            simulated_mvcp_mode=payload.simulated_mvcp_mode
        )
        return sim
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to simulate roadmap: {str(e)}")


@router.post("/interpret-command")
def interpret_command(payload: PlanCommandRequest):
    """
    Interprets natural language student requests into structured actionable updates.
    """
    try:
        action = roadmap_planning_engine.interpret_command(
            command_text=payload.command_text,
            current_roadmap=payload.current_roadmap
        )
        return action
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to interpret command: {str(e)}")


@router.post("/weeks/{week_id}/assessment/generate")
def generate_weekly_assessment_endpoint(week_id: str, payload: AssessmentGenerateRequest):
    """
    Dynamically generates exactly 15 MCQs for the specified week via Groq LPU API.
    Scored to 75% passing threshold (12/15).
    """
    try:
        assessment = roadmap_planning_engine.generate_weekly_assessment(
            role=payload.role,
            user_level=payload.user_level,
            week_number=payload.week_number,
            week_id=week_id,
            topics=payload.topics,
            learning_objectives=payload.learning_objectives,
            weak_topics=payload.weak_topics,
            attempt_number=payload.attempt_number or 1,
            roadmap_id=payload.roadmap_id
        )
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate weekly assessment: {str(e)}")


@router.post("/assessments/submit")
def submit_weekly_assessment_endpoint(payload: AssessmentSubmitRequest):
    """
    Deterministic scoring and unlock evaluation.
    Passing requires >= 12/15 (75%).
    Unlocks next week if passed; locks next week and yields remediation if failed.
    """
    try:
        result = roadmap_planning_engine.submit_weekly_assessment(
            assessment_id=payload.assessment_id,
            week_id=payload.week_id,
            roadmap=payload.roadmap,
            answers=payload.answers
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit assessment: {str(e)}")


@router.post("/assessments/{assessment_id}/retest")
def retest_weekly_assessment_endpoint(assessment_id: str, payload: AssessmentSubmitRequest):
    """
    Generates a dynamic retest assessment focusing primarily on weak topics from previous attempt.
    """
    try:
        retest = roadmap_planning_engine.retest_weekly_assessment(
            assessment_id=assessment_id,
            week_id=payload.week_id,
            roadmap=payload.roadmap
        )
        return retest
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate retest: {str(e)}")
