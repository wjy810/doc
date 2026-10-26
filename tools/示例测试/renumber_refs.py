"""按正文中首次引用的顺序重新编号参考资料 Bxx，并重排附录 B 中的条目。用法：python3 renumber_refs.py 文件.md"""
import re, sys
from pathlib import Path
p = Path(sys.argv[1])
s = p.read_text(encoding="utf-8")
appendix = s.index('<a id="appendix-b"></a>')
body = s[:appendix]
order = []
for m in re.finditer(r"\[B(\d+)\]\(#ref-b(\d+)\)", body):
    n = int(m.group(2))
    if n not in order:
        order.append(n)
mapping = {old: new for new, old in enumerate(order, 1)}
# 附录中定义了但正文未引用的条目保持在最后
defined = [int(x) for x in re.findall(r'<a id="ref-b(\d+)"></a>', s)]
for d in defined:
    if d not in mapping:
        mapping[d] = len(mapping) + 1
if all(k == v for k, v in mapping.items()):
    print("编号已经按首次引用排序"); sys.exit(0)
def sub_cite(m):
    new = mapping[int(m.group(2))]
    return f"[B{new:02d}](#ref-b{new:02d})"
s = re.sub(r"\[B(\d+)\]\(#ref-b(\d+)\)", sub_cite, s)
# 重写附录 B 中的条目并排序
start = s.index('<a id="ref-b')
end_marker = s.index('<a id="appendix-c"></a>')
block = s[start:end_marker]
entries = re.split(r'(?=<a id="ref-b\d+"></a>)', block)
parsed = []
for e in entries:
    m = re.match(r'<a id="ref-b(\d+)"></a>', e)
    if not m:
        continue
    old = int(m.group(1)); new = mapping[old]
    e = e.replace(f'<a id="ref-b{old:02d}"></a>', f'<a id="ref-b{new:02d}"></a>', 1)
    e = re.sub(r"\*\*B\d+ ·", f"**B{new:02d} ·", e, count=1)
    parsed.append((new, e.rstrip() + "\n\n"))
parsed.sort()
s = s[:start] + "".join(e for _, e in parsed) + s[end_marker:]
p.write_text(s, encoding="utf-8")
print("重新编号：", {k: v for k, v in mapping.items() if k != v})
