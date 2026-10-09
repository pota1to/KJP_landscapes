import unittest
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = {
    "service-concrete.webp": None,
    "service-drainage.webp": None,
    "service-paving.webp": None,
    "service-fencing.webp": None,
    "service-raised-beds.webp": None,
    "service-decking.webp": None,
    "service-turfing.webp": None,
    "service-artificial-grass.webp": None,
}

HERO_ASSETS = {
    "hero-groundworks.webp": (960, 720),
    "hero-hardscaping.webp": (1600, 1200),
    "hero-lawns.webp": (960, 720),
    "hero-about.webp": (960, 540),
}


class CreditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.stylesheets = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "a" and attributes.get("href"):
            self.links.append(attributes["href"])
        if tag == "link" and attributes.get("rel") == "stylesheet":
            self.stylesheets.append(attributes.get("href"))


class ServiceAssetTests(unittest.TestCase):
    def test_service_images_are_optimised_webp_files(self):
        for filename in ASSETS:
            path = ROOT / "assets" / filename
            with self.subTest(filename=filename):
                self.assertTrue(path.exists(), f"Missing {filename}")
                with Image.open(path) as image:
                    self.assertEqual(image.format, "WEBP")
                    self.assertEqual(image.size, (1200, 900))
                self.assertLessEqual(path.stat().st_size, 350 * 1024)

    def test_internal_hero_images_are_optimised_webp_files(self):
        for filename, expected_size in HERO_ASSETS.items():
            path = ROOT / "assets" / filename
            with self.subTest(filename=filename):
                self.assertTrue(path.exists(), f"Missing {filename}")
                with Image.open(path) as image:
                    self.assertEqual(image.format, "WEBP")
                    self.assertEqual(image.size, expected_size)
                self.assertLessEqual(path.stat().st_size, 350 * 1024)

    def test_credits_page_lists_sources_and_site_navigation(self):
        path = ROOT / "credits.html"
        self.assertTrue(path.exists(), "Missing credits.html")
        html = path.read_text(encoding="utf-8")
        parser = CreditParser()
        parser.feed(html)

        pexels_links = [
            href for href in parser.links
            if href.startswith("https://www.pexels.com/photo/")
        ]
        self.assertEqual(len(pexels_links), 0)
        self.assertIn("KJP project photography", html)
        self.assertNotIn("Illustrative stock photography", html)
        self.assertIn("styles.css", parser.stylesheets)
        decoded_html = unescape(html)
        for photographer in filter(None, ASSETS.values()):
            self.assertIn(photographer, decoded_html)
        self.assertNotIn("Life Of Pix", decoded_html)
        self.assertNotIn("Sergei Starostin", decoded_html)
        self.assertNotIn("Jonathan Borba", decoded_html)
        self.assertNotIn("Ksu&Eli Studio", decoded_html)
        self.assertNotIn("Alfo Medeiros", decoded_html)
        self.assertNotIn("Vishv Shah", decoded_html)
        self.assertNotIn("Anna Shvets", decoded_html)
        self.assertNotIn("Engin Akyurt", decoded_html)
        for page in (
            "index.html",
            "groundworks-structural.html",
            "hardscaping-features.html",
            "lawns-decking.html",
            "about.html",
        ):
            self.assertIn(page, parser.links)


if __name__ == "__main__":
    unittest.main()
