import unittest
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = {
    "service-concrete.webp": "Life Of Pix",
    "service-drainage.webp": "Sergei Starostin",
    "service-paving.webp": "Jonathan Borba",
    "service-fencing.webp": "Ksu&Eli Studio",
    "service-raised-beds.webp": "Alfo Medeiros",
    "service-decking.webp": "Vishv Shah",
    "service-turfing.webp": "Anna Shvets",
    "service-artificial-grass.webp": "Engin Akyurt",
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
        self.assertEqual(len(pexels_links), 8)
        self.assertIn("Illustrative stock photography", html)
        self.assertIn("styles.css", parser.stylesheets)
        decoded_html = unescape(html)
        for photographer in ASSETS.values():
            self.assertIn(photographer, decoded_html)
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
