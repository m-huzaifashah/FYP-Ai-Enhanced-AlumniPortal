import sys
import json
from ml.resume_analyzer.nlp.ner_extractor import NERExtractor

jd_text = """Key Responsibilities
    Full-Stack Development: Design, develop, and maintain web applications from conception to deployment.
    Database Management: Create and manage MongoDB schemas, ensuring efficient data storage and retrieval.
    Back-End Development: Build secure, scalable APIs using Node.js and Express.js.
    Front-End Development: Create interactive, responsive UIs with React.js.
    Collaboration: Work with cross-functional teams (designers, stakeholders) to define and implement new features.
    Debugging & Testing: Troubleshoot, debug, and optimize applications for speed and scalability.
    Documentation: Maintain clear documentation of code, architecture, and APIs. 

Required Skills and Qualifications
    Technical Stack: Strong proficiency in MongoDB, Express.js, React.js, and Node.js.
    Languages: Expert knowledge of JavaScript (ES6+), HTML5, and CSS3.
    APIs & Tools: Experience with RESTful APIs, Git, and third-party integrations.
    Database: Experience with NoSQL database design and optimization.
    Education: Bachelor’s degree in Computer Science, IT, or related field. 

Preferred Qualifications
    Experience with cloud platforms (AWS, Azure) and deployment DevOps tools (Docker).
    Familiarity with Agile/Scrum methodologies.
    Strong analytical and problem-solving skills. 

Typical Experience Level
    Junior/Mid-Level: 1–3 years experience.
    Senior Level: 4+ years experience, including leadership in architectural decisions and team mentoring."""

ner = NERExtractor()
fake_parsed = {"raw_text": jd_text, "sections": {"skills": jd_text, "experience": jd_text}}
res = ner.extract(fake_parsed)
print("Skills found in JD:", res["skills"])
