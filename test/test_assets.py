import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SERVICE_ASSETS = (
    "service-concrete.webp",
    "service-drainage.webp",
    "service-paving.webp",
    "service-fencing.webp",
    "service-raised-beds.webp",
    "service-decking.webp",
    "service-turfing.webp",
    "service-artificial-grass.webp",
)

HERO_ASSETS = {
    "hero-groundworks.webp": (960, 720),
    "hero-hardscaping.webp": (1600, 1200),
    "hero-lawns.webp": (960, 720),
    "hero-about.webp": (960, 540),
}


class ServiceAssetTests(unittest.TestCase):
    def test_all_pages_use_the_crawlable_kjp_png_favicon(self):
        favicon = ROOT / "kjp-logo96x96.png"
        self.assertTrue(favicon.exists(), "Missing kjp-logo96x96.png")
        with Image.open(favicon) as image:
            self.assertEqual(image.format, "PNG")
            self.assertEqual(image.size, (96, 96))

        expected_attributes = (
            'rel="icon"',
            'type="image/png"',
            'sizes="96x96"',
            'href="/kjp-logo96x96.png"',
        )
        for page in (
            "index.html",
            "groundworks-structural.html",
            "hardscaping-features.html",
            "lawns-decking.html",
            "about.html",
            "gallery.html",
        ):
            html = (ROOT / page).read_text(encoding="utf-8")
            with self.subTest(page=page):
                favicon_line = next(
                    (line for line in html.splitlines() if 'rel="icon"' in line),
                    "",
                )
                for attribute in expected_attributes:
                    self.assertIn(attribute, favicon_line)
                self.assertNotIn("data:image/svg+xml", html)

    def test_service_images_are_optimised_webp_files(self):
        for filename in SERVICE_ASSETS:
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

    def test_about_service_area_map_is_an_optimised_webp_file(self):
        path = ROOT / "assets" / "areas-map.webp"
        self.assertTrue(path.exists(), "Missing areas-map.webp")
        with Image.open(path) as image:
            self.assertEqual(image.format, "WEBP")
            self.assertEqual(image.size, (1200, 1200))
        self.assertLessEqual(path.stat().st_size, 350 * 1024)

    def test_gallery_images_have_optimised_thumbnail_and_full_variants(self):
        expected = {f"gallery-{index:02}.webp" for index in range(1, 57)}
        variants = (
            (ROOT / "assets" / "gallery" / "thumbs", 720, 250 * 1024),
            (ROOT / "assets" / "gallery" / "full", 1920, 900 * 1024),
        )

        for directory, max_edge, max_bytes in variants:
            with self.subTest(directory=directory.name):
                self.assertTrue(directory.is_dir(), f"Missing {directory}")
                actual = {path.name for path in directory.iterdir() if path.is_file()}
                self.assertEqual(actual, expected)

            for filename in sorted(expected):
                path = directory / filename
                with self.subTest(variant=directory.name, filename=filename):
                    with Image.open(path) as image:
                        self.assertEqual(image.format, "WEBP")
                        self.assertGreater(image.width, 0)
                        self.assertGreater(image.height, 0)
                        self.assertLessEqual(max(image.size), max_edge)
                    self.assertLessEqual(path.stat().st_size, max_bytes)

    def test_credits_page_and_links_are_removed(self):
        self.assertFalse((ROOT / "credits.html").exists())
        for page in (
            "index.html",
            "groundworks-structural.html",
            "hardscaping-features.html",
            "lawns-decking.html",
            "about.html",
            "gallery.html",
        ):
            html = (ROOT / page).read_text(encoding="utf-8")
            self.assertNotIn("credits.html", html)
            self.assertNotIn("KJP project photograph", html)


if __name__ == "__main__":
    unittest.main()
