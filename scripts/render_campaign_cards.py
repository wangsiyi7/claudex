"""Render deterministic bilingual copy over the generated Claudex campaign art."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "campaign"
ORANGE = "#ff7849"
BLUE = "#86a2ff"
PAPER = "#f7f5ef"
MUTED = "#a0a7b4"
EN_BOLD = Path("C:/Windows/Fonts/consolab.ttf")
EN_REGULAR = Path("C:/Windows/Fonts/consola.ttf")
ZH_BOLD = Path("C:/Windows/Fonts/msyhbd.ttc")
ZH_REGULAR = Path("C:/Windows/Fonts/msyh.ttc")


def font(size: int, language: str, bold: bool = False) -> ImageFont.FreeTypeFont:
    if language == "zh":
        path = ZH_BOLD if bold else ZH_REGULAR
    else:
        path = EN_BOLD if bold else EN_REGULAR
    return ImageFont.truetype(str(path), size=size)


def overlay(image: Image.Image, box: tuple[int, int, int, int], opacity: int = 215) -> None:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=26, fill=(3, 5, 8, opacity), outline=ORANGE, width=3)
    image.alpha_composite(layer)


def frame(image: Image.Image) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((22, 22, image.width - 22, image.height - 22), radius=28, outline=ORANGE, width=4)
    return draw


def render_square(source: str, output: str, language: str, eyebrow: str, title: str, note: str) -> None:
    image = Image.open(ASSETS / source).convert("RGBA")
    draw = frame(image)
    overlay(image, (54, 54, image.width - 54, 224), 225)
    overlay(image, (54, image.height - 292, image.width - 54, image.height - 54), 235)
    draw = ImageDraw.Draw(image)
    draw.text((90, 91), eyebrow, font=font(24, language, True), fill=BLUE)
    draw.text((image.width // 2, image.height - 214), title, font=font(58 if language == "en" else 62, language, True), fill=ORANGE, anchor="mm", align="center", spacing=10)
    draw.text((image.width // 2, image.height - 107), note, font=font(24 if language == "en" else 25, language), fill=MUTED, anchor="mm", align="center")
    out = ASSETS / language / output
    out.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(out, quality=95)


def render_wide(language: str, title: str, note: str) -> None:
    image = Image.open(ASSETS / "claudex-wechat-cover.png").convert("RGBA")
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    pixels = layer.load()
    for x in range(image.width):
        strength = max(0, 235 - int(235 * x / (image.width * 0.62)))
        for y in range(image.height):
            pixels[x, y] = (2, 4, 8, strength)
    image.alpha_composite(layer)
    draw = frame(image)
    draw.text((92, 84), "CLAUDEX_ / LAUNCH BRIEF" if language == "en" else "CLAUDEX_ / 正式发布", font=font(24, language, True), fill=BLUE)
    draw.text((92, 225), title, font=font(72 if language == "en" else 78, language, True), fill=PAPER, spacing=12)
    draw.text((96, 602), note, font=font(28 if language == "en" else 30, language), fill=ORANGE)
    draw.text((96, 676), "*Independent parody project. The software is real." if language == "en" else "*独立戏仿项目。收购是假的，软件是真的。", font=font(22, language), fill=MUTED)
    out = ASSETS / language / "claudex-wechat-cover.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(out, quality=95)


def main() -> None:
    render_square(
        "claudex-press-conference.png",
        "claudex-press-conference.png",
        "en",
        "CLAUDEX_ / OFFICIAL ANNOUNCEMENT",
        "THE MERGER CLOSED.*",
        "*Legally and factually: it did not.",
    )
    render_square(
        "claudex-effort-control.png",
        "claudex-effort-control.png",
        "en",
        "SOL CONTROL ROOM / LIVE",
        "RIGHT-SIZE\nTHE THINKING.",
        "MAIN: HIGH  ·  AGENTS: MEDIUM",
    )
    render_wide("en", "ONE CRAB.\nNEW MANAGEMENT.", "gpt-5.6-sol  ·  effort adjustable")

    render_square(
        "claudex-press-conference.png",
        "claudex-press-conference.png",
        "zh",
        "CLAUDEX_ / 正式公告",
        "并购完成。*",
        "*从法律与事实层面看：并没有。",
    )
    render_square(
        "claudex-effort-control.png",
        "claudex-effort-control.png",
        "zh",
        "SOL 控制室 / 运行中",
        "让每个代理\n用合适的力气。",
        "主代理：HIGH  ·  子代理：MEDIUM",
    )
    render_wide("zh", "一只螃蟹。\n新的管理层。", "gpt-5.6-sol  ·  努力等级自由调节")


if __name__ == "__main__":
    main()
