# Report chapter consumer

Import the JSON array produced by `report_chapter_tools.parser` into MariaDB.
Requires Python 3.10+ and the MariaDB Python connector.

From the repository root, install the dependency and create the tables in your
chosen database (the SQL can also be run in a database GUI):

```bash
python -m pip install -r scripts/report_chapter_tools/consumer/requirements.txt
mariadb --user=YOUR_USERNAME --password YOUR_DATABASE --execute="SOURCE scripts/report_chapter_tools/consumer/schema.sql"
```

The schema adds foreign keys for the parent section and containing node. It does
not create or select a database. Run it once before importing.

Run the module from `scripts`:

```bash
cd scripts
python3 -m report_chapter_tools.consumer report_chapter_tools/consumer/fixtures/sample_chapters.json --dry-run
python3 -m report_chapter_tools.consumer chapters.json --db_name YOUR_DATABASE --username YOUR_USERNAME
```

The importer prompts for a password. You may also pass `--password`.
Download images separately using [`report_chapter_tools.image_processor`](../README.md).
TCP options are `--hostname` (default `localhost`) and `--port` (default `3306`).
For the Linux socket used by the parser, add
`--unix_socket /run/mysqld/mysqld.sock`.
Use `--help` for all options. `--dry-run` validates input without requiring
credentials or a database connection.

Each SearchResult inserts one node containing its original `html`, `node_id`,
`path_alias`, and `taxon_name`. The database generates `id` and `imported_on`;
`taxnode_id` remains NULL because no mapping was provided.

Each section inserts its `heading` and `html` without trimming or transforming
them. Top-level sections have depth 0 and NULL `parent_section_id`; subsections
increase depth by 1 and reference their parent's generated section ID.
`display_order` starts at 1 for each node and follows depth-first preorder:
each section comes before its descendants, with numbering continuing across
top-level sections. For example, A with children B and C, followed by D, has
display orders A = 1, B = 2, C = 3, D = 4. All descendants use the
containing node's generated ID for `rc_node_id`, not the Drupal `node_id`.
Missing nullable text fields become NULL; empty strings stay empty strings.
`sections` and `subheadings` must be arrays, including when empty.

The file is validated before connecting. Inserts use parameters and one
transaction; an insert failure rolls back the entire file. Re-running an import
appends new nodes and sections, including duplicates. Existing rows are not
updated. Use a dedicated connection if calling `import_results` from Python.

The supplied schema declares both node and section `html` as LONGTEXT. The
Python validator accepts HTML larger than the former 65,535-byte TEXT limit.
Large chapters may require a higher server `max_allowed_packet` setting.

Run tests from `scripts`:

```bash
python -m unittest report_chapter_tools.consumer.test_report_chapter_consumer -v
python -m unittest report_chapter_tools.image_processor.test_image_downloads -v
```

The bundled [sample fixture](fixtures/sample_chapters.json) contains synthetic
data: three nodes and six sections, including nested sections, Unicode, null
values, and empty content. It replaces the unavailable historical export.

Tests use SQLite with an adapter to verify the sample's values and hierarchy,
NULL handling, repeated imports, validation, transaction rollback, and preservation
of node and section HTML exceeding 65,535 UTF-8 bytes. They do not test the
MariaDB schema or a live MariaDB connection.
