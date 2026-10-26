"""把粗体内部句末的中文标点移到粗体外：**标签。**正文 → **标签**。正文
按行配对 ** 标记（跳过行内代码），只处理真正的一对粗体。用法：python3 fix_bold.py 文件.md"""
import re, sys
from pathlib import Path
PUNCT = "。，：；！？"
def fix_line(line):
    # 记录行内代码的范围，代码中的 ** 不算
    spans = [(m.start(), m.end()) for m in re.finditer(r"(`+)(.+?)\1", line)]
    in_code = lambda i: any(a <= i < b for a, b in spans)
    marks = [m.start() for m in re.finditer(r"\*\*", line) if not in_code(m.start())]
    out, last, moved = [], 0, 0
    for k in range(0, len(marks) - 1, 2):
        o, c = marks[k], marks[k + 1]
        inner = line[o + 2:c]
        after = line[c + 2:c + 3]
        if inner and inner[-1] in PUNCT and after and not after.isspace() and after not in PUNCT + "*":
            out.append(line[last:o] + "**" + inner[:-1] + "**" + inner[-1])
            last = c + 2
            moved += 1
    out.append(line[last:])
    return "".join(out), moved
total = 0
for path in sys.argv[1:]:
    p = Path(path)
    lines, fence = [], False
    for line in p.read_text(encoding="utf-8").split("\n"):
        if line.lstrip().startswith("```"):
            fence = not fence
        if not fence:
            line, n = fix_line(line)
            total += n
        lines.append(line)
    p.write_text("\n".join(lines), encoding="utf-8")
print("moved", total)
