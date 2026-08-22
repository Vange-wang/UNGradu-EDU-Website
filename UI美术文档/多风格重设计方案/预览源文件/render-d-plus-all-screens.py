from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "预览图" / "D+全界面"
OUT.mkdir(parents=True, exist_ok=True)

FONT_DIRS = [
    Path("C:/Windows/Fonts"),
    Path("C:/Users/86166/AppData/Local/Microsoft/Windows/Fonts"),
]


def find_font(names):
    for folder in FONT_DIRS:
        for name in names:
            p = folder / name
            if p.exists():
                return str(p)
    return None


FONT_REG = find_font(["NotoSansSC-Regular.ttf", "SourceHanSansSC-Regular.otf", "msyh.ttc"])
FONT_MED = find_font(["NotoSansSC-Medium.ttf", "SourceHanSansSC-Medium.otf", "msyhbd.ttc", "msyh.ttc"])
FONT_BOLD = find_font(["NotoSansSC-Bold.ttf", "SourceHanSansSC-Bold.otf", "msyhbd.ttc"])


def font(size, role="regular"):
    src = FONT_BOLD if role == "bold" else FONT_MED if role == "medium" else FONT_REG
    return ImageFont.truetype(src, size) if src else ImageFont.load_default()


INK = "#111111"
BODY = "#303030"
WEAK = "#69645b"
PAPER = "#fffdf0"
YELLOW = "#ffe75a"
LIME = "#b8ff42"
ORANGE = "#ff6b2b"
MINT = "#68e6d8"
CREAM = "#fff7cf"


def rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))


def gradient(size):
    w, h = size
    img = Image.new("RGB", size, rgb(YELLOW))
    pix = img.load()
    a, b = rgb(YELLOW), rgb(MINT)
    for y in range(h):
        for x in range(w):
            t = (x + y * .35) / (w + h * .35)
            pix[x, y] = tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))
    return img.convert("RGBA")


def rr(d, box, radius, fill, outline=INK, width=3):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(d, xy, value, size, fill=INK, role="regular", anchor=None):
    d.text(xy, value, font=font(size, role), fill=fill, anchor=anchor)


def para(d, xy, value, width, size=17, fill=BODY, lh=None):
    x, y = xy
    lh = lh or size + 9
    line = ""
    f = font(size)
    for ch in value:
        test = line + ch
        if d.textlength(test, font=f) <= width or not line:
            line = test
        else:
            d.text((x, y), line, font=f, fill=fill)
            y += lh
            line = ch
    if line:
        d.text((x, y), line, font=f, fill=fill)
    return y + lh


def shadow_card(d, box, radius=28, fill=PAPER, shadow=INK, width=3):
    x1, y1, x2, y2 = box
    rr(d, (x1 + 8, y1 + 8, x2 + 8, y2 + 8), radius, shadow, shadow, width)
    rr(d, box, radius, fill, INK, width)


def pill(d, box, value, fill=LIME, size=16, role="medium"):
    rr(d, box, (box[3] - box[1]) // 2, fill, INK, 3)
    text(d, (box[0] + 18, box[1] + 8), value, size, INK, role)


def btn(d, box, value, fill=ORANGE, size=17):
    pill(d, box, value, fill, size, "bold")


def checkbox(d, x, y, checked=False):
    rr(d, (x, y, x + 24, y + 24), 8, LIME if checked else PAPER, INK, 3)
    if checked:
        d.line((x + 6, y + 13, x + 11, y + 18, x + 19, y + 7), fill=INK, width=3)


def input_box(d, box, label, value="", multiline=False):
    text(d, (box[0], box[1] - 28), label, 17, INK, "bold")
    rr(d, box, 18, "#fffdf7", INK, 3)
    if value:
        para(d, (box[0] + 20, box[1] + 16), value, box[2] - box[0] - 40, 16, WEAK)
    if multiline:
        d.line((box[0] + 18, box[3] - 22, box[2] - 18, box[3] - 22), fill="#e8dfb8", width=2)


def icon_people(d, box):
    x1, y1, x2, y2 = box
    rr(d, (x1, y1, x1 + 152, y2), 32, LIME, INK, 4)
    rr(d, (x2 - 152, y1 + 10, x2, y2 - 4), 32, ORANGE, INK, 4)
    d.ellipse((x1 + 48, y1 + 32, x1 + 96, y1 + 80), fill=PAPER, outline=INK, width=4)
    d.rectangle((x1 + 42, y1 + 98, x1 + 102, y1 + 140), fill=ORANGE, outline=INK, width=4)
    d.ellipse((x2 - 104, y1 + 36, x2 - 56, y1 + 84), fill=PAPER, outline=INK, width=4)
    d.rectangle((x2 - 112, y1 + 102, x2 - 42, y1 + 144), fill=LIME, outline=INK, width=4)
    rr(d, (x1 + 148, y1 + 42, x2 - 118, y1 + 92), 20, PAPER, INK, 4)
    text(d, (x1 + 174, y1 + 55), "先站内聊", 20, INK, "bold")
    rr(d, (x1 + 174, y1 + 116, x2 - 136, y1 + 166), 20, INK, INK, 0)
    text(d, (x1 + 202, y1 + 129), "同意后交换", 19, PAPER, "bold")


def desktop_shell(title, active="首页"):
    img = gradient((1440, 980))
    d = ImageDraw.Draw(img)
    shadow_card(d, (64, 58, 1376, 922), 38, PAPER, INK, 3)
    text(d, (112, 104), "家教对接", 25, INK, "bold")
    nav = ["首页", "需求广场", "家教广场", "发布", "聊天", "规则反馈"]
    x = 612
    for item in nav:
        fill = ORANGE if item == active else WEAK
        text(d, (x, 112), item, 16, fill, "bold" if item == active else "medium")
        x += 96 if len(item) <= 2 else 124
    btn(d, (1202, 92, 1326, 132), "发布需求")
    text(d, (112, 174), title, 38, INK, "bold")
    return img, d


def save(img, name):
    img.convert("RGB").save(OUT / name, quality=95)
    print(OUT / name)


def list_card(d, box, title, meta, tag, color=LIME):
    shadow_card(d, box, 24, PAPER)
    pill(d, (box[0] + 24, box[1] + 22, box[0] + 118, box[1] + 56), tag, color, 15)
    text(d, (box[0] + 24, box[1] + 78), title, 24, INK, "bold")
    para(d, (box[0] + 24, box[1] + 116), meta, box[2] - box[0] - 48, 16, BODY)


def screen_home():
    img, d = desktop_shell("找家教这件事，\n要清楚也要安心。", "首页")
    para(d, (114, 286), "家长发布需求，大学生展示家教资料。公开页面不展示联系方式，双方先站内沟通，确认同意后再交换。", 530, 19)
    icon_people(d, (812, 214, 1268, 438))
    for i, (t, m, tag) in enumerate([
        ("发布需求", "填写科目、学段、区域和期望时间", "家长 / 学生"),
        ("浏览广场", "按科目、区域、上课方式快速筛选", "需求与家教"),
        ("站内沟通", "确认意向后，双方同意再交换联系方式", "聊天状态"),
    ]):
        list_card(d, (112 + i * 412, 600, 452 + i * 412, 796), t, m, tag, LIME)
    shadow_card(d, (112, 826, 1308, 884), 24, LIME)
    text(d, (146, 845), "页面覆盖：首页 / 登录注册 / 广场 / 详情 / 发布 / 个人中心 / 聊天 / 规则反馈", 17, INK, "medium")
    save(img, "d-plus-01-home-gateway-desktop.png")


def screen_auth():
    img, d = desktop_shell("登录 / 注册", "首页")
    para(d, (114, 226), "只保留进入平台所需的账号入口。这里不暗示实名认证、平台审核或第三方登录能力。", 470, 18)
    shadow_card(d, (732, 190, 1238, 760), 34, PAPER)
    pill(d, (776, 232, 892, 270), "登录", ORANGE)
    pill(d, (910, 232, 1036, 270), "注册", LIME)
    input_box(d, (776, 338, 1194, 392), "手机号或邮箱", "用于登录，不会公开展示")
    input_box(d, (776, 452, 1194, 506), "密码", "请输入密码")
    checkbox(d, 776, 548, True)
    text(d, (812, 548), "我已了解公开页面不展示联系方式", 16, BODY, "medium")
    btn(d, (776, 622, 1194, 676), "进入家教对接")
    save(img, "d-plus-02-auth-login-register-desktop.png")


def screen_square(kind):
    title = "需求广场" if kind == "need" else "家教信息广场"
    img, d = desktop_shell(title, "需求广场" if kind == "need" else "家教广场")
    shadow_card(d, (112, 228, 388, 806), 28, "#fff9d8")
    text(d, (144, 264), "筛选", 26, INK, "bold")
    for i, label in enumerate(["学段", "科目", "区域", "上课方式", "时间"]):
        pill(d, (144, 322 + i * 70, 282, 360 + i * 70), label, LIME if i % 2 == 0 else PAPER)
    btn(d, (144, 724, 330, 774), "应用筛选")
    items = [
        ("初二数学基础巩固", "海淀 · 周末 · 预算面议 · 先站内沟通", "需求"),
        ("小学英语口语陪练", "朝阳 · 工作日晚 · 线上或附近线下", "需求"),
        ("大学生可教数学英语", "中关村 · 周末可约 · 简历公开不含联系方式", "家教"),
    ] if kind == "need" else [
        ("北师大在读，可教初中数学", "海淀 · 周末 · 可线上 · 先站内沟通", "家教"),
        ("英语专业，擅长口语陪练", "朝阳 · 晚间 · 小学/初中", "家教"),
        ("理工科大学生，可教物理", "西城 · 周末 · 初高中基础提升", "家教"),
    ]
    for i, item in enumerate(items):
        list_card(d, (436, 228 + i * 188, 1010, 382 + i * 188), *item, ORANGE if item[2] == "家教" else LIME)
        btn(d, (1044, 272 + i * 188, 1244, 322 + i * 188), "站内沟通", ORANGE)
    save(img, f"d-plus-03-{'need-square' if kind == 'need' else 'tutor-square'}-desktop.png")


def screen_detail(kind):
    title = "需求详情" if kind == "need" else "家教详情"
    img, d = desktop_shell(title, "需求广场" if kind == "need" else "家教广场")
    main_title = "初二数学基础巩固" if kind == "need" else "北师大在读，可教初中数学"
    shadow_card(d, (112, 238, 826, 806), 32, PAPER)
    pill(d, (150, 278, 252, 316), "公开信息", LIME)
    text(d, (150, 348), main_title, 34, INK, "bold")
    para(d, (152, 414), "希望先通过站内沟通确认学习目标、可约时间和预算范围。公开详情页不会展示手机号、微信或其他直接联系方式。", 590, 19)
    for i, (k, v) in enumerate([("科目", "数学"), ("学段", "初二"), ("区域", "海淀"), ("时间", "周末下午")]):
        pill(d, (152 + (i % 2) * 220, 548 + (i // 2) * 74, 302 + (i % 2) * 220, 586 + (i // 2) * 74), f"{k}：{v}", ORANGE if i % 2 else LIME)
    shadow_card(d, (886, 238, 1268, 806), 32, "#fff9d8")
    text(d, (924, 286), "下一步", 30, INK, "bold")
    para(d, (926, 344), "先发起站内沟通。只有双方都同意后，联系方式才会交换。", 292, 18)
    btn(d, (926, 480, 1228, 536), "发起站内沟通")
    pill(d, (926, 578, 1188, 620), "联系方式当前未公开", LIME)
    save(img, f"d-plus-04-{'need-detail' if kind == 'need' else 'tutor-detail'}-desktop.png")


def screen_publish(kind):
    title = "发布需求" if kind == "need" else "发布家教信息"
    img, d = desktop_shell(title, "发布")
    fields = [("基本信息", "科目、学段、区域"), ("时间预算", "可约时间、预算范围"), ("补充说明", "学习目标、期待沟通方式")]
    if kind == "tutor":
        fields = [("个人介绍", "学校、年级、可教方向"), ("授课信息", "科目、方式、可约时间"), ("补充说明", "经验、自我介绍")]
    for i, (t, desc) in enumerate(fields):
        x = 112 + i * 412
        shadow_card(d, (x, 250, x + 340, 430), 28, PAPER)
        pill(d, (x + 26, 284, x + 128, 320), f"{i+1}", ORANGE if i == 0 else LIME)
        text(d, (x + 28, 346), t, 27, INK, "bold")
        para(d, (x + 30, 386), desc, 270, 16)
    input_box(d, (160, 546, 600, 602), "科目 / 方向", "例如：初中数学")
    input_box(d, (686, 546, 1126, 602), "区域 / 上课方式", "例如：海淀，可线上")
    input_box(d, (160, 702, 1126, 810), "说明", "请写清楚情况。联系方式不要写在公开说明里。", True)
    btn(d, (1150, 754, 1300, 810), "提交")
    save(img, f"d-plus-05-publish-{'need' if kind == 'need' else 'tutor'}-desktop.png")


def screen_center():
    img, d = desktop_shell("个人中心", "首页")
    icon_people(d, (112, 238, 500, 450))
    for i, item in enumerate([
        ("我的需求", "2 条进行中"),
        ("我的家教信息", "1 条展示中"),
        ("我的聊天", "3 个沟通中"),
        ("联系方式管理", "仅同意后交换"),
    ]):
        x = 560 + (i % 2) * 350
        y = 238 + (i // 2) * 184
        list_card(d, (x, y, x + 300, y + 140), item[0], item[1], "我的", LIME if i % 2 else ORANGE)
    shadow_card(d, (112, 548, 1268, 806), 30, PAPER)
    text(d, (152, 590), "最近动态", 28, INK, "bold")
    for i, row in enumerate(["需求收到新的站内沟通", "家教信息被家长收藏", "联系方式交换等待对方同意"]):
        text(d, (154, 648 + i * 50), row, 18, BODY, "medium")
        d.line((154, 682 + i * 50, 1228, 682 + i * 50), fill="#ded6ad", width=2)
    save(img, "d-plus-06-profile-center-desktop.png")


def screen_contact():
    img, d = desktop_shell("个人资料 / 联系方式", "首页")
    shadow_card(d, (112, 238, 650, 806), 32, PAPER)
    input_box(d, (160, 330, 590, 386), "昵称", "海淀家长")
    input_box(d, (160, 470, 590, 526), "身份", "家长 / 学生")
    input_box(d, (160, 610, 590, 666), "联系方式", "仅双方同意后交换")
    shadow_card(d, (734, 238, 1268, 806), 32, "#fff9d8")
    text(d, (776, 286), "展示规则", 30, INK, "bold")
    for i, row in enumerate(["公开页不展示手机号或微信", "聊天中可申请交换联系方式", "双方同意后才展示给对方"]):
        checkbox(d, 780, 358 + i * 72, True)
        text(d, (820, 356 + i * 72), row, 18, BODY, "medium")
    btn(d, (780, 646, 1040, 702), "保存资料")
    save(img, "d-plus-07-profile-contact-desktop.png")


def screen_mine():
    img, d = desktop_shell("我的需求 / 家教信息 / 聊天列表", "聊天")
    tabs = ["我的需求", "我的家教信息", "我的聊天"]
    for i, tab in enumerate(tabs):
        pill(d, (112 + i * 160, 230, 252 + i * 160, 270), tab, ORANGE if i == 0 else LIME)
    rows = [
        ("初二数学基础巩固", "需求 · 2 个站内沟通 · 未交换联系方式", "查看需求"),
        ("北师大在读，可教数学", "家教信息 · 展示中 · 公开页不含联系方式", "编辑资料"),
        ("与李同学的沟通", "聊天 · 待双方确认联系方式交换", "进入聊天"),
    ]
    for i, (a, b, c) in enumerate(rows):
        list_card(d, (112, 320 + i * 168, 1040, 452 + i * 168), a, b, "列表", LIME if i != 1 else ORANGE)
        btn(d, (1080, 360 + i * 168, 1266, 412 + i * 168), c, ORANGE)
    save(img, "d-plus-08-my-lists-desktop.png")


def screen_chat():
    img, d = desktop_shell("聊天详情", "聊天")
    shadow_card(d, (112, 226, 882, 812), 32, PAPER)
    text(d, (154, 270), "与北师大数学家教沟通", 27, INK, "bold")
    bubbles = [
        (154, 340, 540, 402, LIME, "您好，想了解周末是否方便试沟通。"),
        (394, 438, 824, 500, ORANGE, "可以，先确认学习内容和时间安排。"),
        (154, 536, 620, 598, LIME, "目前联系方式还未公开，我们先在站内聊。"),
    ]
    for box in bubbles:
        rr(d, box[:4], 22, box[4], INK, 3)
        text(d, (box[0] + 22, box[1] + 18), box[5], 17, INK, "medium")
    input_box(d, (154, 704, 718, 762), "发送消息", "输入站内消息")
    btn(d, (740, 704, 824, 762), "发送")
    shadow_card(d, (930, 226, 1268, 812), 32, "#fff9d8")
    text(d, (970, 280), "联系方式状态", 27, INK, "bold")
    pill(d, (970, 348, 1210, 390), "当前未公开", LIME)
    para(d, (972, 438), "双方都确认愿意继续沟通后，才交换联系方式。", 244, 18)
    btn(d, (970, 570, 1218, 626), "申请交换")
    save(img, "d-plus-09-chat-detail-desktop.png")


def screen_rules_feedback(kind):
    title = "规则页" if kind == "rules" else "反馈页"
    img, d = desktop_shell(title, "规则反馈")
    shadow_card(d, (112, 238, 1268, 806), 34, PAPER)
    if kind == "rules":
        text(d, (160, 294), "平台边界", 32, INK, "bold")
        rows = ["平台提供信息发布与站内沟通入口", "公开页面不展示联系方式", "不提供支付、担保、认证、人工仲裁或退款服务", "请先沟通清楚再决定是否交换联系方式"]
    else:
        text(d, (160, 294), "提交反馈", 32, INK, "bold")
        rows = ["反馈类型：页面问题 / 信息问题 / 使用建议", "请不要在反馈中提交敏感证件或支付信息", "平台会记录反馈内容用于后续产品改进"]
    for i, row in enumerate(rows):
        checkbox(d, 164, 368 + i * 66, True)
        text(d, (204, 366 + i * 66), row, 19, BODY, "medium")
    if kind == "feedback":
        input_box(d, (164, 650, 940, 744), "反馈内容", "请描述你遇到的问题或建议", True)
        btn(d, (972, 688, 1160, 744), "提交反馈")
    save(img, f"d-plus-10-{'rules' if kind == 'rules' else 'feedback'}-desktop.png")


def screen_mobile_overview():
    img = gradient((390, 844))
    d = ImageDraw.Draw(img)
    shadow_card(d, (18, 18, 372, 826), 30, PAPER)
    text(d, (42, 58), "家教对接", 21, INK, "bold")
    btn(d, (278, 42, 344, 76), "发布", 15)
    pill(d, (42, 118, 252, 154), "先沟通，再交换联系方式", LIME, 15)
    text(d, (42, 204), "先聊清楚", 34, INK, "bold")
    text(d, (42, 248), "再放心联系", 34, INK, "bold")
    para(d, (44, 310), "发布、筛选、站内聊天。联系方式不会出现在公开页面。", 292, 15)
    shadow_card(d, (42, 398, 348, 520), 26, PAPER)
    rr(d, (68, 424, 142, 496), 24, LIME, INK, 3)
    rr(d, (156, 424, 230, 496), 24, ORANGE, INK, 3)
    rr(d, (244, 436, 318, 484), 18, PAPER, INK, 3)
    text(d, (82, 446), "需求", 18, INK, "bold")
    text(d, (170, 446), "家教", 18, INK, "bold")
    text(d, (256, 448), "沟通", 17, INK, "bold")
    list_card(d, (42, 552, 348, 654), "初二数学基础巩固", "海淀 · 周末 · 先站内沟通", "广场", LIME)
    shadow_card(d, (42, 690, 348, 782), 26, LIME)
    text(d, (68, 720), "聊天状态", 20, INK, "bold")
    text(d, (68, 754), "联系方式未公开，双方同意后交换", 15, INK, "medium")
    save(img, "d-plus-11-mobile-core-flow.png")


def make_contact_sheet():
    files = sorted(OUT.glob("d-plus-*-desktop.png"))
    thumb_w, thumb_h = 360, 245
    cols = 3
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (thumb_w * cols, thumb_h * rows), "white")
    for i, p in enumerate(files):
        img = Image.open(p).convert("RGB")
        img.thumbnail((thumb_w, thumb_h))
        x = (i % cols) * thumb_w
        y = (i // cols) * thumb_h
        sheet.paste(img, (x, y))
    sheet.save(OUT / "d-plus-all-desktop-contact-sheet.png", quality=94)
    print(OUT / "d-plus-all-desktop-contact-sheet.png")


screen_home()
screen_auth()
screen_square("need")
screen_square("tutor")
screen_detail("need")
screen_detail("tutor")
screen_publish("need")
screen_publish("tutor")
screen_center()
screen_contact()
screen_mine()
screen_chat()
screen_rules_feedback("rules")
screen_rules_feedback("feedback")
screen_mobile_overview()
make_contact_sheet()
