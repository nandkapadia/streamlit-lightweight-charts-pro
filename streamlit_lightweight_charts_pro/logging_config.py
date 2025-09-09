"""
Logging configuration for Streamlit Lightweight Charts Pro.

This module provides centralized logging configuration for the package,
including proper log levels, formatting, and handlers. It ensures consistent
logging behavior across all components of the library.

The module provides two main functions:
    - setup_logging(): Configures the root logger with custom settings
    - get_logger(): Retrieves a logger instance with proper naming

Features:
    - Centralized logging configuration
    - Customizable log levels and formats
    - Automatic handler management to prevent duplicates
    - Consistent logger naming convention
    - Default error-level logging for production use

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.logging_config import get_logger, setup_logging

    # Set up logging with custom level
    setup_logging(level=logging.INFO)

    # Get a logger for a specific component
    logger = get_logger("chart_rendering")
    logger.info("Chart rendered successfully")
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

import logging
import sys
from typing import Optional


def setup_logging(
    level: int = logging.ERROR,
    log_format: Optional[str] = None,
    stream: Optional[logging.StreamHandler] = None,
) -> logging.Logger:
    """
    Set up logging configuration for the package.

    This function configures the root logger for the package with the specified
    settings. It ensures that logging is properly initialized and prevents
    duplicate handlers from being added.

    Args:
        level: Logging level to set for the root logger. Defaults to ERROR
            for production use. Common values: logging.DEBUG, logging.INFO,
            logging.WARNING, logging.ERROR, logging.CRITICAL.
        log_format: Custom log format string. If None, uses a standard format
            that includes timestamp, logger name, level, and message.
        stream: Custom stream handler. If None, creates a StreamHandler
            that writes to sys.stdout.

    Returns:
        logging.Logger: The configured root logger instance for the package.

    Raises:
        ValueError: If an invalid logging level is provided.

    Example:
        ```python
        import logging
        from streamlit_lightweight_charts_pro.logging_config import setup_logging

        # Set up logging with INFO level
        logger = setup_logging(level=logging.INFO)
        logger.info("Logging configured successfully")

        # Set up logging with custom format
        custom_format = "%(asctime)s - %(levelname)s - %(message)s"
        setup_logging(level=logging.DEBUG, log_format=custom_format)
        ```
    """
    # Create logger
    logger = logging.getLogger("streamlit_lightweight_charts_pro")
    logger.setLevel(level)

    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger

    # Set default format if not provided
    if log_format is None:
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Create formatter
    formatter = logging.Formatter(log_format)

    # Create stream handler if not provided
    if stream is None:
        stream = logging.StreamHandler(sys.stdout)
        stream.setLevel(level)
        stream.setFormatter(formatter)

    # Add handler to logger
    logger.addHandler(stream)

    return logger


def get_logger(name: Optional[str] = None, level: int = logging.ERROR) -> logging.Logger:
    """
    Get a logger instance for the package.

    This function creates or retrieves a logger instance with the proper naming
    convention. The logger name is automatically prefixed with the package name
    to ensure proper hierarchy and filtering.

    Args:
        name: Optional logger name that will be appended to the package name.
            If None, returns the root package logger. The full logger name
            will be "streamlit_lightweight_charts_pro.{name}".
        level: Logging level for this specific logger. Defaults to ERROR
            for production use. This level is set on the logger instance
            and can be overridden by parent loggers.

    Returns:
        logging.Logger: A logger instance with the specified name and level.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.logging_config import get_logger

        # Get the root package logger
        root_logger = get_logger()
        root_logger.error("Critical error occurred")

        # Get a logger for a specific component
        chart_logger = get_logger("chart_rendering", level=logging.INFO)
        chart_logger.info("Chart component initialized")

        # Get a logger for data processing
        data_logger = get_logger("data_processing")
        data_logger.debug("Processing data batch")
        ```
    """
    logger = logging.getLogger(f"streamlit_lightweight_charts_pro.{name}")
    logger.setLevel(level)
    return logger


# Initialize default logging
setup_logging()
