from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(r"D:/codex_project/家教对接website/UI美术文档/多风格重设计方案")
OUT = ROOT / "预览图"
OUT.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = r"C:/Windows/Fonts/Noto Sans SC (TrueType).otf"
FONT_MEDIUM = r"C:/Windows/Fonts/Noto Sans SC Medium (TrueType).otf"
FONT_BOLD = r"C:/Windows/Fonts/Noto Sans SC Bold (TrueType).otf"
FALLBACK = r"C:/Windows/Fonts/msyh.ttc"


def font(size, role="regular"):
    path = {"regular": FONT_REGULAR, "medium": FONT_MEDIUM, "bold": FONT_BOLD}.get(role, FONT_REGULAR)
    if not Path(path).exists():
        path = FALLBACK
    return ImageFont.truetype(path, size=size, index=0) if Path(path).exists() else ImageFont.load_default()


def rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def blend(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def gradient(size, start, end):
    start, end = rgb(start), rgb(end)
    img = Image.new("RGBA", size)
    px = img.load()
    w, h = size
    for y in range(h):
        for x in range(w):
            px[x, y] = blend(start, end, min(1, x / w * .55 + y / h * .42)) + (255,)
    return img


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow(img, box, radius, color, blur=28, offset=(0, 16)):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    moved = (box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1])
    rr(d, moved, radius, color)
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def glow_blob(img, box, color, blur=34):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(box, fill=color)
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def luminous_circle(draw, box, base, light=(255, 255, 255), alpha=90):
    draw.ellipse(box, fill=base)
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    draw.ellipse((x1 + w * .12, y1 + h * .08, x1 + w * .62, y1 + h * .48), fill=light + (alpha,))


def luminous_panel(draw, box, radius, base, outline=None, width=1):
    rr(draw, box, radius, base, outline, width)
    x1, y1, x2, y2 = box
    rr(draw, (x1 + 10, y1 + 8, x2 - 18, y1 + (y2 - y1) * .42), radius - 4, (255, 255, 255, 14))


def material_panel(img, draw, box, style, key, radius=34):
    x1, y1, x2, y2 = box
    if key == "e":
        rr(draw, (x1 + 10, y1 + 10, x2 + 10, y2 + 10), radius, style["shadow"])
        rr(draw, box, radius, rgb("#fff7cf"), style["line"], 4)
        draw.polygon([(x1 + 24, y1 + 24), (x2 - 24, y1 + 24), (x2 - 74, y2 - 26), (x1 + 24, y2 - 26)], fill=rgb("#fff2a8"), outline=None)
        return
    if key == "d":
        rr(draw, (x1 + 10, y1 + 10, x2 + 10, y2 + 10), radius, style["shadow"])
        rr(draw, box, radius, rgb("#fff7cf"), style["line"], 4)
        draw.polygon([(x1 + 24, y1 + 24), (x2 - 24, y1 + 24), (x2 - 74, y2 - 26), (x1 + 24, y2 - 26)], fill=rgb("#fff2a8"), outline=None)
        draw.line((x1 + 42, y2 - 58, x2 - 52, y1 + 52), fill=style["line"], width=4)
        return
    shadow(img, box, radius, style["shadow"], 18, (0, 12))
    base = rgb(style["soft"]) + (218,)
    rr(draw, box, radius, base)
    draw.polygon([(x1 + 18, y1 + 18), (x2 - 18, y1 + 18), (x2 - 108, y2 - 22), (x1 + 18, y2 - 22)], fill=(255, 255, 255, 56))
    draw.arc((x1 + 38, y1 + 30, x2 - 38, y2 - 34), 202, 338, fill=rgb(style["accent"]) + (74,), width=9)
    draw.arc((x1 + 54, y1 + 48, x2 - 54, y2 - 52), 24, 162, fill=(255, 255, 255, 92), width=5)


def text(draw, xy, value, size, color, role="regular", anchor=None):
    draw.text(xy, value, font=font(size, role), fill=color, anchor=anchor)


def paragraph(draw, xy, value, width, size, color):
    x, y = xy
    line = ""
    for ch in value:
        test = line + ch
        if draw.textlength(test, font=font(size)) <= width or not line:
            line = test
        else:
            text(draw, (x, y), line, size, color)
            y += size + 10
            line = ch
    if line:
        text(draw, (x, y), line, size, color)


STYLES = {
    "a": dict(
        name="绿色玻璃拟态", bg=("#e5f3e7", "#fbfff7"), ink="#17352e", body="#4a655d", weak="#78918a",
        accent="#40c883", soft="#e8f8d6", deep="#0f6f49", card=(255, 255, 255, 224),
        panel=(255, 255, 255, 190), line=None, shadow=(25, 96, 67, 38), radius=34,
    ),
    "b": dict(
        name="青蓝玻璃卡片", bg=("#c5e4e8", "#f8feff"), ink="#09263d", body="#31576b", weak="#6d8997",
        accent="#08b9c9", soft="#e1faff", deep="#08385a", card=(255, 255, 255, 238),
        panel=(246, 254, 255, 235), line=None, shadow=(0, 70, 112, 46), radius=26,
    ),
    "c": dict(
        name="蓝紫渐变轻拟态", bg=("#eef3ff", "#f8efff"), ink="#1f2856", body="#596386", weak="#848bad",
        accent="#6677ff", soft="#efebff", deep="#5d47df", card=(252, 252, 255, 255),
        panel=(247, 248, 255, 255), line=None, shadow=(100, 106, 166, 48), radius=32,
    ),
    "d": dict(
        name="高对比插画潮玩", bg=("#fff05c", "#7cecff"), ink="#111111", body="#2d2d2d", weak="#5e5e5e",
        accent="#ff6724", soft="#b9ff45", deep="#111111", card=(255, 255, 246, 255),
        panel=(255, 253, 238, 255), line="#111111", shadow=(17, 17, 17, 210), radius=26,
    ),
    "e": dict(
        name="高对比插画潮玩优化版", bg=("#ffe75a", "#62e6df"), ink="#111111", body="#303030", weak="#5c5c5c",
        accent="#ff6b2b", soft="#b8ff42", deep="#111111", card=(255, 255, 244, 255),
        panel=(255, 253, 236, 255), line="#111111", shadow=(17, 17, 17, 190), radius=28,
    ),
}


def card(img, draw, box, style, fill=None, radius=None, strong=False):
    fill = fill or style["card"]
    radius = radius or style["radius"]
    if style["line"]:
        rr(draw, (box[0] + 8, box[1] + 8, box[2] + 8, box[3] + 8), radius, style["shadow"])
        rr(draw, box, radius, fill, style["line"], 4 if strong else 3)
    else:
        shadow(img, box, radius, style["shadow"], 30, (0, 18))
        rr(draw, box, radius, fill)


def pill(draw, box, value, style, active=False):
    fill = rgb(style["accent"]) if active else style["soft"]
    color = "#ffffff" if active and style["line"] is None else style["deep"]
    rr(draw, box, (box[3] - box[1]) // 2, fill, style["line"], 3 if style["line"] else 0)
    text(draw, (box[0] + 18, box[1] + 9), value, 16, color, "medium")


def draw_art(img, draw, box, style, key):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    if key == "e":
        material_panel(img, draw, box, style, "e", 32)
        rr(draw, (x1 + 38, y1 + 44, x1 + 214, y1 + 222), 34, rgb("#b8ff42"), style["line"], 4)
        rr(draw, (x2 - 198, y1 + 36, x2 - 38, y1 + 216), 34, rgb("#ff6b2b"), style["line"], 4)
        draw.ellipse((x1 + 88, y1 + 76, x1 + 144, y1 + 132), fill=rgb("#fffdf4"), outline=style["line"], width=4)
        draw.rectangle((x1 + 80, y1 + 142, x1 + 154, y1 + 190), fill=rgb("#ff6b2b"), outline=style["line"], width=4)
        draw.ellipse((x2 - 152, y1 + 70, x2 - 92, y1 + 130), fill=rgb("#fffdf4"), outline=style["line"], width=4)
        draw.rectangle((x2 - 164, y1 + 142, x2 - 80, y1 + 192), fill=rgb("#b8ff42"), outline=style["line"], width=4)
        rr(draw, (x1 + 186, y1 + 54, x1 + 356, y1 + 112), 22, rgb("#fffdf4"), style["line"], 4)
        text(draw, (x1 + 214, y1 + 70), "周末数学？", 22, style["ink"], "bold")
        rr(draw, (x1 + 204, y1 + 138, x1 + 360, y1 + 194), 22, rgb("#111111"), style["line"], 0)
        text(draw, (x1 + 228, y1 + 153), "先站内聊", 22, "#fffdf4", "bold")
        rr(draw, (x1 + 86, y1 + 228, x1 + 254, y1 + 272), 20, rgb("#fffdf4"), style["line"], 4)
        text(draw, (x1 + 110, y1 + 239), "家长需求", 20, style["ink"], "bold")
        rr(draw, (x2 - 260, y1 + 228, x2 - 74, y1 + 272), 20, rgb("#fffdf4"), style["line"], 4)
        text(draw, (x2 - 234, y1 + 239), "大学生家教", 20, style["ink"], "bold")
        rr(draw, (x1 + 252, y1 + 226, x2 - 118, y1 + 274), 18, rgb("#ffe75a"), style["line"], 4)
        text(draw, (x1 + 276, y1 + 239), "同意后交换", 20, style["ink"], "bold")
        return
    if key == "d":
        material_panel(img, draw, box, style, key, 32)
        rr(draw, (x1 + 34, y1 + 42, x1 + 228, y1 + 236), 34, rgb(style["soft"]), style["line"], 4)
        rr(draw, (x2 - 244, y1 + 34, x2 - 34, y1 + 196), 34, rgb(style["accent"]), style["line"], 4)
        draw.arc((x1 + 208, y1 + 70, x2 - 190, y1 + 210), 210, 330, fill=style["line"], width=6)
        draw.polygon([(x2 - 192, y1 + 168), (x2 - 166, y1 + 160), (x2 - 184, y1 + 144)], fill=style["line"])
        draw.ellipse((x1 + 82, y1 + 78, x1 + 138, y1 + 134), fill=rgb("#ffffff"), outline=style["line"], width=4)
        draw.rectangle((x1 + 74, y1 + 142, x1 + 154, y1 + 202), fill=rgb(style["accent"]), outline=style["line"], width=4)
        draw.ellipse((x2 - 174, y1 + 70, x2 - 112, y1 + 132), fill=rgb("#ffffff"), outline=style["line"], width=4)
        draw.rectangle((x2 - 182, y1 + 140, x2 - 102, y1 + 190), fill=rgb(style["soft"]), outline=style["line"], width=4)
        text(draw, (x1 + 52, y1 + 252), "先聊清楚", 28, style["ink"], "bold")
        text(draw, (x2 - 210, y1 + 232), "再交换联系方式", 25, style["ink"], "bold")
        return
    material_panel(img, draw, box, style, key, 34)
    if key == "a":
        draw.line((x1 + 122, y1 + 158, x1 + 258, y1 + 92, x2 - 126, y1 + 158), fill=rgb(style["accent"]) + (72,), width=16, joint="curve")
        draw.line((x1 + 122, y1 + 158, x1 + 258, y1 + 92, x2 - 126, y1 + 158), fill=rgb("#ffffff") + (82,), width=4)
        luminous_circle(draw, (x1 + 60, y1 + 86, x1 + 184, y1 + 210), (255, 255, 255, 210), alpha=24)
        luminous_circle(draw, (x2 - 190, y1 + 86, x2 - 66, y1 + 210), rgb(style["accent"]) + (155,), alpha=22)
        luminous_panel(draw, (x1 + 88, y1 + 210, x1 + 224, y1 + 260), 22, (255, 255, 255, 200))
        luminous_panel(draw, (x2 - 230, y1 + 210, x2 - 84, y1 + 260), 22, rgb("#e8f8d6") + (210,))
        text(draw, (x1 + 116, y1 + 228), "家长需求", 19, style["deep"], "bold")
        text(draw, (x2 - 206, y1 + 228), "家教资料", 19, style["deep"], "bold")
        luminous_panel(draw, (x1 + 170, y1 + 42, x2 - 170, y1 + 82), 20, (255, 255, 255, 210))
        text(draw, (x1 + 206, y1 + 52), "被理解的连接", 19, style["deep"], "bold")
    elif key == "b":
        luminous_panel(draw, (x1 + 42, y1 + 48, x1 + 210, y1 + 246), 28, rgb("#0b3855") + (210,))
        luminous_panel(draw, (x1 + 240, y1 + 48, x2 - 42, y1 + 128), 26, (255, 255, 255, 220))
        luminous_panel(draw, (x1 + 240, y1 + 150, x2 - 42, y1 + 246), 26, rgb(style["accent"]) + (154,))
        text(draw, (x1 + 72, y1 + 86), "筛选", 31, "#d8ffff", "bold")
        text(draw, (x1 + 72, y1 + 132), "沟通", 31, "#d8ffff", "bold")
        text(draw, (x1 + 268, y1 + 76), "初中英语 / 周末", 20, style["deep"], "bold")
        text(draw, (x1 + 268, y1 + 178), "联系方式未公开", 20, "#063040", "bold")
        for i in range(4):
            draw.rounded_rectangle((x1 + 268 + i * 46, y1 + 106, x1 + 298 + i * 46, y1 + 114), radius=4, fill=rgb(style["accent"]) + (180,))
    elif key == "c":
        luminous_circle(draw, (x1 + 52, y1 + 54, x1 + 230, y1 + 232), (255, 255, 255, 184), alpha=24)
        luminous_circle(draw, (x2 - 250, y1 + 34, x2 - 42, y1 + 242), rgb("#8c6cff") + (126,), alpha=20)
        luminous_circle(draw, (x1 + 214, y1 + 86, x1 + 344, y1 + 216), rgb(style["accent"]) + (142,), alpha=20)
        luminous_panel(draw, (x1 + 128, y1 + 214, x2 - 128, y1 + 268), 25, (255, 255, 255, 225))
        text(draw, (x1 + 166, y1 + 230), "需求与老师正在靠近", 21, style["deep"], "bold")
        draw.arc((x1 + 146, y1 + 88, x2 - 138, y1 + 222), 190, 350, fill=rgb("#ffffff") + (190,), width=7)
        draw.arc((x1 + 154, y1 + 94, x2 - 146, y1 + 232), 20, 170, fill=rgb(style["accent"]) + (125,), width=10)


def desktop(key, filename):
    st = STYLES[key]
    img = gradient((1440, 980), *st["bg"])
    d = ImageDraw.Draw(img)

    shell = (64, 58, 1376, 922)
    card(img, d, shell, st, st["panel"], 38, key in ("d", "e"))

    text(d, (112, 104), "家教对接", 25, st["ink"], "bold")
    for i, item in enumerate(["找老师", "做家教", "规则", "反馈"]):
        text(d, (760 + i * 92, 110), item, 16, st["weak"], "medium")
    pill(d, (1204, 92, 1324, 132), "发布需求", st, True)

    pill(d, (112, 176, 314, 216), "双方同意后交换联系方式", st)
    if key == "e":
        text(d, (112, 264), "找家教这件事，", 40, st["ink"], "bold")
        text(d, (112, 316), "要清楚也要安心。", 40, st["ink"], "bold")
    else:
        text(d, (112, 264), "先找到合适的人，", 40, st["ink"], "bold")
        text(d, (112, 316), "再放心联系。", 40, st["ink"], "bold")
    paragraph(d, (114, 392), "家长发布需求，大学生展示家教资料。双方先通过站内沟通确认科目、时间和预算，公开页面不展示联系方式。", 520, 19, st["body"])

    draw_art(img, d, (790, 176, 1308, 480), st, key)

    modules = [
        ("发布需求", "填写科目、学段、区域和期望时间", "家长 / 学生"),
        ("浏览广场", "按科目、区域、上课方式快速筛选", "需求与家教"),
        ("站内沟通", "确认意向后，双方同意再交换联系方式", "聊天状态"),
    ]
    for i, (title, desc, tag) in enumerate(modules):
        x = 112 + i * 412
        y = 600
        card(img, d, (x, y, x + 340, y + 196), st, st["card"], 30, False)
        pill(d, (x + 28, y + 26, x + 132, y + 62), tag, st)
        text(d, (x + 28, y + 88), title, 27, st["ink"], "bold")
        paragraph(d, (x + 30, y + 132), desc, 260, 17, st["body"])

    # Quiet preview row, not a dense table.
    card(img, d, (112, 826, 1308, 884), st, st["soft"], 24)
    text(d, (146, 845), "页面覆盖：首页 / 登录注册 / 需求广场 / 家教广场 / 详情 / 发布 / 个人中心 / 聊天 / 规则反馈", 17, st["deep"], "medium")
    img.convert("RGB").save(OUT / filename, quality=95)


def mobile(key, filename):
    st = STYLES[key]
    img = gradient((390, 844), *st["bg"])
    d = ImageDraw.Draw(img)
    shell = (18, 18, 372, 826)
    card(img, d, shell, st, st["panel"], 30, key in ("d", "e"))
    text(d, (42, 52), "家教对接", 20, st["ink"], "bold")
    pill(d, (278, 42, 344, 76), "发布", st, True)

    pill(d, (42, 116, 242, 152), "先沟通，再交换联系方式", st)
    if key == "e":
        text(d, (42, 192), "先聊清楚", 33, st["ink"], "bold")
        text(d, (42, 234), "再放心联系", 33, st["ink"], "bold")
    else:
        text(d, (42, 192), "找老师", 33, st["ink"], "bold")
        text(d, (42, 234), "做家教", 33, st["ink"], "bold")
    paragraph(d, (44, 296), "发布、筛选、站内聊天。联系方式不会出现在公开页面。", 294, 15, st["body"])

    card(img, d, (42, 390, 348, 512), st, st["card"], 26)
    if key == "e":
        rr(d, (68, 416, 142, 488), 24, rgb("#b8ff42"), st["line"], 3)
        rr(d, (156, 416, 230, 488), 24, rgb("#ff6b2b"), st["line"], 3)
        rr(d, (244, 428, 318, 476), 18, rgb("#fffdf4"), st["line"], 3)
        text(d, (82, 438), "需求", 18, st["ink"], "bold")
        text(d, (170, 438), "家教", 18, st["ink"], "bold")
        text(d, (256, 440), "沟通", 17, st["ink"], "bold")
    else:
        text(d, (68, 420), "今日入口", 21, st["ink"], "bold")
        pill(d, (68, 460, 150, 496), "需求", st, True)
        pill(d, (166, 460, 248, 496), "家教", st)

    card(img, d, (42, 544, 348, 648), st, st["card"], 26)
    text(d, (68, 572), "初二数学基础巩固", 20, st["ink"], "bold")
    text(d, (68, 608), "海淀 · 周末 · 先站内沟通", 15, st["weak"], "medium")

    card(img, d, (42, 680, 348, 776), st, st["soft"], 26)
    text(d, (68, 708), "聊天状态", 20, st["ink"], "bold")
    text(d, (68, 742), "联系方式未公开，双方同意后交换", 15, st["deep"], "medium")
    img.convert("RGB").save(OUT / filename, quality=95)


FILES = [
    ("a", "2026-07-03-style-a-green-glass-desktop.png", desktop),
    ("a", "2026-07-03-style-a-green-glass-mobile.png", mobile),
    ("b", "2026-07-03-style-b-cyan-coach-desktop.png", desktop),
    ("b", "2026-07-03-style-b-cyan-coach-mobile.png", mobile),
    ("c", "2026-07-03-style-c-blue-purple-neumorphism-desktop.png", desktop),
    ("c", "2026-07-03-style-c-blue-purple-neumorphism-mobile.png", mobile),
    ("d", "2026-07-03-style-d-bold-illustration-desktop.png", desktop),
    ("d", "2026-07-03-style-d-bold-illustration-mobile.png", mobile),
    ("e", "2026-07-03-style-d-plus-bold-illustration-desktop.png", desktop),
    ("e", "2026-07-03-style-d-plus-bold-illustration-mobile.png", mobile),
]

for style_key, file_name, painter in FILES:
    painter(style_key, file_name)
    print(OUT / file_name)


