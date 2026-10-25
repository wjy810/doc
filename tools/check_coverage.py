#!/usr/bin/env python3
"""原稿知识点清单与覆盖检查：确认两份原始手册中的每个知识点都写进了新文档。

用法：
    python3 tools/check_coverage.py extract            # 从原稿抽取知识点，更新清单（保留人工修改）
    python3 tools/check_coverage.py check              # 检查全部清单，按原稿章节汇总覆盖情况
    python3 tools/check_coverage.py check --part 07    # 只看原稿第 07 章（附录写字母，如 A）
    python3 tools/check_coverage.py check --missing    # 同时列出每个未覆盖的知识点
    python3 tools/check_coverage.py check --final      # 收尾检查：“待写”也算缺失
    python3 tools/check_coverage.py set 编号 检查词 [备注]  # 改写一行的检查词，例如 set F07.2-047 "比例尺｜映射尺度"

清单与映射放在 tools/coverage/：
    映射.json   原稿章节 → 新文档（更具体的节号优先，例如 "17.1" 优先于 "17"）
    *.tsv       每行一个知识点，列为：编号、原稿位置、类型、知识点、检查词、新文档、备注

抽取规则：章节标题、粗体条目、表格单元格、用顿号并列的每一项、西文术语。
“检查词”默认等于知识点，可人工改为几个等价写法（用“｜”分隔，出现任意一个即算覆盖）；
写成“-”表示这一行不是知识点（例如抽取残片）。“新文档”默认来自映射，也可人工改写。

判定：检查词出现在指定新文档中为“已覆盖”；只出现在同一方向的其他新文档中为“他处覆盖”；
目标文档尚未写出为“待写”；其余为“缺失”。新文档写成“*”的行（资料入口）出现在任意一册即可。
比较时忽略空白、大小写和全半角差异。
只依赖 Python 3.9+ 标准库。退出码：0 表示所有已写出的目标文档都没有缺失，1 表示存在缺失。
"""

from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COVERAGE = ROOT / "tools" / "coverage"
FIELDS = ["编号", "原稿位置", "类型", "知识点", "检查词", "新文档", "备注"]

RE_HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
RE_CHAPTER = re.compile(r"^(?:附录\s*([A-Z])|([A-Z])\.(\d+)|(\d{1,2})(?:\.(\d{1,2}))?)(?=[\s：:]|$)")
RE_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
RE_URL = re.compile(r"<?https?://\S+")
RE_TAG = re.compile(r"</?[A-Za-z][^>]*>")
RE_BOLD = re.compile(r"\*\*([^*]+?)\*\*")
RE_TABLE_DELIM = re.compile(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$")
RE_LATIN = re.compile(r"(?<![A-Za-z0-9])\d*[A-Za-z][A-Za-z0-9+#]*(?:(?:[./-]| (?=[A-Z0-9]))[A-Za-z0-9+#]+)*")
RE_CLAUSE_SPLIT = re.compile(r"[，,：:；;。！？!?（）()“”\"「」《》〈〉【】\[\]|]")

# 结构性标题与通用标签：不作为知识点。
GENERIC = {
    "阅读导航", "研究对象与先修要求", "八个横向分支", "练习与验收", "目标与范围", "能力组合",
    "交付与验收", "修订记录", "后续维护", "参考入口", "参考", "可做项目", "注意", "说明",
}
# 第一项开头常见的动词或引导词：切掉后才是并列的名词。
LEAD = sorted("""包括 包含 研究 学习 掌握 理解 处理 使用 运用 管理 设计 探索 观察 识别 区分 比较 组织 实现
支持 提供 检查 记录 准备 关注 涉及 深入 建立 统一 选择 保证 规划 安排 考虑 测试 允许 调整 保存 维护
定义 说明 注明 加入 增加 补充 补齐 完成 制作 修改 适合 例如 比如 诸如 映射为 转化为 转为 分为 分成
需要 应当 应该 可以 能够 常见 常用 根据 通过 结合 围绕 改进 优化 编写 开发 构建 负责 关心 面对 面向
覆盖 交付 写出 列出 明确 确认 核对 判断 评价 提出 以及 还有 同时 再 并 还 也 先 后 则 即 像 用 从 对
把 将 让 由 按 在""".split(), key=len, reverse=True)
# 最后一项后面常跟着谓语：从这些位置截断。
TAIL = ["的影响", "可以", "映射到", "映射", "各自", "组成", "应在", "应当", "应该", "应能", "需要", "会影响", "能够",
        "时的", "都", "也", "均", "等"]
# 这些词出现在较长的第一项中间时，后面才是并列的名词，例如“把参数分成结构”。
SPLIT_AT = ["映射为", "转化为", "转为", "分为", "分成", "包括", "例如", "比如", "诸如"]
CONNECT = re.compile(r"以及|或者|还是|和|与|及|或|并")
TRAIL = re.compile(r"(等等|等).*$")
LONG = 6


@dataclass
class Point:
    pid: str
    where: str
    kind: str
    text: str
    terms: str
    targets: str
    note: str = ""

    def row(self) -> list[str]:
        return [self.pid, self.where, self.kind, self.text, self.terms, self.targets, self.note]


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower()
    return re.sub(r"[\s*`_]+", "", text)


def clean_line(line: str) -> str:
    line = RE_LINK.sub(r"\1", line)
    line = RE_URL.sub("", line)
    line = RE_TAG.sub("", line)
    return line.replace("`", "")


def section_id(heading: str) -> str | None:
    """把“03 前端界面工程”“3.2 八个横向分支”“附录 A：术语”“C.1 结构取舍”转成统一编号。"""
    m = RE_CHAPTER.match(heading)
    if not m:
        return None
    appendix, letter, letter_sub, chapter, sub = m.groups()
    if appendix:
        return appendix
    if letter:
        return f"{letter}.{letter_sub}"
    return f"{int(chapter):02d}" + (f".{sub}" if sub else "")


def width(text: str) -> int:
    """一个西文单词按一个字计算长度。"""
    return len(re.sub(r"[A-Za-z0-9.+#-]+", "A", text.replace(" ", "")))


def enough(text: str) -> bool:
    """至少两个汉字，或含一个西文单词。"""
    return width(text) >= 2 or bool(re.search(r"[A-Za-z]{2,}", text))


def strip_head(item: str) -> str:
    """切掉第一项开头的动词短语，例如“需要观察阴影”→“阴影”“三维作品由形体”→“形体”。"""
    changed = True
    while changed:
        changed = False
        for verb in LEAD:
            if item.startswith(verb) and enough(item[len(verb):]):
                item = item[len(verb):].strip()
                changed = True
                break
    for verb in SPLIT_AT:
        i = item.rfind(verb)
        if i > 0 and enough(item[i + len(verb):]):
            item = item[i + len(verb):].strip()
    if width(item) > LONG:
        multi = [i + len(v) for v in LEAD if len(v) >= 2 for i in [item.rfind(v)] if i > 0 and enough(item[i + len(v):])]
        single = [i + 1 for v in LEAD if len(v) == 1 for i in [item.find(v)] if i > 0 and enough(item[i + 1:])]
        if multi:
            item = item[max(multi):].strip()
        elif single:                          # 单字动词取最早出现的位置，避免切进“用户”这类词
            item = item[min(single):].strip()
    if width(item) > LONG and "的" in item and enough(item.rsplit("的", 1)[1]):
        item = item.rsplit("的", 1)[1]
    return item


def strip_tail(item: str) -> str:
    """截掉最后一项后面的谓语，例如“静音体验都应在原型中处理”→“静音体验”。"""
    item = re.sub(r"[一二三四五六七八九两几多]类$", "", item)
    if width(item) <= LONG:
        return item
    cuts = [i for marker in TAIL for i in [item.find(marker, 2)] if i >= 2]
    return item[:min(cuts)].strip() if cuts else item


def split_last(item: str) -> list[str]:
    item = TRAIL.sub("", item).strip()
    item = strip_tail(item)
    parts = [p.strip() for p in CONNECT.split(item)]
    if len(parts) > 1 and all(enough(p) for p in parts):
        return [strip_tail(p) for p in parts]
    return [item]


def enumerations(text: str) -> list[str]:
    """抽取“甲、乙、丙和丁”这类并列项。"""
    found: list[str] = []
    for clause in RE_CLAUSE_SPLIT.split(text):
        if "、" not in clause:
            continue
        items = [i.strip() for i in clause.split("、")]
        head, *rest = items
        parts = [strip_head(head), *rest[:-1], *split_last(rest[-1])]
        for item in parts:
            item = TRAIL.sub("", item).strip(" 　的")
            if enough(item) and width(item) <= 16:
                found.append(item)
    return found


def latin_terms(text: str) -> list[str]:
    terms = []
    for m in RE_LATIN.finditer(text):
        term = m.group(0).strip(" .-/")
        if len(term) >= 2 and not term.isdigit():
            terms.append(term)
    return terms


def table_cells(line: str) -> list[str]:
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    return [c for c in cells if c]


def extract(source: Path, prefix: str, mapping: dict[str, list[str] | str]) -> list[Point]:
    points: list[Point] = []
    seen: set[tuple[str, str]] = set()
    counters: dict[str, int] = {}
    chapter = "00"
    where = "00"
    heading_text = ""
    lines = source.read_text(encoding="utf-8").splitlines()

    def add(kind: str, text: str) -> None:
        text = text.strip(" 　。，；：、")
        if not text or text in GENERIC or norm(text) in {norm(g) for g in GENERIC}:
            return
        key = (where, norm(text))
        if key in seen:
            return
        seen.add(key)
        counters[where] = counters.get(where, 0) + 1
        pid = f"{prefix}{where}-{counters[where]:03d}"
        targets = lookup(mapping, where)
        if targets == "-":                    # 映射写成 "-" 的小节（如修订记录）不算知识点
            points.append(Point(pid, where, kind, text, "-", ""))
        else:
            points.append(Point(pid, where, kind, text, text, "｜".join(targets)))

    for i, raw in enumerate(lines):
        h = RE_HEADING.match(raw)
        if h:
            title = clean_line(h.group(2)).strip()
            sid = section_id(title)
            if sid:
                where = sid
                chapter = sid.split(".")[0]
                heading_text = RE_CHAPTER.sub("", title).strip(" ：:")
            elif title.startswith(("第", "阅读导航")):
                continue                      # “第一篇”之类的分篇标题
            else:
                # 没有编号的小节（例如“项目 01 …”）归入所在章
                where = chapter
                heading_text = title
            add("标题", heading_text)
            continue
        line = clean_line(raw).strip()
        if not line:
            continue
        if line.startswith("|"):
            if RE_TABLE_DELIM.match(line):
                continue
            next_line = lines[i + 1] if i + 1 < len(lines) else ""
            if RE_TABLE_DELIM.match(next_line):
                continue                      # 表头只是列名
            cells = table_cells(line)
            if cells:
                add("表格", RE_BOLD.sub(r"\1", cells[0]))
            for cell in cells:
                for item in enumerations(cell):
                    add("列举", item)
                for term in latin_terms(cell):
                    add("术语", term)
            continue
        for bold in RE_BOLD.findall(line):
            add("条目", bold)
        plain = RE_BOLD.sub(r"\1", line).lstrip("-*0123456789. []x>")
        for item in enumerations(plain):
            add("列举", item)
        for term in latin_terms(plain):
            add("术语", term)
    return points


def lookup(mapping: dict[str, list[str] | str], where: str) -> list[str] | str:
    key = where
    while key:
        if key in mapping:
            return mapping[key]
        key = key.rsplit(".", 1)[0] if "." in key else ""
    return []


def load_tsv(path: Path) -> list[Point]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader, None)
        return [Point(*row[:7]) for row in reader if row and header]


def save_tsv(path: Path, points: list[Point]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow(FIELDS)
        for p in points:
            writer.writerow(p.row())


def load_mapping() -> dict:
    return json.loads((COVERAGE / "映射.json").read_text(encoding="utf-8"))


def cmd_extract() -> int:
    for source, conf in load_mapping().items():
        src = ROOT / source
        if not src.exists():
            print(f"跳过：{source} 不存在（原稿已删除时清单保持不变）")
            continue
        tsv = COVERAGE / conf["清单"]
        old = {(p.where, norm(p.text)): p for p in load_tsv(tsv)}
        new = extract(src, conf["前缀"], conf["章节"])
        kept = 0
        for p in new:
            prev = old.get((p.where, norm(p.text)))
            if prev:
                p.terms, p.note = prev.terms, prev.note
                if prev.targets:
                    p.targets = prev.targets
                kept += 1
        save_tsv(tsv, new)
        print(f"{source}：{len(new)} 个知识点（{kept} 行沿用已有清单的检查词与备注）→ {tsv.relative_to(ROOT)}")
    return 0


def cmd_check(args: list[str]) -> int:
    part = args[args.index("--part") + 1] if "--part" in args else None
    show_missing = "--missing" in args
    final = "--final" in args
    failed = False
    for source, conf in load_mapping().items():
        base = ROOT / conf["新文档目录"]
        texts = {p.name: norm(p.read_text(encoding="utf-8")) for p in base.glob("*.md")}
        rows = load_tsv(COVERAGE / conf["清单"])
        stats: dict[str, dict[str, int]] = {}
        missing: dict[str, list[Point]] = {}
        for p in rows:
            chapter = p.where.split(".")[0]
            if part and chapter != part:
                continue
            if p.terms.strip() == "-":
                continue
            terms = [norm(t) for t in p.terms.split("｜") if t.strip()]
            targets = [t for t in p.targets.split("｜") if t]
            written = [t for t in targets if t in texts]
            if not targets:
                state = "未分配"
            elif targets == ["*"]:            # 资料类条目：出现在任意一册即可
                found = any(any(t in body for t in terms) for body in texts.values())
                state = "已覆盖" if found else ("缺失" if final else "待写")
            elif any(any(t in texts[d] for t in terms) for d in written):
                state = "已覆盖"
            elif any(any(t in body for t in terms) for name, body in texts.items() if name not in targets):
                state = "他处覆盖" if written else "待写"
            elif not written:
                state = "待写"
            else:
                state = "缺失"
            stats.setdefault(chapter, {}).setdefault(state, 0)
            stats[chapter][state] += 1
            if state in {"缺失", "未分配"}:
                missing.setdefault(chapter, []).append(p)
        print(f"\n{source} → {conf['新文档目录']}")
        print("原稿章  知识点  已覆盖  他处覆盖  待写  缺失  未分配")
        total = {k: 0 for k in ["已覆盖", "他处覆盖", "待写", "缺失", "未分配"]}
        for chapter in sorted(stats, key=sort_key):
            s = stats[chapter]
            n = sum(s.values())
            for k in total:
                total[k] += s.get(k, 0)
            print(f"{chapter:>6}  {n:>6}  {s.get('已覆盖', 0):>6}  {s.get('他处覆盖', 0):>8}  "
                  f"{s.get('待写', 0):>4}  {s.get('缺失', 0):>4}  {s.get('未分配', 0):>6}")
        n = sum(total.values())
        print(f"{'合计':>5}  {n:>6}  {total['已覆盖']:>6}  {total['他处覆盖']:>8}  "
              f"{total['待写']:>4}  {total['缺失']:>4}  {total['未分配']:>6}")
        if total["缺失"] or total["未分配"]:
            failed = True
        if show_missing:
            for chapter in sorted(missing, key=sort_key):
                for p in missing[chapter]:
                    print(f"  {p.pid}\t{p.kind}\t{p.text}\t→ {p.targets or '（未分配）'}")
    return 1 if failed else 0


def cmd_set(args: list[str]) -> int:
    if len(args) < 2:
        print("用法：set 编号 检查词 [备注]")
        return 2
    pid, terms, *note = args
    for conf in load_mapping().values():
        tsv = COVERAGE / conf["清单"]
        rows = load_tsv(tsv)
        for p in rows:
            if p.pid == pid:
                p.terms = terms
                if note:
                    p.note = note[0]
                save_tsv(tsv, rows)
                print(f"{pid}\t{p.text}\t→ 检查词：{terms}")
                return 0
    print(f"找不到编号 {pid}")
    return 1


def sort_key(chapter: str) -> tuple[int, str]:
    return (0, f"{int(chapter):03d}") if chapter.isdigit() else (1, chapter)


def main(argv: list[str]) -> int:
    commands = {"extract": lambda: cmd_extract(), "check": lambda: cmd_check(argv[1:]), "set": lambda: cmd_set(argv[1:])}
    if not argv or argv[0] not in commands:
        print(__doc__)
        return 2
    return commands[argv[0]]()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
