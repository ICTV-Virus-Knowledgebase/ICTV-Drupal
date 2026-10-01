import unittest

from .parser import ReportChapterParser
from ..models.search_result import SearchResult


class ReportChapterParserTests(unittest.TestCase):
   def parse(self, html):
      result = SearchResult(html, 1, "/report/chapter/example")
      ReportChapterParser().process_search_result(result)
      return result

   def test_introduction_and_duplicate_subheadings(self):
      result = self.parse(
         '<p>Intro</p><h4>Details</h4><p>First</p>'
         '<h4>Details</h4><p>Second</p><h2>Main</h2><p>Body</p>'
      )
      intro, main = result.sections
      self.assertEqual(intro.heading, "Introduction")
      self.assertEqual(intro.html, '<p>Intro</p>')
      self.assertEqual([s.heading for s in intro.subheadings], ['Details', 'Details'])
      self.assertEqual([s.html for s in intro.subheadings], ['<p>First</p>', '<p>Second</p>'])
      self.assertEqual(main.heading, 'Main')
      self.assertEqual(main.html, '<p>Body</p>')

   def test_all_heading_levels_and_return_to_ancestors(self):
      result = self.parse(
         '<h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4>'
         '<h5>Five</h5><h6>Six</h6><p>Deep</p>'
         '<h3>Next three</h3><p>Middle</p><h1>Next one</h1>'
      )
      section = result.sections[0]
      for title in ['One', 'Two', 'Three', 'Four', 'Five']:
         self.assertEqual(section.heading, title)
         self.assertEqual(section.html, '')
         section = section.subheadings[0]
      self.assertEqual(section.heading, 'Six')
      self.assertEqual(section.html, '<p>Deep</p>')
      middle = result.sections[0].subheadings[0].subheadings[1]
      self.assertEqual(middle.heading, 'Next three')
      self.assertEqual(middle.html, '<p>Middle</p>')
      self.assertEqual(result.sections[1].heading, 'Next one')
      self.assertEqual(result.sections[1].html, '')

   def test_skipped_levels_and_final_subsection_serialize(self):
      result = self.parse('<h2>Main</h2><h4>Sub <em>title</em></h4><p>Final</p>')
      self.assertEqual(result.to_dict()['sections'], [{
         'heading': 'Main', 'html': '', 'subheadings': [{
            'heading': 'Sub title', 'html': '<p>Final</p>', 'subheadings': []
         }]
      }])

   def test_initial_subheading_creates_introduction(self):
      result = self.parse('<h4>First</h4><h1>Main</h1>')
      self.assertEqual([s.heading for s in result.sections], ['Introduction', 'Main'])
      self.assertEqual(result.sections[0].subheadings[0].heading, 'First')

   def test_nested_content_and_text_preserve_markup(self):
      html = '<div><ul><li>A &amp; B</li></ul></div> &lt;literal&gt;'
      result = self.parse('<h2>Main</h2>' + html)
      self.assertEqual(result.sections[0].html, html)

   def test_nested_heading_is_rejected_without_partial_results(self):
      result = self.parse('<h2>Original</h2>')
      original_sections = result.sections
      result.html = '<h2>Valid</h2><article><section><h4>Nested</h4></section></article>'
      with self.assertRaisesRegex(ValueError, r'example.*h4.*Nested.*section'):
         ReportChapterParser().process_search_result(result)
      self.assertIs(result.sections, original_sections)

   def test_ignored_wrappers_preserve_all_heading_levels_as_content(self):
      for level in range(1, 9):
         for wrapper in ['td', 'div']:
            with self.subTest(level=level, wrapper=wrapper):
               content = f'<{wrapper}><section><h{level}>Embedded</h{level}></section></{wrapper}>'
               if wrapper == 'td':
                  content = '<table><tr>' + content + '</tr></table>'
               result = self.parse('<h2>Main</h2>' + content + '<h4>Real subsection</h4>')
               main = result.sections[0]
               self.assertEqual(main.html, content)
               self.assertEqual([s.heading for s in main.subheadings], ['Real subsection'])

   def test_ignored_heading_before_first_section_stays_in_introduction(self):
      content = '<div><h2>Embedded</h2><p>Content</p></div>'
      result = self.parse(content + '<h2>Main</h2>')
      self.assertEqual(result.sections[0].heading, 'Introduction')
      self.assertEqual(result.sections[0].html, content)
      self.assertEqual(result.sections[0].subheadings, [])
      self.assertEqual(result.sections[1].heading, 'Main')

   def test_wrapper_configuration_and_strict_mode(self):
      result = SearchResult('<article><h2>Embedded</h2></article>', 1, '/example')
      ReportChapterParser(ignored_heading_wrappers=['ARTICLE']).process_search_result(result)
      self.assertEqual(result.sections[0].html, result.html)
      result.html = '<div><h2>Embedded</h2></div>'
      for wrappers in [[], ['article']]:
         with self.subTest(wrappers=wrappers):
            with self.assertRaises(ValueError):
               ReportChapterParser(ignored_heading_wrappers=wrappers).process_search_result(result)

   def test_top_level_h7_and_h8_form_subsections(self):
      result = self.parse('<h2>Main</h2><h7>Seven</h7><h8>Eight</h8><p>Content</p>')
      seven = result.sections[0].subheadings[0]
      self.assertEqual(seven.heading, 'Seven')
      self.assertEqual(seven.subheadings[0].heading, 'Eight')
      self.assertEqual(seven.subheadings[0].html, '<p>Content</p>')

   def test_empty_input_and_reprocessing_replace_sections(self):
      parser = ReportChapterParser()
      result = self.parse('<h2>Main</h2>')
      parser.process_search_result(result)
      self.assertEqual(len(result.sections), 1)
      result.html = ' \n<!-- comment -->'
      parser.process_search_result(result)
      self.assertEqual(result.sections, [])
      result.html = ''
      parser.process_search_result(result)
      self.assertEqual(result.sections, [])


if __name__ == '__main__':
   unittest.main()
