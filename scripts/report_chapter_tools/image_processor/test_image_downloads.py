"""Verify image collection and downloads without a live HTTP or database server."""

from io import BytesIO, StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from ..models.image import Image
from . import __main__ as cli
from .processor import download_images, process_images, validate_results


class ImageDownloadTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.parent = Path(self.temp.name)

    def image(self, src):
        return Image('Caption', 'file', 20, src, 30)

    def node(self, **changes):
        return dict({'html': '', 'node_id': 1, 'path_alias': '/example',
                     'taxon_name': 'Example', 'sections': []}, **changes)

    @patch(f'{__package__}.processor.urlopen')
    def test_process_groups_taxon_images_and_ignores_private_images(self, open_url):
        open_url.side_effect = [BytesIO(b'first image'), BytesIO(b'second image')]
        results = [self.node(images=[self.image('/files/first.png').to_dict()]),
                   self.node(images=[self.image('files/second.png').to_dict()]),
                   self.node(images=None, private_images=[{'src': 'private://secret.png'}]),
                   self.node(images=[]), self.node()]
        errors, _ = process_images(results, self.parent, 'https://example.org/')
        self.assertEqual(errors, [])
        directory = self.parent / 'images' / 'Example'
        self.assertEqual((directory / 'first.png').read_bytes(), b'first image')
        self.assertEqual((directory / 'second.png').read_bytes(), b'second image')
        self.assertEqual([call.args[0].full_url for call in open_url.call_args_list],
                         ['https://example.org/files/first.png', 'https://example.org/files/second.png'])
        for call in open_url.call_args_list:
            self.assertEqual(call.args[0].get_header('User-agent'), 'ICTV-ReportChapterConsumer/1.0')
            self.assertEqual(call.kwargs['timeout'], 30)

    @patch(f'{__package__}.processor.urlopen')
    def test_names_queries_duplicates_and_collisions(self, open_url):
        open_url.side_effect = [BytesIO(b'one'), BytesIO(b'two')]
        images = [self.image('/a/figure%201.png?download=1'),
                  self.image('/a/figure%201.png?download=1'),
                  self.image('/b/figure%201.png'), self.image('private://secret.png')]
        download_images('Example', images, self.parent, 'https://example.org/prefix/')
        directory = self.parent / 'images' / 'Example'
        self.assertEqual((directory / 'figure 1.png').read_bytes(), b'one')
        self.assertEqual((directory / 'figure 1_2.png').read_bytes(), b'two')
        self.assertEqual(open_url.call_count, 2)
        self.assertEqual(open_url.call_args_list[0].args[0].full_url,
                         'https://example.org/prefix/a/figure%201.png?download=1')

    def test_invalid_configuration_fails_before_downloading(self):
        for parent, host in [(self.parent / 'missing', 'https://example.org'),
                             (self.parent, 'file:///tmp'), (self.parent, None)]:
            with self.subTest(parent=parent, host=host), self.assertRaises(ValueError):
                process_images([self.node()], parent, host)

    def test_invalid_image_input_fails_validation(self):
        image = self.image('/figure.png').to_dict()
        for changes in [{'images': {}}, {'images': [None]}, {'images': [{}]},
                        {'images': [image], 'taxon_name': '../escape'},
                        {'images': [image], 'taxon_name': None},
                        {'images': [dict(image, src='/files/%2Fescape.png')]}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                validate_results([self.node(**changes)])

    @patch(f'{__package__}.processor.urlopen')
    def test_failed_download_leaves_existing_file_and_no_temporary_file(self, open_url):
        directory = self.parent / 'images' / 'Example'
        directory.mkdir(parents=True)
        (directory / 'figure.png').write_bytes(b'original')
        response = BytesIO(b'partial')
        open_url.return_value = response
        with patch(f'{__package__}.processor.shutil.copyfileobj',
                   side_effect=OSError('connection interrupted')):
            with self.assertRaisesRegex(OSError, 'Image download failed for Example'):
                download_images('Example', [self.image('/figure.png')],
                                self.parent, 'https://example.org')
        self.assertEqual((directory / 'figure.png').read_bytes(), b'original')
        self.assertEqual(list(directory.iterdir()), [directory / 'figure.png'])

    def test_cli_passes_image_arguments_to_processor(self):
        arguments = ['input.json', '--image_path', str(self.parent),
                     '--image_file_host', 'https://example.org']
        with patch('sys.stdout', new_callable=StringIO), \
             patch.object(cli, 'read_results', return_value=[]), \
             patch.object(cli, 'process_images', return_value=([], 0)) as processor:
            self.assertEqual(cli.main(arguments), 0)
            processor.assert_called_once_with([], str(self.parent), 'https://example.org')

    def test_cli_dry_run_needs_no_image_options_or_downloads(self):
        with patch('sys.stdout', new_callable=StringIO), \
             patch.object(cli, 'read_results', return_value=[]), \
             patch.object(cli, 'process_images') as processor:
            self.assertEqual(cli.main(['input.json', '--dry-run']), 0)
            processor.assert_not_called()

    def test_cli_checks_parent_directory_before_downloading(self):
        arguments = ['input.json', '--image_path', str(self.parent / 'missing'),
                     '--image_file_host', 'https://example.org']
        with patch('sys.stderr', new_callable=StringIO), \
             patch.object(cli, 'read_results', return_value=[]), \
             patch(f'{__package__}.processor.urlopen') as open_url:
            self.assertEqual(cli.main(arguments), 1)
            open_url.assert_not_called()


if __name__ == '__main__':
    unittest.main()
