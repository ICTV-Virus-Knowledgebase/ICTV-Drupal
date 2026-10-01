# Report chapter tools

Three independently runnable tools share the models in `models/` and the helpers
in `utils.py`. Run the commands below from the repository's `scripts` directory
with Python 3.10 or newer.

```bash
python3 -m pip install -r report_chapter_tools/requirements.txt

python3 -m report_chapter_tools.parser --db_name ICTV_DATABASE --username USER > chapters.json
python3 -m report_chapter_tools.consumer chapters.json --dry-run
python3 -m report_chapter_tools.consumer chapters.json --db_name TARGET_DATABASE --username USER
python3 -m report_chapter_tools.image_processor chapters.json --dry-run
python3 -m report_chapter_tools.image_processor chapters.json --image_path . --image_file_host https://ictv.global
```

Each tool has its own `__main__.py`, argument parser, and `--help`. The parser
prints JSON to standard output. The consumer imports JSON into MariaDB. The image
processor downloads images from JSON without connecting to a database.
Database commands prompt for a password when one is not supplied.

See the [parser documentation](parser/README.md) for database requirements and
the [consumer documentation](consumer/README.md) for schema setup and import behavior.
The parser currently uses a Linux Unix socket configured in `parser/__main__.py`.

The image processor requires an existing `--image_path` directory and an HTTP(S)
`--image_file_host` URL prefix unless using `--dry-run`. It saves files under
`images/<taxon_name>/` beneath that directory. It groups node-level `images` by
taxon, skips private/file sources, downloads repeated URLs once per taxon, and
adds numeric suffixes for filename collisions. Existing destination files are
replaced only after a download succeeds. A failed download stops processing that
taxon's remaining images; other taxa continue, and the command exits nonzero.

The former `report_chapter_parser`, `report_chapter_consumer`, and
`report_chapter_image_processor` package commands are replaced by the dotted
commands above. Python imports use the new package paths, for example:

```python
from report_chapter_tools.models.image import Image
from report_chapter_tools.models.search_result import SearchResult
from report_chapter_tools.parser.parser import ReportChapterParser
from report_chapter_tools.consumer.consumer import import_results
from report_chapter_tools.image_processor.processor import process_images
```

Run the offline test suites from `scripts`:

```bash
python3 -m unittest report_chapter_tools.parser.test_report_chapter_parser report_chapter_tools.consumer.test_report_chapter_consumer report_chapter_tools.image_processor.test_image_downloads -v
```

`parser/test_db_connection.py` is a separate manual database diagnostic, not part
of the offline suites.
