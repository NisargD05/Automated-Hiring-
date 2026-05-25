import re
from app.document_processing.cleaner import clean_text
from app.document_processing.pdf_extractor import extract_pdf_text
from app.utils.logger import get_logger


logger = get_logger(__name__)


SECTION_ALIASES = {
    "skills": ["skills", "technical skills", "technologies"],
    "experience": ["experience", "work experience", "professional experience", "employment"],
    "projects": ["projects", "selected projects"],
    "education": ["education", "academics"],
    "certifications": ["certifications", "certificates"],
}


def _find_section_text(text: str, aliases):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    starts = []
    for index, line in enumerate(lines):
        normalized = re.sub(r"[^a-z ]", "", line.lower()).strip()
        for key, values in SECTION_ALIASES.items():
            if normalized in values:
                starts.append((index, key))

    target_indexes = [index for index, key in starts if key and any(key_alias in SECTION_ALIASES.get(key, []) for key_alias in aliases)]
    if not target_indexes:
        return ""

    start = target_indexes[0]
    following = [index for index, _ in starts if index > start]
    end = following[0] if following else min(len(lines), start + 16)
    return "\n".join(lines[start + 1 : end])


def _split_list(value: str, max_items: int = 18):
    parts = re.split(r"[,|\u2022\n;]+", value or "")
    return [part.strip(" -\t") for part in parts if len(part.strip(" -\t")) > 1][:max_items]


def parse_resume_file(file_path: str):
    logger.info("[Resume Parser] PDF received: %s", file_path)
    raw_text = extract_pdf_text(file_path)
    cleaned_text = clean_text(raw_text)
    logger.info("[Resume Parser] Extracted text length: %s", len(cleaned_text))

    if not cleaned_text:
        raise ValueError("Resume PDF extraction produced empty text. OCR is not enabled for this deployment.")

    skills_text = _find_section_text(raw_text, SECTION_ALIASES["skills"])
    projects_text = _find_section_text(raw_text, SECTION_ALIASES["projects"])
    education_text = _find_section_text(raw_text, SECTION_ALIASES["education"])
    certifications_text = _find_section_text(raw_text, SECTION_ALIASES["certifications"])
    experience_text = _find_section_text(raw_text, SECTION_ALIASES["experience"])

    experience_items = []
    for item in _split_list(experience_text, max_items=8):
        experience_items.append(
            {
                "role": item[:120],
                "company": "",
                "duration": "",
                "highlights": [item],
            }
        )

    parsed_sections = {
        "skills": _split_list(skills_text),
        "experience": experience_items,
        "projects": _split_list(projects_text, max_items=10),
        "education": clean_text(education_text)[:500],
        "certifications": _split_list(certifications_text, max_items=10),
    }

    logger.info("[Resume Parser] Parsed skills: %s", parsed_sections["skills"][:12])
    logger.info("[Resume Parser] Parsed projects: %s", parsed_sections["projects"][:8])
    logger.info("[Resume Parser] Parsed experience count: %s", len(parsed_sections["experience"]))

    return {
        "resumeText": cleaned_text,
        "parsedSections": parsed_sections,
        "characterCount": len(cleaned_text),
        "extractionEngine": "pdfplumber/pypdf",
    }
