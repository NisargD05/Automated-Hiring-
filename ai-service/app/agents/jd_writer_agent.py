from app.llm.gemini_client import generate_with_gemini
from app.llm.output_parser import parse_jd_output
from app.llm.prompt_builder import build_jd_prompt
from app.services.jd_generation_service import build_fallback_job_description


def write_job_description(job_details, context_text):
    prompt = build_jd_prompt(job_details, context_text)
    llm_text = generate_with_gemini(prompt)

    if not llm_text:
      return build_fallback_job_description(job_details, context_text)

    return parse_jd_output(llm_text)
