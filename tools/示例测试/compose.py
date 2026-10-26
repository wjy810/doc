# 把几张截图拼成一张图，每张上方加一行说明文字
# 用法：COLS=2 python3 compose.py 输出.png 图1.png "说明1" 图2.png "说明2" ...（COLS 默认等于图片数，即排成一行）
import os, sys
from PIL import Image, ImageDraw, ImageFont
out, rest = sys.argv[1], sys.argv[2:]
pairs = [(Image.open(rest[i]).convert('RGB'), rest[i + 1]) for i in range(0, len(rest), 2)]
cols = int(os.environ.get('COLS', len(pairs)))
rows = (len(pairs) + cols - 1) // cols
font = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 15)
pad, bar = 12, 30
cw = max(im.width for im, _ in pairs); ch = max(im.height for im, _ in pairs) + bar
canvas = Image.new('RGB', (cols * cw + (cols + 1) * pad, rows * ch + (rows + 1) * pad), (244, 244, 241))
d = ImageDraw.Draw(canvas)
for k, (im, label) in enumerate(pairs):
    x = pad + (k % cols) * (cw + pad); y = pad + (k // cols) * (ch + pad)
    d.text((x, y + 4), label, font=font, fill=(29, 35, 48))
    canvas.paste(im, (x, y + bar))
canvas.save(out)
print(out, canvas.size)
