def build_context(context_items) -> str:
    if not context_items:
        return "No matching Knowledge Base context was found. Use recruiter inputs as the primary source."

    context_lines = []
    for index, item in enumerate(context_items, start=1):
        source = item.sourceFileName or "Knowledge Base"
        context_lines.append(f"{index}. Source: {source}\n{item.chunkText}")

    return "\n\n".join(context_lines)
