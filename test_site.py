from html.parser import HTMLParser
from pathlib import Path
import unittest


ROOT = Path(__file__).parent


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.headings: list[str] = []
        self.links: list[str] = []
        self._heading_parts: list[str] | None = None

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        attributes = dict(attrs)
        if tag in {"h1", "h2"}:
            self._heading_parts = []
        if tag == "a" and (href := attributes.get("href")) is not None:
            self.links.append(href)

    def handle_data(self, data: str) -> None:
        if self._heading_parts is not None:
            self._heading_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"h1", "h2"} and self._heading_parts is not None:
            self.headings.append(" ".join("".join(self._heading_parts).split()))
            self._heading_parts = None


def parse_page(path: Path) -> tuple[PageParser, str]:
    html = path.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(html)
    return parser, html


class RulesPageTests(unittest.TestCase):
    def test_rules_page_has_approved_section_order(self) -> None:
        parser, _ = parse_page(ROOT / "rules" / "index.html")

        self.assertEqual(
            parser.headings,
            [
                "How to Play Bank It",
                "Object of the Game",
                "Starting Out",
                "Getting the Game Rolling",
                "Important Dice Rules",
                "Scoring",
                "Ending a Round",
                "Ending the Game",
            ],
        )

    def test_rules_page_preserves_key_mechanics(self) -> None:
        _, html = parse_page(ROOT / "rules" / "index.html")

        for mechanic in (
            "10, 15, or 20 rounds",
            "worth 70 BANK points",
            "double the cumulative BANK score",
            "only BANK points once per round",
            "highest personal BANK score wins",
        ):
            with self.subTest(mechanic=mechanic):
                self.assertIn(mechanic, html)

    def test_rules_page_links_primary_destinations(self) -> None:
        parser, html = parse_page(ROOT / "rules" / "index.html")

        self.assertIn("/", parser.links)
        self.assertIn("/game/", parser.links)
        self.assertGreaterEqual(
            parser.links.count("https://www.thunderhivegames.com/"), 2
        )
        self.assertIn('href="#object-of-the-game"', html)


class LandingPageTests(unittest.TestCase):
    def test_landing_page_links_rules_from_header_and_footer(self) -> None:
        parser, _ = parse_page(ROOT / "index.html")

        self.assertEqual(parser.links.count("/rules/"), 2)


if __name__ == "__main__":
    unittest.main()
