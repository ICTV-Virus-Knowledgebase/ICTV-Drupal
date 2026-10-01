# Report chapter parser

Read ICTV report chapter HTML from a Drupal database and output JSON containing
each page's metadata, HTML, and hierarchy of sections and subsections.

## Requirements

- Python 3.10 or newer (the code uses `X | None` type annotations).
- Python dependencies listed in [`requirements.txt`](./requirements.txt),
  including Beautiful Soup (`beautifulsoup4`, imported as `bs4`) and `mariadb`.
- Access to the Drupal database, including the `node`, `node__field_mt_srv_body`,
  and `path_alias` tables.

The current database connection uses the Linux Unix socket
`/run/mysqld/mysqld.sock`. Run on a machine where that socket is available.
For another socket location, change `unix_socket` in `__main__.py`.
Hostname and port options are available, but the configured Unix socket takes precedence.

## Install on Linux

From the repository root:

```bash
cd scripts
python3 -m venv .your_venv_name
source .your_venv_name/bin/activate
python -m pip install -r report_chapter_tools/requirements.txt
```

If you already have a virtual environment, activate it instead of creating a new
one. Use `python -m pip` so installation uses the same interpreter as execution.
If installation of `mariadb` reports missing build tools or Connector/C, install
the compiler, Python development headers, and MariaDB Connector/C development
packages for your Linux distribution, then retry.

Verify the imports:

```bash
python -c "import sys, bs4, mariadb; print(sys.executable); print(bs4.__file__)"
```

## Run

Run from the `scripts` directory (the parent of `report_chapter_tools`), with
the virtual environment activated:

```bash
python -m report_chapter_tools.parser --db_name YOUR_DATABASE --username YOUR_USERNAME --taxon_name /poxviridae
```

Replace the database and username placeholders with your database credentials.
The program prompts for the password when `--password` is omitted.

| Argument | Required | Meaning |
| --- | --- | --- |
| `--db_name` | Yes | Drupal database name. |
| `--username` | Yes | Database username. |
| `--taxon_name` | Yes | Text to match within a report chapter's URL alias. |
| `--password` | No | Database password; prompts if omitted. |

The query matches URL aliases using SQL `LIKE '%<taxon_name>%'`. For example,
`/poxviridae/poxviridae` targets the Family chapter, while `/poxviridae` also
matches chapters beneath that family. This is substring matching, not an exact
taxon-name lookup. SQL wildcard characters `%` and `_` retain their meaning.

Only aliases beginning with `/report/chapter/` are included. Pages ending in
`/authors`, `/citation`, `/references`, or `/resources` are excluded. Ninth-report
pages are not included.

Save JSON output to a file:

```bash
python -m report_chapter_tools.parser --db_name YOUR_DATABASE --username YOUR_USERNAME --taxon_name /poxviridae > results.json
```

Show command-line help:

```bash
python -m report_chapter_tools.parser --help
```

Use `-m report_chapter_tools.parser` rather than running `__main__.py` directly, so
Python resolves the package's relative imports.

## Output and parsing rules

Output is a JSON array ordered by URL alias. Each result contains `node_id`,
`html`, `path_alias`, `taxon_name`, and `sections`. No matching pages produces
an empty array (`[]`). Each section contains:

- `heading`: the heading text.
- `html`: content belonging directly to this section.
- `subheadings`: an ordered list of sections with the same structure.

Headings `h1` through `h8` define the hierarchy. A heading belongs to the nearest
preceding heading with a lower number; skipped levels are allowed. Duplicate
titles and empty sections are preserved. Content belongs to the most recently
opened section.

Content before the first heading creates an Introduction section, treated as
an implicit `h2`. Initial `h3` through `h8` headings also create an Introduction
and become its subsections. An `h1` or `h2` starts a real top-level section.
Whitespace alone does not create an Introduction.

Headings inside `td` or `div` ancestors are treated as ordinary HTML content by
default. Their enclosing markup and heading tags are preserved in the current
section's `html` (or Introduction before a section exists). They do not create
sections. The ancestor check includes all levels, so it also handles
`<table><tr><td><section><h2>...</h2></section></td></tr></table>`.

Configure this behavior when creating the parser, including in `__main__.py`
when using the command-line entry point:

```python
parser = ReportChapterParser(ignored_heading_wrappers=['td', 'div'])
```

The supplied list replaces the defaults; pass `[]` to reject all wrapped
headings. A heading without a configured wrapper ancestor must be a direct
child of the fragment's root, otherwise it raises `ValueError` identifying the
page and heading. Ordinary nested content is retained.

## Troubleshooting

**`No module named bs4`**: check which interpreter is running and whether the
dependency is installed in that environment:

```bash
echo "$VIRTUAL_ENV"
type -a python python3
python -m pip show beautifulsoup4
```

With an activated virtual environment, you can bypass shell aliases explicitly:

```bash
"$VIRTUAL_ENV/bin/python" -m pip install -r report_chapter_tools/requirements.txt
"$VIRTUAL_ENV/bin/python" -m report_chapter_tools.parser --help
```

**`No module named report_chapter_tools`**: change into the repository's
`scripts` directory before running the command.

**Database connection failure**: confirm the database name, credentials, and
Unix socket path. The current connection does not use TCP hostname/port settings.

## Tests

From `scripts`, with dependencies installed:

```bash
python -m unittest report_chapter_tools.parser.test_report_chapter_parser -v
```

These tests exercise HTML parsing and serialization without connecting to a database.
