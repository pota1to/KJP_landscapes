#!/usr/bin/env python3
"""Build reproducible WebP thumbnail and viewer variants for the KJP gallery."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


GALLERY_SOURCES = (
    "2b1bad94-721c-4660-86a1-99362ecf2941.jpeg",
    "6d811fca-8c61-405a-b33b-7bfb413f328c.jpeg",
    "9ade2f42-8209-493f-b5e9-236319005d67.jpeg",
    "54d34ee3-2cc4-45bb-b0e3-063170e09e25.jpeg",
    "astro1.jpg",
    "astro2.jpg",
    "d55ae2d5-b093-4a09-a501-06042d1a51c2.jpeg",
    "df9fddf7-1ff9-4d69-88f3-b3d73aa72c19.jpeg",
    "drain2.jpg",
    "drive1.jpg",
    "drive2.jpg",
    "drive3.jpg",
    "drive4.jpg",
    "fencing1.jpg",
    "fencing2.jpg",
    "fencing5.jpg",
    "fencing6.jpg",
    "fencing7.jpg",
    "garden1.jpg",
    "garden2.jpg",
    "garden3.jpg",
    "garden4.jpg",
    "garden5.jpg",
    "garden6.jpg",
    "garden7.jpg",
    "garden10.jpg",
    "garden11.jpg",
    "garden12 before.jpg",
    "groundworks1.jpg",
    "Hero.jpeg",
    "patio4.jpg",
    "patio5.jpg",
    "patio6.jpg",
    "patio7.jpg",
    "patio9.jpg",
    "paving1.jpg",
    "paving2.jpg",
    "raised beds3.jpg",
    "raised beds4.jpg",
    "stairs2.jpg",
    "turfing1.jpg",
    "drain1-edited.png",
    "fencing3 edited.png",
    "fencing4 aedited.png",
    "garden6 edited.png",
    "garden9 aedited.png",
    "garden8 aedited.png",
    "garden12 aedited.png",
    "patio3 aedited.png",
    "patio2 edited.png",
    "patio1 aedited.png",
    "patio8 aedited.png",
    "patio10 aedited.png",
    "raised1 beds edited.png",
    "raised beds2 aedited.png",
    "stairs1 aedited.png",
)

VARIANTS = (
    ("thumbs", 720, 78),
    ("full", 1920, 85),
)


def build_variants(source_dir: Path, output_dir: Path) -> None:
    """Create sequential, orientation-correct WebP variants without enlargement."""
    missing = [name for name in GALLERY_SOURCES if not (source_dir / name).is_file()]
    if missing:
        raise FileNotFoundError(f"Missing gallery source: {missing[0]}")

    for variant, _, _ in VARIANTS:
        (output_dir / variant).mkdir(parents=True, exist_ok=True)

    for index, source_name in enumerate(GALLERY_SOURCES, start=1):
        destination_name = f"gallery-{index:02}.webp"
        with Image.open(source_dir / source_name) as source:
            oriented = ImageOps.exif_transpose(source).convert("RGB")
            for variant, max_edge, quality in VARIANTS:
                image = oriented.copy()
                image.thumbnail(
                    (max_edge, max_edge),
                    resample=Image.Resampling.LANCZOS,
                    reducing_gap=3.0,
                )
                image.save(
                    output_dir / variant / destination_name,
                    format="WEBP",
                    quality=quality,
                    method=6,
                )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_dir", type=Path, nargs="?", default=Path("assets/gallery"))
    arguments = parser.parse_args()
    build_variants(arguments.source_dir, arguments.output_dir)


if __name__ == "__main__":
    main()
