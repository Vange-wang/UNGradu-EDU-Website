#!/usr/bin/env python3
"""Create reproducible reference/actual/overlay/diff evidence for UI captures."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageStat


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference", required=True)
    parser.add_argument("--actual", required=True)
    parser.add_argument("--output-prefix", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    reference_path = Path(args.reference)
    actual_path = Path(args.actual)
    output_prefix = Path(args.output_prefix)
    output_prefix.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(reference_path) as reference_source:
        reference = reference_source.convert("RGB")
    with Image.open(actual_path) as actual_source:
        actual = actual_source.convert("RGB")

    if reference.size != actual.size:
        raise SystemExit(
            "reference and actual dimensions must match exactly: "
            f"{reference.size} != {actual.size}"
        )

    reference.save(f"{output_prefix}-reference.png")
    actual.save(f"{output_prefix}-actual.png")

    overlay = Image.blend(reference, actual, 0.5)
    overlay.save(f"{output_prefix}-overlay-50.png")

    raw_diff = ImageChops.difference(reference, actual)
    visible_diff = ImageEnhance.Contrast(raw_diff).enhance(4)
    visible_diff.save(f"{output_prefix}-diff.png")

    histogram = raw_diff.histogram()
    total_channel_values = reference.width * reference.height * 3
    absolute_sum = sum(
        value * count
        for channel in range(3)
        for value, count in enumerate(
            histogram[channel * 256 : (channel + 1) * 256]
        )
    )
    mean_absolute_error = absolute_sum / total_channel_values

    stats = ImageStat.Stat(raw_diff)
    mean_squared_error = sum(value * value for value in stats.rms) / 3
    pixel_data = (
        raw_diff.get_flattened_data()
        if hasattr(raw_diff, "get_flattened_data")
        else raw_diff.getdata()
    )
    changed_pixels = sum(1 for pixel in pixel_data if pixel != (0, 0, 0))
    pixel_count = reference.width * reference.height

    report = {
        "actual": str(actual_path),
        "changedPixelRatio": changed_pixels / pixel_count,
        "height": reference.height,
        "meanAbsoluteError": mean_absolute_error,
        "reference": str(reference_path),
        "rootMeanSquareError": math.sqrt(mean_squared_error),
        "width": reference.width,
    }
    Path(f"{output_prefix}-metrics.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
