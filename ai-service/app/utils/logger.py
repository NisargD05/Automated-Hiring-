import logging
from app.core.logging_config import configure_logging


configure_logging()


def get_logger(name: str):
    return logging.getLogger(name)
