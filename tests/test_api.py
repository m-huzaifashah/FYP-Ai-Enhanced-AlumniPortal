import requests

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

with open("dummy.pdf", "wb") as f:
    f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 55\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(M. Huzaifa Habib Shah Software Engineer MERN Express.js MongoDB React.js) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000219 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n325\n%%EOF")

res = requests.post("http://127.0.0.1:8001/analyze", data={"job_description": jd_text}, files={"file": ("dummy.pdf", open("dummy.pdf", "rb"))})
print(res.json().get("skills", {}).get("matched_skills"))
