from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "reports" / "output"
OUT.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")


def font(size, bold=False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


labels = ["2000-2008", "2009_1", "2009_2", "2010_1", "2010_2", "2011_1", "2011_2", "2012_2", "2013_1", "2013_2", "2014_1", "2014_2", "2015_1", "2015_2", "2016_1", "2016_2", "2017_1", "2017_2", "2018_1", "2018_2", "2019_1", "2019_2", "2020_1", "2020_2"]
qualities = [84, 57, 79, 52, 76, 61, 83, 74, 49, 80, 55, 77, 63, 85, 48, 78, 60, 82, 64, 87, 59, 84, 62, 81]


def js_round(value):
    return int(value + 0.5)


clouds = [max(2, 35 - js_round(q / 3)) for q in qualities]
scenes = [max(6, js_round(q / 7)) for q in qualities]

GREEN = "#335f43"
GREEN_DARK = "#16251b"
GRID = "#9bac9f"
ALT = "#f1f5f1"
GOOD = "#d8eadc"
LOW = "#f5dfd5"
MUTED = "#4f5e53"


def centered(draw, box, text, fnt, fill):
    x1, y1, x2, y2 = box
    bbox = draw.textbbox((0, 0), str(text), font=fnt)
    x = x1 + (x2 - x1 - (bbox[2] - bbox[0])) / 2
    y = y1 + (y2 - y1 - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), str(text), font=fnt, fill=fill)


def render_period_table(filename, title, rows):
    width, margin, title_h, header_h, row_h, footer_h = 1600, 70, 105, 68, 64, 100
    height = margin + title_h + header_h + row_h * len(rows) + footer_h
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    centered(draw, (margin, margin, width - margin, margin + 70), title, font(44, True), GREEN_DARK)
    x_positions = [margin, 420, 800, 1190, width - margin]
    y = margin + title_h
    headers = ["Período", "Qualidade (%)", "Nuvens (%)", "Cenas"]
    for col in range(4):
        box = (x_positions[col], y, x_positions[col + 1], y + header_h)
        draw.rectangle(box, fill=GREEN, outline=GRID, width=2)
        centered(draw, box, headers[col], font(30, True), "white")
    y += header_h
    for row_index, row in enumerate(rows):
        for col, value in enumerate(row):
            fill = ALT if row_index % 2 == 0 else "white"
            if col == 1:
                fill = GOOD if int(value) >= 80 else LOW if int(value) < 60 else fill
            box = (x_positions[col], y, x_positions[col + 1], y + row_h)
            draw.rectangle(box, fill=fill, outline=GRID, width=2)
            centered(draw, box, value, font(28, col == 1), GREEN_DARK)
        y += row_h
    note = "Fonte: conjunto demonstrativo do Prospecta 4.0. Os valores não representam acurácia de um modelo mineral."
    draw.text((margin, y + 32), note, font=font(22), fill=MUTED)
    image.save(OUT / filename, quality=95)


all_rows = [[label, quality, cloud, scene] for label, quality, cloud, scene in zip(labels, qualities, clouds, scenes)]
render_period_table("tabela-rendimento-periodos-1.png", "Rendimento dos mosaicos — 2000 a 2014", all_rows[:12])
render_period_table("tabela-rendimento-periodos-2.png", "Rendimento dos mosaicos — 2015 a 2020", all_rows[12:])


summary_rows = [
    ["Períodos cadastrados", "24", "Produtos temporais disponíveis no conjunto demonstrativo"],
    ["Qualidade média", f"{sum(qualities)/len(qualities):.1f}%".replace(".", ","), "Média dos indicadores cadastrados"],
    ["Melhor período", f"2018_2 — {max(qualities)}%", "Maior indicador de qualidade"],
    ["Menor indicador", f"2016_1 — {min(qualities)}%", "Período que exige maior atenção"],
    ["Cobertura média de nuvens", f"{sum(clouds)/len(clouds):.1f}%".replace(".", ","), "Estimativa registrada no conjunto demonstrativo"],
    ["Total de cenas", str(sum(scenes)), "Soma das cenas informadas em todos os períodos"],
]

width, height, margin = 1800, 920, 70
image = Image.new("RGB", (width, height), "white")
draw = ImageDraw.Draw(image)
centered(draw, (margin, 45, width - margin, 125), "Resumo do rendimento registrado no Prospecta 4.0", font(44, True), GREEN_DARK)
x_positions = [margin, 560, 1010, width - margin]
y, header_h, row_h = 165, 72, 92
for col, label in enumerate(["Indicador", "Resultado", "Interpretação"]):
    box = (x_positions[col], y, x_positions[col + 1], y + header_h)
    draw.rectangle(box, fill=GREEN, outline=GRID, width=2)
    centered(draw, box, label, font(30, True), "white")
y += header_h
for row_index, row in enumerate(summary_rows):
    for col, value in enumerate(row):
        box = (x_positions[col], y, x_positions[col + 1], y + row_h)
        draw.rectangle(box, fill=ALT if row_index % 2 == 0 else "white", outline=GRID, width=2)
        if col == 2:
            draw.text((box[0] + 18, box[1] + 29), str(value), font=font(25), fill=GREEN_DARK)
        else:
            centered(draw, box, value, font(27, col == 1), GREEN_DARK)
    y += row_h
draw.text((margin, y + 35), "Fonte: conjunto demonstrativo do Prospecta 4.0; não corresponde ao desempenho de Machine Learning.", font=font(22), fill=MUTED)
image.save(OUT / "tabela-resumo-rendimento.png", quality=95)

print("\n".join(str(p) for p in sorted(OUT.glob("tabela-*.png"))))
