#!/usr/bin/env python3
"""文档质量检查：发现会影响 GitHub 渲染、页内跳转或中文排版的问题。

用法：
    python3 tools/check_docs.py              # 检查仓库内全部 Markdown 文件
    python3 tools/check_docs.py 文件.md ...   # 只检查指定文件
    python3 tools/check_docs.py --strict     # 提示项也视为失败

只依赖 Python 3.9+ 标准库；若已安装 cmarkgfm（GitHub 使用的渲染库的 Python 绑定），
会额外用它渲染全文，复核粗体是否真正生效。退出码：0 表示没有错误，1 表示存在错误。

错误（E）会直接影响渲染或跳转，提交前必须修复：
    E101  粗体标记无法闭合：CommonMark 的左右侧规则遇到中文标点时失效，
          例如 “**标签：**正文” 会在 GitHub 上原样显示星号。
    E102  页内链接指向不存在的锚点。
    E103  表格行的列数与表头不一致。
    E104  参考资料锚点被引用但未定义，或已定义却从未被引用。
    E105  代码块围栏没有闭合。
    E106  指向仓库内其他文件的相对链接失效（文件或锚点不存在）。

提示（W）影响阅读质量，应逐条确认：
    W201  参考资料的首次引用顺序与编号顺序不一致。
    W202  两个汉字之间出现半角空格，常见于用空格代替顿号。
    W203  汉字与半角逗号、分号、冒号、问号或感叹号相邻。
    W204  中文括号或引号在同一行内不成对。
    W205  疑似对话残留表述，例如“此前讨论”“本次新增”。
    W206  章节编号不连续或与所属章不一致。
    W207  同一行重复出现的常见字词，例如“的的”。
"""

from __future__ import annotations

import re
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", ".github"}

HAN = "㐀-䶿一-鿿豈-﫿"
RE_HAN_SPACE_HAN = re.compile(rf"[{HAN}] +[{HAN}]")
RE_HAN_ASCII_PUNCT = re.compile(rf"[{HAN}][,;:?!]|[,;:?!][{HAN}]")
RE_FENCE = re.compile(r"^\s{0,3}(`{3,}|~{3,})")
RE_HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
RE_HTML_ANCHOR = re.compile(r"<a\s+(?:id|name)=\"([^\"]+)\"\s*>", re.I)
RE_LINK_TARGET = re.compile(r"\]\(#([^)\s]+)\)|href=\"#([^\"]+)\"")
RE_CODE_SPAN = re.compile(r"(`+)(.+?)\1")
RE_LINK_URL = re.compile(r"\]\((?:[^()\s]|\([^()\s]*\))*\)")
RE_AUTOLINK = re.compile(r"<https?://[^>]+>")
RE_HTML_TAG = re.compile(r"</?[A-Za-z][^>]*>")
RE_BARE_URL = re.compile(r"https?://\S+")
RE_TABLE_DELIM = re.compile(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$")
RE_REF_CITE = re.compile(r"\]\(#(ref-[A-Za-z0-9-]+)\)")
RE_FILE_LINK = re.compile(r"\]\((?!https?://|mailto:|#)([^)\s#]+)(?:#([^)\s]+))?\)")
RE_NUMBERED_HEADING = re.compile(r"^(\d{1,2})(?:\.(\d{1,2}))?\s")
RE_DUP_WORD = re.compile(r"(的的|了了|是是|在在|和和|与与|或或|及及|对对)")

ARTIFACT_PHRASES = (
    "此前讨论",
    "此前的讨论",
    "前面的对话",
    "这次对话",
    "本次对话",
    "聊天顺序",
    "本次新增",
    "新增的",
    "本次合并",
    "你之前",
    "之前讨论",
)

PAIRS = (("“", "”"), ("（", "）"), ("《", "》"), ("「", "」"), ("【", "】"))


@dataclass
class Issue:
    path: Path
    line: int
    code: str
    message: str

    def render(self) -> str:
        rel = self.path.relative_to(ROOT) if self.path.is_relative_to(ROOT) else self.path
        return f"{rel}:{self.line}: {self.code} {self.message}"


@dataclass
class Report:
    issues: list[Issue] = field(default_factory=list)

    def add(self, path: Path, line: int, code: str, message: str) -> None:
        self.issues.append(Issue(path, line, code, message))


def is_punct(ch: str, include_symbols: bool) -> bool:
    """CommonMark 的“Unicode 标点”。0.31 起把符号类（S*）也算作标点，旧版只含 P*。"""
    if not ch:
        return False
    if ch.isascii():
        return ch in "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    category = unicodedata.category(ch)
    return category.startswith("P") or (include_symbols and category.startswith("S"))


def is_space(ch: str) -> bool:
    return ch == "" or ch.isspace()


def flanking(prev: str, nxt: str, include_symbols: bool) -> tuple[bool, bool]:
    """返回 (左侧, 右侧)。行首与行尾按空白处理。"""
    left = not is_space(nxt) and (
        not is_punct(nxt, include_symbols) or is_space(prev) or is_punct(prev, include_symbols)
    )
    right = not is_space(prev) and (
        not is_punct(prev, include_symbols) or is_space(nxt) or is_punct(nxt, include_symbols)
    )
    return left, right


def mask_inline(text: str) -> str:
    """去掉代码片段、链接地址和 HTML 标签，保留可见文字，避免误报。"""
    text = RE_CODE_SPAN.sub(lambda m: "x" * len(m.group(0)), text)
    text = RE_AUTOLINK.sub("x", text)
    text = RE_LINK_URL.sub("]", text)
    text = RE_HTML_TAG.sub("", text)
    text = RE_BARE_URL.sub("x", text)
    return text


def check_emphasis(path: Path, lineno: int, text: str, report: Report) -> None:
    """按行检查 ** 粗体：假设同一行内依次为开、闭标记（本仓库的写法如此）。"""
    stripped = text.lstrip()
    if stripped.startswith("* ") or stripped.startswith("+ "):
        text = text.replace("*", " ", 1) if stripped.startswith("* ") else text
    runs = [(m.start(), m.end()) for m in re.finditer(r"\*+", text)]
    runs = [(s, e) for s, e in runs if e - s == 2]
    if not runs:
        return
    if len(runs) % 2:
        report.add(path, lineno, "E101", "本行 ** 数量为奇数，粗体可能未闭合")
        return
    for index, (start, end) in enumerate(runs):
        prev = text[start - 1] if start > 0 else ""
        nxt = text[end] if end < len(text) else ""
        opening = index % 2 == 0
        for include_symbols in (False, True):
            left, right = flanking(prev, nxt, include_symbols)
            if (opening and not left) or (not opening and not right):
                role = "开始" if opening else "结束"
                snippet = text[max(0, start - 8): end + 8]
                report.add(
                    path,
                    lineno,
                    "E101",
                    f"粗体{role}标记无法生效：…{snippet}…（把中文标点移到 ** 外侧，或在其后加空格）",
                )
                break


def github_slug(heading: str) -> str:
    text = re.sub(r"<[^>]+>", "", heading)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = text.replace("`", "").replace("*", "").strip().lower()
    text = re.sub(r"[^\w\- ]", "", text)
    return text.replace(" ", "-")


def split_cells(row: str) -> list[str]:
    row = RE_CODE_SPAN.sub(lambda m: "x" * len(m.group(0)), row)
    row = row.replace("\\|", "x").strip()
    if row.startswith("|"):
        row = row[1:]
    if row.endswith("|"):
        row = row[:-1]
    return row.split("|")


ANCHOR_CACHE: dict[Path, set[str]] = {}
FILE_LINKS: list[tuple[Path, int, str, str]] = []


def anchors_of(path: Path) -> set[str]:
    """读取某个文件可被链接的锚点（检查子集文件时，被链接的文件可能尚未解析）。"""
    if path not in ANCHOR_CACHE:
        check_file(path, Report(), record_links=False)
    return ANCHOR_CACHE[path]


def check_file_links(report: Report) -> None:
    for source, lineno, target, anchor in FILE_LINKS:
        resolved = (source.parent / unquote(target)).resolve()
        if not resolved.exists():
            report.add(source, lineno, "E106", f"链接的文件不存在：{target}")
        elif anchor and resolved.suffix == ".md" and unquote(anchor) not in anchors_of(resolved):
            report.add(source, lineno, "E106", f"{target} 中没有锚点 #{anchor}")


def check_file(path: Path, report: Report, record_links: bool = True) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    anchors: set[str] = set()
    ANCHOR_CACHE[path] = anchors
    slug_counts: dict[str, int] = {}
    links: list[tuple[int, str]] = []
    citations: list[tuple[int, str]] = []
    in_fence = False
    fence_marker = ""
    fence_line = 0
    table_cols = 0
    chapter = None
    section_expect: dict[tuple[int, int], int] = {}
    last_chapter: dict[int, int] = {}

    for lineno, raw in enumerate(lines, start=1):
        fence = RE_FENCE.match(raw)
        if fence:
            marker = fence.group(1)
            if not in_fence:
                in_fence, fence_marker, fence_line = True, marker[0] * 3, lineno
            elif marker.startswith(fence_marker):
                in_fence = False
            continue
        if in_fence:
            continue

        for match in RE_HTML_ANCHOR.finditer(raw):
            anchors.add(match.group(1))
        for match in RE_LINK_TARGET.finditer(raw):
            links.append((lineno, unquote(match.group(1) or match.group(2))))
        for match in RE_REF_CITE.finditer(raw):
            citations.append((lineno, match.group(1)))
        if record_links:
            for match in RE_FILE_LINK.finditer(raw):
                FILE_LINKS.append((path, lineno, match.group(1), match.group(2) or ""))

        heading = RE_HEADING.match(raw)
        if heading:
            level, title = len(heading.group(1)), heading.group(2)
            slug = github_slug(title)
            count = slug_counts.get(slug, 0)
            anchors.add(slug if count == 0 else f"{slug}-{count}")
            slug_counts[slug] = count + 1
            numbered = RE_NUMBERED_HEADING.match(title + " ")
            if numbered:
                major, minor = int(numbered.group(1)), numbered.group(2)
                if minor is None:
                    previous = last_chapter.get(level)
                    if previous is not None and major != previous + 1:
                        report.add(path, lineno, "W206", f"章编号 {major} 未紧接上一章 {previous}")
                    last_chapter[level] = major
                    chapter = major
                else:
                    minor_i = int(minor)
                    if chapter is not None and major != chapter:
                        report.add(path, lineno, "W206", f"小节 {major}.{minor} 不属于当前第 {chapter} 章")
                    key = (level, major)
                    expected = section_expect.get(key, 1)
                    if minor_i != expected:
                        report.add(path, lineno, "W206", f"小节 {major}.{minor} 应为 {major}.{expected}")
                    section_expect[key] = minor_i + 1

        stripped = raw.strip()
        if stripped.startswith("|"):
            if table_cols == 0 and lineno < len(lines) and RE_TABLE_DELIM.match(lines[lineno]):
                table_cols = len(split_cells(stripped))
            elif table_cols and not RE_TABLE_DELIM.match(stripped):
                cols = len(split_cells(stripped))
                if cols != table_cols:
                    report.add(path, lineno, "E103", f"表格本行 {cols} 列，表头 {table_cols} 列")
        else:
            table_cols = 0

        visible = mask_inline(raw)
        check_emphasis(path, lineno, visible, report)

        if not RE_TABLE_DELIM.match(stripped):
            for match in RE_HAN_SPACE_HAN.finditer(visible):
                report.add(path, lineno, "W202", f"汉字间有半角空格：“{match.group(0)}”")
            for match in RE_HAN_ASCII_PUNCT.finditer(visible):
                report.add(path, lineno, "W203", f"汉字旁使用半角标点：“{match.group(0)}”")
        for left, right in PAIRS:
            if visible.count(left) != visible.count(right):
                report.add(path, lineno, "W204", f"“{left}{right}”在本行不成对")
        for phrase in ARTIFACT_PHRASES:
            if phrase in visible:
                report.add(path, lineno, "W205", f"疑似对话残留：“{phrase}”")
        for match in RE_DUP_WORD.finditer(visible):
            report.add(path, lineno, "W207", f"疑似重复字词：“{match.group(0)}”")

    if in_fence:
        report.add(path, fence_line, "E105", "代码块围栏没有闭合")

    check_with_cmark(path, lines, report)

    for lineno, target in links:
        if target not in anchors:
            report.add(path, lineno, "E102", f"页内链接 #{target} 没有对应锚点")

    defined = [a for a in anchors if a.startswith("ref-")]
    cited_once: list[str] = []
    for _, target in citations:
        if target not in cited_once:
            cited_once.append(target)
    for ref in sorted(defined):
        if ref not in cited_once:
            report.add(path, 1, "E104", f"参考资料 #{ref} 已定义但正文从未引用")
    numbered = [c for c in cited_once if re.search(r"\d+$", c)]
    if numbered != sorted(numbered, key=lambda c: (re.sub(r"\d+$", "", c), int(re.search(r"\d+$", c).group(0)))):
        report.add(path, 1, "W201", "参考资料首次引用顺序：" + " ".join(c.removeprefix("ref-") for c in numbered))


def check_with_cmark(path: Path, lines: list[str], report: Report) -> None:
    """用 GitHub 的渲染库复核：渲染后的正文里不应残留成对的 **。"""
    try:
        import cmarkgfm  # type: ignore
    except ImportError:
        return
    html = cmarkgfm.github_flavored_markdown_to_html("\n".join(lines))
    html = re.sub(r"<pre>.*?</pre>|<code>.*?</code>", "", html, flags=re.S)
    text = re.sub(r"<[^>]+>", "\n", html)
    for fragment in re.findall(r"\*\*[^*\n]{1,40}\*\*", text):
        needle = fragment.strip("*")
        lineno = next((i for i, line in enumerate(lines, 1) if needle in line), 1)
        report.add(path, lineno, "E101", f"GitHub 渲染后仍显示星号：{fragment}")


def collect(paths: list[str]) -> list[Path]:
    if paths:
        return [Path(p).resolve() for p in paths]
    files = []
    for path in sorted(ROOT.rglob("*.md")):
        if not any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            files.append(path)
    return files


def main(argv: list[str]) -> int:
    strict = "--strict" in argv
    files = collect([a for a in argv if not a.startswith("--")])
    report = Report()
    for path in files:
        check_file(path, report)
    check_file_links(report)
    errors = [i for i in report.issues if i.code.startswith("E")]
    warnings = [i for i in report.issues if i.code.startswith("W")]
    for issue in sorted(report.issues, key=lambda i: (str(i.path), i.line, i.code)):
        print(issue.render())
    print(f"\n检查 {len(files)} 个文件：{len(errors)} 个错误，{len(warnings)} 个提示。")
    return 1 if errors or (strict and warnings) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
