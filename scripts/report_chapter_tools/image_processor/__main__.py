"""Command-line entry point: python -m report_chapter_tools.image_processor."""

import argparse
import sys

from .processor import process_images, read_results, validate_results


def main(argv=None):
   parser = argparse.ArgumentParser(description="Download image files found in report_chapter_tools.parser JSON.")
   parser.add_argument("filename", help="Input JSON file")
   parser.add_argument("--image_path", help="Existing parent directory for images/<taxon_name> (required unless --dry-run)")
   parser.add_argument("--image_file_host", help="HTTP(S) URL prefix for image sources (required unless --dry-run)")
   parser.add_argument("--dry-run", action="store_true", help="Validate JSON and show counts without connecting")
   args = parser.parse_args(argv)
   if not args.dry_run and (not args.image_path or not args.image_file_host):
      parser.error("--image_path and --image_file_host are required unless --dry-run is used")

   try:
      results = read_results(args.filename)
      
      if args.dry_run:
         validate_results(results)
         print("Input nodes are valid.\n")
         return 0

      # Validate images and attempt to download them.
      errors, image_count = process_images(results, args.image_path, args.image_file_host)

      for error in errors:
         sys.stderr.write(f"Error: {error}\n")

      print(f"Downloaded {image_count} image(s) with {len(errors)} error(s)\n")
      
      if len(errors) > 0:
         return 1
      return 0

   except Exception as e:
      sys.stderr.write(f"Error: {e}\n")
      return 1


if __name__ == "__main__":
    sys.exit(main())
