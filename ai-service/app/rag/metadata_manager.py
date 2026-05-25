def build_metadata(source_file_name: str, chunk_index: int):
    return {
        "sourceFileName": source_file_name,
        "chunkIndex": chunk_index,
    }
