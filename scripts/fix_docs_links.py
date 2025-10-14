import re
from pathlib import Path

DOCS_DIR = Path("docs")

# Match href values that are relative (no protocol), point inside docs, and end with a slash
# Examples to transform:
#  - href="api/charts/" -> href="api/charts/index.html"
#  - href="getting-started/" -> href="getting-started/index.html"
#  - href="../api/" -> leave as-is (we only handle paths without '..')
#  - href="#section" -> leave as-is
HREF_PATTERN = re.compile(r'href="(?!https?://|#|/)([^"#]*?/)("|#)')


def rewrite_links(html: str) -> str:
    def repl(match: re.Match[str]) -> str:
        path_with_slash = match.group(1)
        trailer = match.group(2)
        # Skip paths that traverse up directories just to be safe
        if path_with_slash.startswith("../"):
            return match.group(0)
        # Convert trailing slash to index.html
        return f'href="{path_with_slash}index.html{trailer}'

    return HREF_PATTERN.sub(repl, html)


def main() -> None:
    for html_file in DOCS_DIR.rglob("*.html"):
        original = html_file.read_text(encoding="utf-8")
        fixed = rewrite_links(original)
        if fixed != original:
            html_file.write_text(fixed, encoding="utf-8")


if __name__ == "__main__":
    main()
