def extract_skills_from_text(text: str, skill_vocab: list[str]) -> list[str]:
    found = []
    for skill in skill_vocab:
        if skill in text:
            found.append(skill)
    return list(set(found))
