from app.core.config import settings
from app.utils.file_utils import ensure_directory
from app.utils.logger import get_logger


logger = get_logger(__name__)


def get_chroma_client():
    try:
        import chromadb
    except ImportError as error:
        raise RuntimeError(
            "ChromaDB is not installed. Install Microsoft C++ Build Tools on Windows, "
            "or run Chroma in Docker/Linux, then reinstall chromadb."
        ) from error

    # If CHROMA_HTTP_HOST is set, prefer the HTTP client to talk to a Chroma server
    if settings.chroma_http_host:
        host = settings.chroma_http_host
        port = settings.chroma_http_port
        logger.info("Connecting to ChromaDB HTTP server at %s:%s", host, port)
        try:
            return chromadb.HttpClient(host=host, port=port)
        except Exception:
            # Some chromadb client versions accept a 'url' argument
            try:
                base = f"http://{host}:{port}"
                return chromadb.HttpClient(url=base)
            except Exception as err:
                logger.exception("Failed to initialize ChromaDB HTTP client: %s", err)
                raise

    # Otherwise use a local persistent client (useful for non-Docker setups)
    ensure_directory(settings.chroma_persist_directory)
    logger.info("Initializing ChromaDB persistent client at %s", settings.chroma_persist_directory)
    return chromadb.PersistentClient(path=settings.chroma_persist_directory)


def get_chroma_collection():
    client = get_chroma_client()
    collection = client.get_or_create_collection(name=settings.chroma_collection_name)
    logger.info("Using ChromaDB collection %s", settings.chroma_collection_name)
    return collection
