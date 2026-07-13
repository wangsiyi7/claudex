"""Compose the generated Claudex mascot plate with a real project screenshot."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ORANGE = "#ff7849"
BLUE = "#86a2ff"
PAPER = "#f7f5ef"
MUTED = "#a3a9b5"
FONT_BOLD = "C:/Windows/Fonts/consolab.ttf"
FONT_REGULAR = "C:/Windows/Fonts/consola.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size=size)


def rounded(image: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width, image.height), radius=radius, fill=255)
    result = image.convert("RGBA")
    result.putalpha(mask)
    return result


def pill(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, color: str) -> int:
    face = font(19, True)
    box = draw.textbbox((0, 0), text, font=face)
    width = box[2] - box[0] + 34
    draw.rounded_rectangle((x, y, x + width, y + 42), radius=20, fill="#101522", outline=color, width=2)
    draw.text((x + 17, y + 10), text, font=face, fill=color)
    return x + width + 12


def main() -> None:
    canvas = Image.open(ASSETS / "claudex-x-project-card-base.png").convert("RGBA")
    canvas = canvas.resize((1600, 900), Image.Resampling.LANCZOS)

    screenshot = Image.open(ASSETS / "claudex-site-preview.png").convert("RGB")
    screenshot = screenshot.resize((880, 495), Image.Resampling.LANCZOS)
    screenshot = rounded(screenshot, 22)

    framed = Image.new("RGBA", (908, 523), (6, 8, 14, 255))
    frame_draw = ImageDraw.Draw(framed)
    frame_draw.rounded_rectangle((1, 1, 906, 521), radius=26, outline=ORANGE, width=3)
    framed.alpha_composite(screenshot, (14, 14))
    rotated = framed.rotate(-3.2, resample=Image.Resampling.BICUBIC, expand=True)

    shadow = Image.new("RGBA", rotated.size, (0, 0, 0, 0))
    shadow.putalpha(rotated.getchannel("A").filter(ImageFilter.GaussianBlur(18)))
    shadow_color = Image.new("RGBA", rotated.size, (0, 0, 0, 175))
    shadow_color.putalpha(shadow.getchannel("A"))
    canvas.alpha_composite(shadow_color, (82, 163))
    canvas.alpha_composite(rotated, (65, 142))

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle((88, 602, 1015, 854), radius=28, fill=(4, 6, 10, 238), outline=ORANGE, width=3)
    od.rounded_rectangle((86, 52, 560, 102), radius=24, fill=(4, 6, 10, 225), outline="#303a4c", width=2)
    canvas.alpha_composite(overlay)

    draw = ImageDraw.Draw(canvas)
    draw.text((112, 66), "OPEN SOURCE  /  LOCAL ORCHESTRATION", font=font(20, True), fill=BLUE)
    draw.text((120, 628), "CLAUDEX", font=font(61, True), fill=PAPER)
    draw.text((391, 630), "_", font=font(61, True), fill=ORANGE)
    draw.text((120, 706), "Claude Code shell. Codex brain.", font=font(29, True), fill=PAPER)

    x = 120
    x = pill(draw, x, 757, "gpt-5.6-sol", BLUE)
    x = pill(draw, x, 757, "EFFORT: ADJUSTABLE", ORANGE)
    pill(draw, x, 757, "CODEX OAUTH", BLUE)

    draw.text((120, 817), "github.com/wangsiyi7/claudex", font=font(22), fill=MUTED)
    draw.text((1238, 811), "ONE CRAB.", font=font(22, True), fill=ORANGE)
    draw.text((1212, 840), "NEW MANAGEMENT.", font=font(22, True), fill=PAPER)

    canvas.convert("RGB").save(ASSETS / "claudex-x-project-card.png", quality=96)


if __name__ == "__main__":
    main()
