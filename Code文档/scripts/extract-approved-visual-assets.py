#!/usr/bin/env python3
"""Extract approved illustration-only assets from the frozen UI references."""

from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image, ImageDraw


HOME_CROPS = {
    "brand-mark.png": (56, 24, 105, 73),
    "home-boy.png": (1086, 408, 1230, 604),
    "home-decor-left.png": (52, 145, 118, 370),
    "home-decor-right.png": (866, 130, 1026, 370),
    "home-girl.png": (1387, 408, 1526, 604),
    "home-shield-check.png": (1098, 661, 1159, 720),
}

LOGIN_CROPS = {
    "login-boy.png": (179, 438, 314, 625),
    "login-code-icon.png": (915, 542, 960, 590),
    "login-decor.png": (650, 192, 794, 311),
    "login-email-icon.png": (914, 390, 960, 435),
    "login-girl.png": (620, 438, 752, 625),
    "login-note-account.png": (166, 662, 222, 718),
    "login-note-lock.png": (167, 790, 222, 846),
    "login-note-safety.png": (167, 726, 222, 781),
}

LOGIN_STATIC_CROPS = {
    "login-static-form.png": (851, 162, 1522, 899),
    "login-static-intro.png": (112, 160, 819, 899),
}

RULES_CROPS = {
    "rules-student-shield.png": (83, 584, 500, 852),
}

RULES_STATIC_CROPS = {
    "rules-static-intro.png": (55, 102, 536, 899),
    "rules-static-list.png": (565, 102, 1579, 901),
}

CUSTOMER_SERVICE_STATIC_CROPS = {
    "customer-service-static-header.png": (40, 21, 1500, 99),
    "customer-service-static-info.png": (40, 115, 1499, 258),
    "customer-service-static-side.png": (40, 273, 433, 982),
}

CUSTOMER_SERVICE_CHAT_CROP = (457, 273, 1500, 982)

CUSTOMER_SERVICE_CHAT_LAYERS = {
    "customer-service-static-welcome.png": (508, 326, 1161, 427),
    "customer-service-static-chip-1.png": (478, 802, 671, 853),
    "customer-service-static-chip-2.png": (672, 802, 873, 853),
    "customer-service-static-chip-3.png": (874, 802, 1074, 853),
    "customer-service-static-chip-4.png": (1075, 802, 1294, 853),
    "customer-service-static-chip-5.png": (1295, 802, 1481, 853),
    "customer-service-static-input.png": (483, 874, 1317, 950),
    "customer-service-static-send.png": (1333, 874, 1476, 950),
}

CUSTOMER_SERVICE_CONTENT_RECTS = (
    (40, 21, 1500, 99),
    (40, 115, 1499, 258),
    (40, 273, 433, 982),
    (457, 273, 1500, 982),
)

TUTOR_PROFILES_STATIC_CROPS = {
    "tutor-profiles-static-header.png": (0, 0, 1536, 64),
    "tutor-profiles-static-back.png": (51, 90, 108, 143),
    "tutor-profiles-static-filter.png": (141, 87, 556, 969),
    "tutor-profiles-static-intro.png": (577, 87, 1486, 325),
    "tutor-profiles-static-result.png": (577, 338, 1486, 969),
    "tutor-profiles-static-result-eyebrow.png": (604, 365, 722, 410),
    "tutor-profiles-static-result-title.png": (604, 430, 932, 474),
    "tutor-profiles-static-listing-meta.png": (629, 531, 735, 577),
    "tutor-profiles-static-privacy.png": (1252, 540, 1424, 591),
    "tutor-profiles-static-detail.png": (1252, 608, 1424, 665),
}

TUTOR_PROFILES_RESULTS_CROP = (577, 338, 1486, 969)

TUTOR_PROFILES_CONTENT_RECTS = (
    (0, 0, 1536, 64),
    (51, 90, 108, 143),
    (141, 87, 556, 969),
    (577, 87, 1486, 325),
    (577, 338, 1486, 969),
)

PARENT_NEEDS_STATIC_CROPS = {
    "parent-needs-static-header.png": (0, 0, 1536, 64),
    "parent-needs-static-back.png": (51, 90, 108, 143),
    "parent-needs-static-filter.png": (141, 87, 556, 969),
    "parent-needs-static-intro.png": (577, 87, 1486, 325),
    "parent-needs-static-result.png": (577, 338, 1486, 969),
}

PARENT_NEEDS_RESULTS_CROP = (577, 338, 1486, 969)

PARENT_NEEDS_CONTENT_RECTS = (
    (0, 0, 1536, 64),
    (51, 90, 108, 143),
    (141, 87, 556, 969),
    (577, 87, 1486, 325),
    (577, 338, 1486, 969),
)

HOME_STATIC_CROPS = {
    "home-static-entry-parent.png": (84, 415, 535, 642),
    "home-static-entry-tutor.png": (537, 415, 1007, 642),
    "home-static-hero.png": (50, 122, 1028, 412),
    "home-static-link-demand.png": (84, 652, 535, 791),
    "home-static-link-feedback.png": (84, 793, 535, 934),
    "home-static-link-service.png": (537, 793, 1007, 934),
    "home-static-link-tutors.png": (537, 652, 1007, 791),
    "home-static-principles.png": (1075, 137, 1548, 933),
}

DARK_INK_ASSETS = {
    "home-decor-left.png",
    "home-decor-right.png",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--home-reference", required=True)
    parser.add_argument("--login-reference")
    parser.add_argument("--rules-reference")
    parser.add_argument("--customer-service-reference")
    parser.add_argument("--tutor-profiles-reference")
    parser.add_argument("--parent-needs-reference")
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args()


def solve_linear(matrix: list[list[float]], vector: list[float]) -> list[float]:
    size = len(vector)
    augmented = [
        [*matrix[row], vector[row]]
        for row in range(size)
    ]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        if abs(divisor) < 1e-9:
            continue
        augmented[column] = [value / divisor for value in augmented[column]]
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [
                augmented[row][index] - factor * augmented[column][index]
                for index in range(size + 1)
            ]
    return [augmented[row][-1] for row in range(size)]


def features(x: int, y: int, width: int, height: int) -> tuple[float, ...]:
    normalized_x = (x / max(width - 1, 1)) * 2 - 1
    normalized_y = (y / max(height - 1, 1)) * 2 - 1
    return (
        1,
        normalized_x,
        normalized_y,
        normalized_x * normalized_y,
        normalized_x * normalized_x,
        normalized_y * normalized_y,
    )


def fit_background(
    samples: list[tuple[tuple[float, ...], tuple[int, int, int]]]
) -> list[list[float]]:
    coefficients = []
    for channel in range(3):
        matrix = [[0.0] * 6 for _ in range(6)]
        vector = [0.0] * 6
        for sample_features, color in samples:
            for row in range(6):
                vector[row] += sample_features[row] * color[channel]
                for column in range(6):
                    matrix[row][column] += (
                        sample_features[row] * sample_features[column]
                    )
        coefficients.append(solve_linear(matrix, vector))
    return coefficients


def predict_background(
    coefficients: list[list[float]], sample_features: tuple[float, ...]
) -> tuple[int, int, int]:
    return tuple(
        round(sum(weight * value for weight, value in zip(channel, sample_features)))
        for channel in coefficients
    )


def transparent_edge_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    samples = []
    for y in range(0, height, 3):
        for x in range(0, width, 3):
            color = pixels[x, y][:3]
            if min(color) >= 145:
                samples.append((features(x, y, width, height), color))

    coefficients = fit_background(samples)
    for _ in range(2):
        filtered = []
        for sample_features, color in samples:
            predicted = predict_background(coefficients, sample_features)
            if max(abs(color[index] - predicted[index]) for index in range(3)) < 34:
                filtered.append((sample_features, color))
        samples = filtered
        coefficients = fit_background(samples)

    for y in range(height):
        for x in range(width):
            color = pixels[x, y][:3]
            predicted = predict_background(
                coefficients, features(x, y, width, height)
            )
            residual = max(
                abs(color[index] - predicted[index]) for index in range(3)
            )
            alpha = max(0, min(255, round((residual - 8) * 255 / 22)))
            pixels[x, y] = (*color, alpha)

    return rgba


def transparent_dark_ink(image: Image.Image, filename: str) -> Image.Image:
    """Keep the approved dark decoration strokes while removing the page gradient."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            red, green, blue, _ = pixels[x, y]
            lightness = (red + green + blue) / 3
            chroma = max(red, green, blue) - min(red, green, blue)
            ink_score = (190 - lightness) * 1.8 + (95 - chroma) * 0.72
            alpha = max(0, min(255, round((ink_score - 10) * 4.2)))
            if (
                filename == "home-decor-right.png"
                and x < 85
                and y > 60
            ):
                alpha = 0
            if (
                filename == "home-decor-left.png"
                and x > 58
                and 72 < y < 168
            ):
                alpha = 0
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def content_free_background(
    source: Image.Image,
    content_rects: tuple[tuple[int, int, int, int], ...],
) -> Image.Image:
    """Rebuild a content-free canvas while preserving every exposed source pixel."""
    background = source.convert("RGB")
    width, height = background.size
    pixels = background.load()
    expanded_rects = tuple(
        (
            max(0, left - 4),
            max(0, top - 4),
            min(width, right + 4),
            min(height, bottom + 4),
        )
        for left, top, right, bottom in content_rects
    )

    def is_content_pixel(x: int, y: int) -> bool:
        return any(
            left <= x < right and top <= y < bottom
            for left, top, right, bottom in expanded_rects
        )

    samples = []
    for y in range(0, height, 6):
        for x in range(0, width, 6):
            if not is_content_pixel(x, y):
                samples.append((features(x, y, width, height), pixels[x, y]))

    coefficients = fit_background(samples)
    for y in range(height):
        for x in range(width):
            if is_content_pixel(x, y):
                pixels[x, y] = predict_background(
                    coefficients,
                    features(x, y, width, height),
                )
    return background


def customer_service_background(source: Image.Image) -> Image.Image:
    return content_free_background(source, CUSTOMER_SERVICE_CONTENT_RECTS)


def customer_service_chat_frame(source: Image.Image) -> Image.Image:
    """Extract the exact chat chrome while reserving live-control visual layers."""
    frame = source.crop(CUSTOMER_SERVICE_CHAT_CROP).convert("RGBA")
    frame_left, frame_top, _, _ = CUSTOMER_SERVICE_CHAT_CROP
    draw = ImageDraw.Draw(frame)
    for left, top, right, bottom in CUSTOMER_SERVICE_CHAT_LAYERS.values():
        draw.rectangle(
            (
                left - frame_left,
                top - frame_top,
                right - frame_left - 1,
                bottom - frame_top - 1,
            ),
            fill=(0, 0, 0, 0),
        )
    return frame


def tutor_profiles_results_frame(source: Image.Image) -> Image.Image:
    frame = source.crop(TUTOR_PROFILES_RESULTS_CROP).convert("RGBA")
    draw = ImageDraw.Draw(frame)
    draw.rectangle((8, 8, frame.width - 10, frame.height - 10), fill=(0, 0, 0, 0))
    return frame


def parent_needs_results_frame(source: Image.Image) -> Image.Image:
    frame = source.crop(PARENT_NEEDS_RESULTS_CROP).convert("RGBA")
    draw = ImageDraw.Draw(frame)
    draw.rectangle((8, 8, frame.width - 10, frame.height - 10), fill=(0, 0, 0, 0))
    return frame


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(args.home_reference) as source:
        for filename, crop_box in HOME_CROPS.items():
            crop = source.crop(crop_box)
            if filename in DARK_INK_ASSETS:
                transparent_dark_ink(crop, filename).save(output_dir / filename)
            else:
                transparent_edge_background(crop).save(output_dir / filename)
        for filename, crop_box in HOME_STATIC_CROPS.items():
            source.crop(crop_box).save(output_dir / filename)

    if args.login_reference:
        with Image.open(args.login_reference) as source:
            for filename, crop_box in LOGIN_CROPS.items():
                crop = source.crop(crop_box)
                transparent_edge_background(crop).save(output_dir / filename)
            for filename, crop_box in LOGIN_STATIC_CROPS.items():
                source.crop(crop_box).save(output_dir / filename)

    if args.rules_reference:
        with Image.open(args.rules_reference) as source:
            for filename, crop_box in RULES_CROPS.items():
                transparent_edge_background(source.crop(crop_box)).save(
                    output_dir / filename
                )
            for filename, crop_box in RULES_STATIC_CROPS.items():
                source.crop(crop_box).save(output_dir / filename)

    if args.customer_service_reference:
        with Image.open(args.customer_service_reference) as source:
            customer_service_background(source).save(
                output_dir / "customer-service-background.png"
            )
            customer_service_chat_frame(source).save(
                output_dir / "customer-service-static-chat-frame.png"
            )
            for filename, crop_box in CUSTOMER_SERVICE_STATIC_CROPS.items():
                source.crop(crop_box).save(output_dir / filename)
            for filename, crop_box in CUSTOMER_SERVICE_CHAT_LAYERS.items():
                source.crop(crop_box).save(output_dir / filename)

    if args.tutor_profiles_reference:
        with Image.open(args.tutor_profiles_reference) as source:
            content_free_background(source, TUTOR_PROFILES_CONTENT_RECTS).save(
                output_dir / "tutor-profiles-background.png"
            )
            tutor_profiles_results_frame(source).save(
                output_dir / "tutor-profiles-static-results-frame.png"
            )
            for filename, crop_box in TUTOR_PROFILES_STATIC_CROPS.items():
                source.crop(crop_box).save(output_dir / filename)

    if args.parent_needs_reference:
        with Image.open(args.parent_needs_reference) as source:
            content_free_background(source, PARENT_NEEDS_CONTENT_RECTS).save(
                output_dir / "parent-needs-background.png"
            )
            parent_needs_results_frame(source).save(
                output_dir / "parent-needs-static-results-frame.png"
            )
            for filename, crop_box in PARENT_NEEDS_STATIC_CROPS.items():
                source.crop(crop_box).save(output_dir / filename)


if __name__ == "__main__":
    main()
