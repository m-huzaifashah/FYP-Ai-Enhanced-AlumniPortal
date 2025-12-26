import re

# Strict technical skill ontology
TECH_SKILLS = {
    # Languages
    "python", "java", "javascript", "c#", "c++", "go", "scala",

    # Frameworks
    "node.js", "node js", "express", "express.js",
    "fastapi", "flask", "django", "spring",

    # Databases
    "sql", "postgresql", "mysql", "mongodb",

    # Tools
    "docker", "git", "github", "postman",

    # APIs & Auth
    "rest api", "restful api", "jwt"
}

def extract_skills_from_text(text: str) -> list[str]:
    text = text.lower()
    found = set()

    for skill in TECH_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", text):
            found.add(skill)

    return list(found)
