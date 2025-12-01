"""Unit tests for CLI module.

Tests command-line interface functionality including:
- Frontend build management
- Command parsing and execution
- Error handling
"""

import subprocess
from unittest.mock import patch

from streamlit_lightweight_charts_pro.cli import main


class TestMain:
    """Tests for main CLI entry point."""

    def test_no_command(self):
        """Test main with no command."""
        with patch("sys.argv", ["streamlit-lightweight-charts-pro"]):
            result = main()

        assert result == 1

    def test_build_frontend_command_success(self):
        """Test build-frontend command success."""
        with (
            patch("sys.argv", ["streamlit-lightweight-charts-pro", "build-frontend"]),
            patch("streamlit_lightweight_charts_pro.cli.build_frontend") as mock_build,
        ):
            mock_build.return_value = True
            result = main()

        assert result == 0

    def test_build_frontend_command_failure(self):
        """Test build-frontend command failure."""
        with (
            patch("sys.argv", ["streamlit-lightweight-charts-pro", "build-frontend"]),
            patch("streamlit_lightweight_charts_pro.cli.build_frontend") as mock_build,
        ):
            mock_build.return_value = False
            result = main()

        assert result == 1

    def test_check_command_success(self):
        """Test check command success."""
        with (
            patch("sys.argv", ["streamlit-lightweight-charts-pro", "check"]),
            patch("streamlit_lightweight_charts_pro.cli.check_frontend_build") as mock_check,
        ):
            mock_check.return_value = True
            result = main()

        assert result == 0

    def test_check_command_failure(self):
        """Test check command failure."""
        with (
            patch("sys.argv", ["streamlit-lightweight-charts-pro", "check"]),
            patch("streamlit_lightweight_charts_pro.cli.check_frontend_build") as mock_check,
        ):
            mock_check.return_value = False
            result = main()

        assert result == 1

    def test_version_command(self):
        """Test version command."""
        with patch("sys.argv", ["streamlit-lightweight-charts-pro", "version"]):
            result = main()

        assert result == 0

    def test_unknown_command(self):
        """Test unknown command."""
        with patch("sys.argv", ["streamlit-lightweight-charts-pro", "unknown"]):
            result = main()

        assert result == 1

    def test_help_message_format(self, capsys):
        """Test help message is properly formatted."""
        with patch("sys.argv", ["streamlit-lightweight-charts-pro"]):
            main()
            captured = capsys.readouterr()

        assert "Usage:" in captured.out
        assert "build-frontend" in captured.out
        assert "check" in captured.out
        assert "version" in captured.out


class TestBuildFrontend:
    """Tests for build_frontend function."""

    def test_build_frontend_npm_not_found(self):
        """Test build_frontend when npm is not found."""
        with patch("streamlit_lightweight_charts_pro.cli.shutil.which") as mock_which:
            mock_which.return_value = None

            from streamlit_lightweight_charts_pro.cli import build_frontend

            # NpmNotFoundError is raised but caught, resulting in False return
            result = build_frontend()
            assert result is False

    def test_build_frontend_subprocess_error(self):
        """Test build_frontend when subprocess fails."""
        with patch("streamlit_lightweight_charts_pro.cli.shutil.which") as mock_which:
            mock_which.return_value = "/usr/bin/npm"
            with patch("streamlit_lightweight_charts_pro.cli.Path.exists") as mock_exists:
                mock_exists.return_value = True
                with patch("streamlit_lightweight_charts_pro.cli.subprocess.run") as mock_run:
                    mock_run.side_effect = subprocess.CalledProcessError(1, "npm")

                    from streamlit_lightweight_charts_pro.cli import build_frontend

                    result = build_frontend()

        assert result is False

    def test_check_frontend_build(self):
        """Test check_frontend_build function."""
        from streamlit_lightweight_charts_pro.cli import check_frontend_build

        # Just test it doesn't crash
        result = check_frontend_build()
        assert isinstance(result, bool)
