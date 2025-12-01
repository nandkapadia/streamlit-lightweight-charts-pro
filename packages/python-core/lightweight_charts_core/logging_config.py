"""Logging configuration for Streamlit Lightweight Charts Pro.

This module provides centralized logging configuration for the package,
ensuring consistent logging behavior across all components. It handles
logger initialization, formatting, handler management, and prevents
common logging pitfalls like duplicate handlers.

The module provides:
    - Root logger configuration with customizable levels
    - Component-specific logger retrieval with proper naming
    - Automatic handler management to prevent duplicates
    - Consistent log format across the package
    - Production-ready default settings (ERROR level)

Key Features:
    - Centralized logging configuration
    - Customizable log levels and formats
    - Automatic duplicate handler prevention
    - Hierarchical logger naming convention
    - Thread-safe logger retrieval
    - stdout/stderr stream handling

Example:
    Basic logging setup::

        from lightweight_charts_core.logging_config import setup_logging, get_logger
        import logging

        # Set up logging with INFO level
        setup_logging(level=logging.INFO)

        # Get a logger for chart rendering component
        logger = get_logger("chart_rendering")
        logger.info("Chart rendered successfully")

    Custom log format::

        # Define custom format
        custom_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"

        # Setup with custom format
        setup_logging(level=logging.DEBUG, log_format=custom_format)

Note:
    The module automatically initializes logging with ERROR level
    at import time. Call setup_logging() to change the configuration.

"""

# Standard Imports
import logging
import sys


def setup_logging(
    level: int = logging.WARN,
    log_format: str | None = None,
    stream: logging.StreamHandler | None = None,
) -> logging.Logger:
    """Set up logging configuration for the package.

    This function configures the root logger for the package with the
    specified settings. It ensures that logging is properly initialized
    and prevents duplicate handlers from being added on repeated calls.

    The function creates a logger hierarchy under the package name
    "lightweight_charts_core", allowing for fine-grained
    control over logging for different components.

    Args:
        level (int, optional): Logging level to set for the root logger.
            Defaults to logging.WARN for production use. Common values:
                - logging.DEBUG: Detailed information for diagnosing
                - logging.INFO: General informational messages
                - logging.WARNING: Warning messages (default)
                - logging.ERROR: Error messages
                - logging.CRITICAL: Critical error messages
        log_format (Optional[str]): Custom log format string using
            Python logging format codes. If None, uses a standard format
            that includes timestamp, logger name, level, and message.
            Example: "%(asctime)s - %(levelname)s - %(message)s"
        stream (Optional[logging.StreamHandler]): Custom stream handler
            for log output. If None, creates a StreamHandler that writes
            to sys.stdout.

    Returns:
        logging.Logger: The configured root logger instance for the
            package with the name "lightweight_charts_core".

    Example:
        Basic setup::

            >>> import logging
            >>> logger = setup_logging(level=logging.INFO)
            >>> logger.info("Logging configured")

        Custom format setup::

            >>> custom_format = "%(levelname)s: %(message)s"
            >>> logger = setup_logging(
            ...     level=logging.DEBUG,
            ...     log_format=custom_format
            ... )

    Note:
        This function is idempotent - calling it multiple times with
        the same logger won't create duplicate handlers. However, the
        level will be updated on subsequent calls.

    """
    # Create or retrieve the root logger for this package
    # Using a specific package name creates a logger hierarchy
    # This allows filtering logs by package if needed
    logger = logging.getLogger("lightweight_charts_core")

    # Set the logging level for this logger
    # This controls which messages are processed by this logger
    logger.setLevel(level)

    # Check if handlers already exist to avoid duplicates
    # Multiple handler additions would result in duplicate log entries
    if logger.handlers:
        # Handlers already configured, return existing logger
        # This makes the function idempotent (safe to call multiple times)
        return logger

    # Set default format if not provided by user
    # Format includes:
    # - %(asctime)s: Timestamp when log entry was created
    # - %(name)s: Logger name (useful for hierarchical loggers)
    # - %(levelname)s: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    # - %(message)s: The actual log message
    if log_format is None:
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Create formatter to format log messages according to format string
    # This formatter will be applied to all messages handled by this logger
    formatter = logging.Formatter(log_format)

    # Create stream handler if not provided
    # Stream handler sends log messages to a stream (stdout, stderr, file)
    if stream is None:
        # Create handler that writes to stdout (standard output)
        # Using stdout instead of stderr for better integration with
        # Streamlit which captures stdout
        stream = logging.StreamHandler(sys.stdout)

        # Set level on the handler itself
        # Handler level acts as a secondary filter after logger level
        stream.setLevel(level)

        # Apply the formatter to the handler
        # This determines how log messages will be formatted when output
        stream.setFormatter(formatter)

    # Add the configured handler to the logger
    # The logger will now send messages to this handler for output
    logger.addHandler(stream)

    # Return the configured logger instance
    # Caller can use this to log messages immediately
    return logger


def get_logger(name: str | None = None, level: int = logging.DEBUG) -> logging.Logger:
    """Get a logger instance for the package.

    This function creates or retrieves a logger instance with proper
    naming convention. The logger name is automatically prefixed with
    the package name to maintain logger hierarchy and enable filtering.

    Logger names follow the pattern:
    "lightweight_charts_core.{component_name}"

    This hierarchical naming allows:
        - Filtering logs by component
        - Different log levels per component
        - Inheritance of configuration from root logger

    Args:
        name (Optional[str]): Component name to append to package name.
            If None, returns the root package logger. The full logger
            name will be "lightweight_charts_core.{name}".
            Examples: "chart_rendering", "data_processing", "validation"
        level (int, optional): Logging level for this specific logger.
            Defaults to logging.DEBUG for detailed logging. This level
            is set on the logger instance and can be overridden by
            parent logger settings.

    Returns:
        logging.Logger: A logger instance with the specified name
            and level. The logger inherits configuration from the
            root package logger.

    Example:
        Get root logger::

            >>> root_logger = get_logger()
            >>> root_logger.error("Critical error")

        Get component logger::

            >>> chart_logger = get_logger("chart_rendering")
            >>> chart_logger.info("Chart initialized")

        Get logger with custom level::

            >>> data_logger = get_logger("data", level=logging.WARNING)
            >>> data_logger.warning("Data validation failed")

    Note:
        The logger inherits handlers and formatters from the root
        package logger configured by setup_logging(). You don't need
        to configure handlers for component loggers.

    """
    # Create hierarchical logger name by combining package name with
    # component name. Example:
    # - "lightweight_charts_core.None" becomes root logger
    # - "lightweight_charts_core.charts" for chart component
    # - "lightweight_charts_core.data" for data component
    logger = logging.getLogger(f"lightweight_charts_core.{name}")

    # Set the logging level for this specific logger
    # This level filters messages before they reach the handlers
    # Messages below this level are discarded
    logger.setLevel(level)

    # Return the configured logger instance
    # Caller can immediately use this logger for logging
    return logger


# Initialize default logging configuration at module import time
# This ensures logging is available even if setup_logging() is not
# explicitly called. Uses WARNING level by default for production.
# Users can call setup_logging() to change configuration.
setup_logging()
