import hashlib
from app.core.config import settings
from app.utils.logger import get_logger


logger = get_logger(__name__)
_model = None


def _hash_embedding(text: str, dimensions: int = 384):
    digest = hashlib.sha256((text or "").encode("utf-8")).digest()
    values = []
    while len(values) < dimensions:
      for byte in digest:
          values.append((byte / 255.0) - 0.5)
          if len(values) == dimensions:
              break
      digest = hashlib.sha256(digest).digest()
    return values


def _get_sentence_transformer():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading sentence-transformers model %s", settings.embedding_model_name)
        _model = SentenceTransformer(settings.embedding_model_name)
    return _model


def embed_texts(texts):
    if not texts:
        return []

    if settings.embedding_provider == "sentence-transformers":
        try:
            model = _get_sentence_transformer()
            logger.info("Generating embeddings for %s chunks", len(texts))
            return model.encode(texts, convert_to_numpy=True).tolist()
        except Exception as error:
            logger.warning(
                "Sentence-transformers embedding failed: %s. Falling back to deterministic local embeddings.",
                error,
            )

    logger.info("Generating deterministic local embeddings for %s chunks", len(texts))
    return [_hash_embedding(text) for text in texts]


def embed_text(text: str):
    embeddings = embed_texts([text])
    return embeddings[0] if embeddings else []
