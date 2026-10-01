"""Exercise insertion and rollback against an in-memory relational database.

SQLite accepts the same parameter placeholders; this adapter supplies the
MariaDB cursor context manager. These tests do not validate MariaDB DDL.
"""

from pathlib import Path
import sqlite3
import unittest

from .consumer import import_results, read_results, validate_results


class Cursor:
    def __init__(self, connection):
        self.cursor = connection.cursor()

    def __enter__(self):
        return self.cursor

    def __exit__(self, *args):
        self.cursor.close()


class Connection:
    def __init__(self):
        self.db = sqlite3.connect(":memory:")
        self.db.executescript("""
            PRAGMA foreign_keys = ON;
            CREATE TABLE report_chapter_node (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                html TEXT NOT NULL, node_id INTEGER NOT NULL,
                path_alias TEXT NOT NULL, taxon_name TEXT,
                imported_on TEXT DEFAULT CURRENT_TIMESTAMP, taxnode_id INTEGER
            );
            CREATE TABLE report_chapter_section (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                depth INTEGER NOT NULL, display_order INTEGER NOT NULL,
                heading TEXT, html TEXT,
                parent_section_id INTEGER REFERENCES report_chapter_section(id),
                rc_node_id INTEGER NOT NULL REFERENCES report_chapter_node(id)
            );
        """)

    def cursor(self):
        return Cursor(self.db)

    def commit(self):
        self.db.commit()

    def rollback(self):
        self.db.rollback()


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.connection = Connection()
        self.addCleanup(self.connection.db.close)

    def test_sample_preserves_every_value_and_relationship(self):
        filename = Path(__file__).resolve().parent / "fixtures" / "sample_chapters.json"
        results = read_results(filename)
        self.assertEqual(import_results(self.connection, results), (3, 6))
        db = self.connection.db
        nodes = db.execute(
            "SELECT id, html, node_id, path_alias, taxon_name, imported_on, taxnode_id "
            "FROM report_chapter_node ORDER BY id"
        ).fetchall()
        self.assertEqual(len(nodes), len(results))
        self.assertEqual(db.execute("SELECT COUNT(*) FROM report_chapter_section").fetchone()[0], 6)

        def check_sections(expected, node_id, parent_id, depth, next_order=1):
            rows = db.execute(
                "SELECT id, depth, display_order, heading, html FROM report_chapter_section "
                "WHERE rc_node_id = ? AND parent_section_id IS ? ORDER BY display_order",
                (node_id, parent_id),
            ).fetchall()
            self.assertEqual(len(rows), len(expected))
            for section, row in zip(expected, rows):
                self.assertEqual(row[1:], (depth, next_order, section["heading"], section["html"]))
                next_order = check_sections(section["subheadings"], node_id, row[0], depth + 1, next_order + 1)
            return next_order

        for source, row in zip(results, nodes):
            self.assertEqual(row[1:5], (source["html"], source["node_id"], source["path_alias"], source["taxon_name"]))
            self.assertIsNotNone(row[5])
            self.assertIsNone(row[6])
            check_sections(source["sections"], row[0], None, 0)

    def test_nested_sections_nulls_and_repeat_import(self):
        child = {"heading": "Quoted ' text 😀", "html": "<p>é</p>", "subheadings": []}
        root = {"heading": None, "html": None, "subheadings": [child]}
        results = [{"html": "", "node_id": 900, "path_alias": "/test", "sections": [root, child]}]
        self.assertEqual(import_results(self.connection, results), (1, 3))
        self.assertEqual(import_results(self.connection, results), (1, 3))
        rows = self.connection.db.execute(
            "SELECT depth, display_order, parent_section_id, rc_node_id FROM report_chapter_section ORDER BY id"
        ).fetchall()
        self.assertEqual(rows, [(0, 1, None, 1), (1, 2, 1, 1), (0, 3, None, 1),
                                (0, 1, None, 2), (1, 2, 4, 2), (0, 3, None, 2)])

    def test_display_order_traverses_whole_tree_and_resets_per_node(self):
        def section(heading, children=None):
            return {"heading": heading, "html": "", "subheadings": children or []}

        trees = [
            [section('A', [section('B'), section('C')]), section('D')],
            [section('A', [section('B', [section('C')]), section('D')]), section('E')],
        ]
        results = [{"html": "", "node_id": index, "path_alias": "/test", "sections": tree}
                   for index, tree in enumerate(trees)]
        import_results(self.connection, results)
        rows = self.connection.db.execute(
            "SELECT heading, display_order, depth FROM report_chapter_section "
            "ORDER BY rc_node_id, display_order"
        ).fetchall()
        self.assertEqual(rows, [
            ('A', 1, 0), ('B', 2, 1), ('C', 3, 1), ('D', 4, 0),
            ('A', 1, 0), ('B', 2, 1), ('C', 3, 2), ('D', 4, 1), ('E', 5, 0),
        ])

    def test_insert_failure_rolls_back_entire_file(self):
        self.connection.db.executescript("""
            CREATE TRIGGER fail_section BEFORE INSERT ON report_chapter_section
            WHEN NEW.heading = 'fail' BEGIN SELECT RAISE(ABORT, 'test failure'); END;
        """)
        first = {"html": "", "node_id": 1, "path_alias": "/a", "sections": []}
        second = dict(first, sections=[{"heading": "fail", "html": "", "subheadings": []}])
        with self.assertRaises(sqlite3.IntegrityError):
            import_results(self.connection, [first, second])
        self.assertEqual(self.connection.db.execute("SELECT COUNT(*) FROM report_chapter_node").fetchone()[0], 0)

    def test_validation_limits_and_malformed_input(self):
        valid = {"html": "", "node_id": 1, "path_alias": "/a", "sections": []}
        for changes in ({"path_alias": "x" * 201},
                        {"taxon_name": "x" * 101}, {"node_id": True},
                        {"sections": None}, {"html": None},
                        {"sections": [{"heading": "x" * 501, "subheadings": []}]}):
            with self.subTest(changes=list(changes)):
                with self.assertRaises(ValueError):
                    validate_results([dict(valid, **changes)])
        self.assertEqual(validate_results([]), (0, 0))

    def test_large_node_and_section_html_are_preserved(self):
        # Four-byte characters exceed the old TEXT byte limit even when the
        # character count is smaller. Both HTML columns now use LONGTEXT.
        html = "\U0001f600" * 16384
        self.assertEqual(len(html.encode("utf-8")), 65536)
        results = [{
            "html": html, "node_id": 904, "path_alias": "/large-chapter",
            "sections": [{"heading": "Large section", "html": html, "subheadings": []}],
        }]
        self.assertEqual(validate_results(results), (1, 1))
        self.assertEqual(import_results(self.connection, results), (1, 1))
        db = self.connection.db
        self.assertEqual(db.execute("SELECT html FROM report_chapter_node").fetchone()[0], html)
        self.assertEqual(db.execute("SELECT html FROM report_chapter_section").fetchone()[0], html)


if __name__ == "__main__":
    unittest.main()
