---
version: alpha
name: 页面或设计系统名称
description: 一段高密度描述，说明这个页面或视觉系统的整体气质、主要颜色、排版节奏、卡片/边框/阴影风格，以及它要服务的业务目标。
colors:
  primary: "#待填写"
  ink: "#待填写"
  body: "#待填写"
  muted: "#待填写"
  canvas: "#待填写"
  surface-card: "#待填写"
  hairline: "#待填写"
  on-primary: "#待填写"
typography:
  display-lg:
    fontFamily: "待填写"
    fontSize: 待填写
    fontWeight: 待填写
    lineHeight: 待填写
    letterSpacing: 0
  body-md:
    fontFamily: "待填写"
    fontSize: 待填写
    fontWeight: 待填写
    lineHeight: 待填写
    letterSpacing: 0
  button:
    fontFamily: "待填写"
    fontSize: 待填写
    fontWeight: 待填写
    lineHeight: 待填写
    letterSpacing: 0
rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  section: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 18px
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
    borderColor: "{colors.hairline}"
---

# awesome-design-md 页面设计模板

用途：本模板用于把用户想要的页面风格整理成 AI 可读、开发可交接的 UI 设计文档。`awesome-design-md` 在本项目中不是 skill，而是一种 Markdown 设计系统写法。

## Overview

用 2-4 段说明这个页面为什么长这样：它服务哪个用户角色、解决哪个业务任务、整体情绪是可信 / 温暖 / 克制 / 高效 / 年轻中的哪一种，以及页面节奏如何引导用户完成核心动作。

**Key Characteristics:**

- 主色如何使用：说明 `{colors.primary}` 只用于哪些关键 CTA 或状态。
- 卡片和页面地板：说明 `{colors.canvas}`、`{colors.surface-card}`、`{colors.hairline}` 的分工。
- 排版节奏：说明 display、body、caption、button 的层级。
- 业务可信感：说明哪些 UI 表达用于降低家长、学生或老师的不确定感。
- 边界诚实：说明本阶段不暗示哪些平台能力。

## Colors

### Brand & Accent

- **Primary** (`{colors.primary}`)：说明它承担的品牌和行动职责。

### Surface

- **Canvas** (`{colors.canvas}`)：说明页面底色给人的感受。
- **Surface Card** (`{colors.surface-card}`)：说明卡片如何从底色中分离。

### Hairlines

- **Hairline** (`{colors.hairline}`)：说明边框、分隔线和卡片层级如何使用。

### Text

- **Ink** (`{colors.ink}`)：主标题和强信息。
- **Body** (`{colors.body}`)：正文。
- **Muted** (`{colors.muted}`)：辅助说明、时间、次级状态。

## Typography

说明字体选择、字号层级、字重和行高原则。标题用于建立信任和识别，正文用于快速理解，按钮文字保持短促明确。

### Principles

- 不用过多字重制造层级，优先用字号、间距、颜色和区块位置。
- 页面内不使用负字距。
- 中文界面优先保证可读性和移动端换行质量。

### Note on Font Substitutes

如指定字体不可用，使用系统中文字体和通用 sans-serif 兜底。

## Layout

说明页面整体布局、内容宽度、网格、卡片排列、导航位置、表单密度和留白节奏。

### Spacing Philosophy

使用 `{spacing.section}` 拉开主要区块；使用 `{spacing.lg}` 和 `{spacing.base}` 管理卡片内部节奏；移动端减少横向并列，保持表单和按钮可点。

## Elevation

说明是否使用阴影。如果不用阴影，明确卡片依靠 `{colors.hairline}` 边框和背景层级分离。

## Components

**`button-primary`**：说明主按钮的使用场景、默认 / hover / active / disabled 状态，以及不得滥用的位置。

**`card`**：说明默认内容卡片的背景、边框、圆角、内边距和信息密度。

后续如新增组件，必须同步补充 YAML `components` key 和本节 prose 说明，保持一一对应。

## Page Structure

按页面从上到下写清：

1. 顶部导航或返回入口。
2. 首屏核心信息和主行动。
3. 表单、列表、详情或聊天主体。
4. 辅助说明、风险提示或规则入口。
5. 空状态、错误状态、加载状态和成功状态。

## Business Boundary

本项目当前 UI 不得暗示：

- 平台已完成实名认证或资质审核。
- 平台提供担保交易、在线支付、退款或合同。
- 平台提供即时人工客服、人工仲裁或纠纷处理。
- 平台保证教学质量或老师身份真实性。
- 平台已有自动推荐算法、复杂排课、课时记录或评价体系。

## Responsive Behavior

| Name | Width | Key Changes |
| --- | --- | --- |
| Mobile | < 720px | 导航收缩；卡片单列；表单全宽；主按钮触控面积不小于 44 x 44px。 |
| Tablet | 720-1024px | 双列内容谨慎使用；列表可 2 列；侧栏收起或下移。 |
| Desktop | 1024-1440px | 内容区固定最大宽度；可使用 2-3 列卡片；主要 CTA 保持首屏可见。 |
| Wide | > 1440px | 内容不无限拉伸，容器居中，外侧留白吸收宽屏空间。 |

### Touch Targets

- 主 CTA 不小于 44 x 44px。
- 表单输入框高度建议不小于 44px，移动端建议 48px。

### Collapsing Strategy

- 卡片从多列降为单列。
- 表单字段优先纵向堆叠。
- 关键按钮固定在内容流中，不遮挡输入和说明文字。

## Known Gaps

- 动效时长和复杂转场未定义，除非任务明确要求。
- 深色模式未定义，除非任务明确要求。
- 高级错误 / 成功状态插画未定义，除非任务明确要求。
- 本设计文档不是产品验收结论，也不代表相关功能已经实现。

## User Input Needed

为了让我输出有效设计稿，用户最好提供：

- 要设计的页面或流程。
- 目标用户角色。
- 希望参考的 `awesome-design-md` 风格或截图。
- 必须保留的内容、字段、入口和流程。
- 必须避免暗示的业务能力。
- 输出类型：大方向改版、小细节调整、草图模板、阶段定稿或开发交接。
