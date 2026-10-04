import os
import random
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "datasets"))
INPUT_FILE = os.path.join(DATASETS_DIR, "Eng_student_dataset.csv")
OUTPUT_FILE = os.path.join(DATASETS_DIR, "versatile_multibranch_dataset.csv")

random.seed(42)
np.random.seed(42)

BRANCH_CORE_SKILLS = {
    "MECH": {
        "Core Engineering": ["SolidWorks", "AutoCAD", "MATLAB", "Robotics"],
        "Hardware": ["SolidWorks", "AutoCAD", "Thermodynamics", "3D Printing"],
        "Software": ["Python", "C++", "SolidWorks", "MATLAB"],
        "Consulting": ["SQL", "Excel Analytics", "SolidWorks", "Project Management"],
        "Research": ["MATLAB", "Finite Element Analysis", "Python", "Robotics"],
        "Higher Studies": ["MATLAB", "SolidWorks", "C++", "Thermodynamics"]
    },
    "CIVIL": {
        "Core Engineering": ["AutoCAD", "Revit", "Civil BIM", "STAAD Pro"],
        "Hardware": ["AutoCAD", "Surveying", "Revit", "GIS Mapping"],
        "Software": ["Python", "SQL", "AutoCAD", "Revit"],
        "Consulting": ["AutoCAD", "Excel Analytics", "Project Estimations", "SQL"],
        "Research": ["AutoCAD", "Revit", "MATLAB", "Geotechnical Modeling"],
        "Higher Studies": ["AutoCAD", "Revit", "MATLAB", "Structural Dynamics"]
    },
    "ECE": {
        "Core Engineering": ["Embedded Systems", "IoT", "C++", "VLSI"],
        "Hardware": ["Embedded Systems", "Circuit Design", "IoT", "Arduino"],
        "Software": ["Python", "C++", "Web Development", "SQL"],
        "Consulting": ["Python", "SQL", "Excel Analytics", "IoT"],
        "Research": ["MATLAB", "Embedded Systems", "VLSI", "Python"],
        "Higher Studies": ["MATLAB", "C++", "VLSI", "Embedded Systems"]
    },
    "EEE": {
        "Core Engineering": ["Power Systems", "MATLAB", "Embedded Systems", "IoT"],
        "Hardware": ["Circuit Design", "Power Electronics", "Embedded Systems", "Arduino"],
        "Software": ["Python", "Java", "SQL", "Web Development"],
        "Consulting": ["SQL", "Power Systems", "Excel Analytics", "Python"],
        "Research": ["MATLAB", "Power Electronics", "Simulation", "C++"],
        "Higher Studies": ["MATLAB", "Control Systems", "C++", "Python"]
    },
    "CSE": {
        "Software": ["Web Development", "Java", "Python", "Cloud/DevOps", "SQL"],
        "Core Engineering": ["C++", "Java", "Cybersecurity", "Linux Systems"],
        "Hardware": ["C++", "Cybersecurity", "Network Security", "Python"],
        "Consulting": ["SQL", "Python", "Web Development", "Product Analytics"],
        "Research": ["Machine Learning", "Data Science", "Python", "Algorithms"],
        "Higher Studies": ["Machine Learning", "Python", "Algorithms", "C++"]
    },
    "IT": {
        "Software": ["Web Development", "Java", "Cloud/DevOps", "SQL", "Python"],
        "Core Engineering": ["Cybersecurity", "Network Security", "Linux Systems", "SQL"],
        "Hardware": ["Network Security", "Cloud/DevOps", "Cybersecurity", "Python"],
        "Consulting": ["SQL", "Cloud/DevOps", "Web Development", "Product Analytics"],
        "Research": ["Data Science", "Machine Learning", "Python", "SQL"],
        "Higher Studies": ["Data Science", "Python", "Algorithms", "Cloud/DevOps"]
    }
}

def enrich_dataset():
    df = pd.read_csv(INPUT_FILE)
    print(f"Enriching {len(df)} records with branch-accurate technical competencies...")
    
    enriched_skills = []
    enriched_roles = []
    
    for _, row in df.iterrows():
        branch = str(row["Branch"]).strip().upper()
        domain = str(row["Placement Domain"]).strip()
        original_skills = [s.strip() for s in str(row["Skills"]).split(",") if s.strip()]
        clubs = str(row["Clubs"]).lower()
        gpa = float(row["Average GPA"]) if pd.notnull(row["Average GPA"]) else 7.0
        
        # Get branch specific skills
        branch_map = BRANCH_CORE_SKILLS.get(branch, {})
        core_skills = branch_map.get(domain, ["Python", "SQL"])
        
        # Merge some original skills with authentic branch skills
        merged = list(set(core_skills + random.sample(original_skills, min(2, len(original_skills)))))
        skills_str = ", ".join(merged)
        enriched_skills.append(skills_str)
        
        # Determine rich granular role
        s_lower = skills_str.lower()
        if "cybersecurity" in s_lower or "network security" in s_lower:
            role = "Cybersecurity & Threat Defense Engineer"
        elif "consulting" in domain.lower():
            role = "Technical Product Manager (PM)" if ("entrepreneurship" in clubs or "product" in s_lower) else "Strategy & Management Consultant"
        elif "web development" in s_lower or (("java" in s_lower or "c++" in s_lower) and "data science" not in s_lower and "machine learning" not in s_lower and branch in ["CSE", "IT"]):
            role = "Full-Stack Software Engineer (SDE)"
        elif "cloud/devops" in s_lower:
            role = "Cloud & DevOps Solutions Architect"
        elif "machine learning" in s_lower and ("python" in s_lower or gpa >= 7.8):
            role = "AI & Machine Learning Engineer"
        elif "data science" in s_lower or ("sql" in s_lower and "python" in s_lower and "web development" not in s_lower and "java" not in s_lower and branch in ["CSE", "IT"]):
            role = "Data Scientist & Analytics Specialist"
        elif "robotics" in s_lower or "robotics" in clubs:
            role = "Robotics & Automation Specialist"
        elif "embedded systems" in s_lower or "vlsi" in s_lower:
            role = "Embedded Systems & IoT Engineer"
        elif "revit" in s_lower or (branch == "CIVIL" and "solidworks" not in s_lower):
            role = "Civil BIM & Structural Engineer"
        elif "solidworks" in s_lower or "autocad" in s_lower or branch == "MECH":
            role = "CAD/CAE Mechanical Systems Designer"
        elif branch in ["CSE", "IT"]:
            role = "Full-Stack Software Engineer (SDE)"
        elif branch in ["ECE", "EEE"]:
            role = "Embedded Systems & IoT Engineer"
        elif branch == "MECH":
            role = "CAD/CAE Mechanical Systems Designer"
        elif branch == "CIVIL":
            role = "Civil BIM & Structural Engineer"
        else:
            role = "Full-Stack Software Engineer (SDE)"
            
        enriched_roles.append(role)
        
    df["Skills"] = enriched_skills
    df["Granular Role"] = enriched_roles
    
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved versatile dataset to {OUTPUT_FILE}")
    print("\nEnriched Role Counts:")
    print(df["Granular Role"].value_counts())
    return df

if __name__ == "__main__":
    enrich_dataset()
