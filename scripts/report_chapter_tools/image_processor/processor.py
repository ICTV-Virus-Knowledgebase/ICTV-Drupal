"""Validate parser output and download images."""

import json
from pathlib import Path
import shutil
import sys
from tempfile import NamedTemporaryFile
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen
from ..models.image import Image



def _path_component(value, location):
   """Require a single portable directory or file name."""
   _text(value, location)
   if (not value or value in (".", "..") or value.endswith((".", " "))
         or any(char in '<>:"/\\|?*' or ord(char) < 32 for char in value)
         or value.split('.')[0].upper() in
            {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)),
             *(f"LPT{i}" for i in range(1, 10))}):
      raise ValueError(f"{location}: expected a valid single file or directory name")
   return value


def _text(value, location, *, nullable=False, max_chars=None, max_bytes=None):
   if value is None and nullable:
      return
   if not isinstance(value, str):
      raise ValueError(f"{location}: expected a string" + (" or null" if nullable else ""))
   if max_chars is not None and len(value) > max_chars:
      raise ValueError(f"{location}: exceeds {max_chars} characters")
   if max_bytes is not None and len(value.encode("utf-8")) > max_bytes:
      raise ValueError(f"{location}: exceeds {max_bytes} UTF-8 bytes")


def download_images(taxon_name: str, images: list[Image], image_path, image_file_host: str|None):
   """Download public images into image_path/images/<taxon_name>."""

   if image_file_host is None:
      raise ValueError("image_file_host is required in download_images()")
   
   validate_image_options(image_path, image_file_host)

   directory = Path(image_path) / "images" / _path_component(taxon_name, "taxon_name")
   filenames = set()
   downloaded_urls = set()

   for image in images:
      if image.src.startswith("private://") or image.src.startswith("file://"):
         continue
      url = image_file_host.rstrip("/") + "/" + image.src.lstrip("/")
      if url in downloaded_urls:
         continue
      
      filename = _path_component(unquote(urlsplit(image.src).path.rsplit("/", 1)[-1]), "Image.src filename")
      
      # Different source paths can have the same basename within a taxon.
      candidate = filename
      suffix = 2
      while candidate.casefold() in filenames:
         candidate = f"{Path(filename).stem}_{suffix}{Path(filename).suffix}"
         suffix += 1
      filenames.add(candidate.casefold())
      destination = directory / candidate
      directory.mkdir(parents=True, exist_ok=True)
      temporary_path = None

      try:
         # ICTV's server rejects urllib's default Python User-Agent.
         request = Request(url, headers={"User-Agent": "ICTV-ReportChapterConsumer/1.0"})
         with urlopen(request, timeout=30) as response:
            with NamedTemporaryFile(dir=directory, delete=False) as output:
               temporary_path = Path(output.name)
               shutil.copyfileobj(response, output)

         temporary_path.replace(destination)

      except Exception as error:
         raise OSError(f"Image download failed for {taxon_name}: {url}: {error}") from error
      
      finally:
         if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
            
      downloaded_urls.add(url)


def process_images(results, image_path=None, image_file_host=None) -> tuple[list[str], int]:
   """ Process all Image objects in the results and try to download the files."""
   
   validate_results(results)

   if image_path is not None or image_file_host is not None or any(node.get("images") for node in results):
      validate_image_options(image_path, image_file_host)

   errors = []
   image_count = 0
   taxon_images: dict[str, list[Image]] = {}

   for node in results:
      try:
         if node.get("images"):
            images = [Image(**image) for image in node["images"]]
            taxon_images.setdefault(node["taxon_name"], []).extend(images)
      except Exception as ex:
         errors.append(f"Error in an image for {node.get('taxon_name')}:\n {str(ex)}")

   for taxon_name, images in taxon_images.items():
      try:
         download_images(taxon_name, images, image_path, image_file_host)
         image_count += 1
      except Exception as ie:
         errors.append(f"Error downloading an image for {taxon_name}:\n {str(ie)}")

   return errors, image_count


def read_results(filename: str):
   """Read UTF-8 JSON, accepting an optional byte-order mark."""
   with Path(filename).open(encoding="utf-8-sig") as source:
      results = json.load(source)
   validate_results(results)
   return results


def validate_image_options(image_path, image_file_host):
   """Check download configuration before proceeding."""

   if image_path is None or not Path(image_path).is_dir():
      raise ValueError("image_path must be an existing parent directory")
   host = urlsplit(image_file_host or "")
   if host.scheme not in ("http", "https") or not host.netloc or host.query or host.fragment:
      raise ValueError("image_file_host must be an HTTP(S) URL prefix without a query or fragment")


def validate_results(results):
   """Reject invalid input before processing images."""

   if not isinstance(results, list):
      raise ValueError("JSON root: expected a list of SearchResult objects")
   
   for index, node in enumerate(results):

      location = f"results[{index}]"
      if not isinstance(node, dict):
         raise ValueError(f"{location}: expected an object")
      
      node_id = node.get("node_id")
      if type(node_id) is not int or not -(2**31) <= node_id < 2**31:
         raise ValueError(f"{location}.node_id: expected a signed 32-bit integer")
      
      _text(node.get("taxon_name"), f"{location}.taxon_name", nullable=True, max_chars=100)

      images = node.get("images")
      if images is not None:
         if not isinstance(images, list):
            raise ValueError(f"{location}.images: expected a list or null")
         
         if images:
            _path_component(node.get("taxon_name"), f"{location}.taxon_name")

         for image_index, image in enumerate(images):
            image_location = f"{location}.images[{image_index}]"
            if not isinstance(image, dict):
               raise ValueError(f"{image_location}: expected an object")
            try:
               parsed_image = Image(**image)
            except TypeError as error:
               raise ValueError(f"{image_location}: {error}") from error
            _text(parsed_image.src, f"{image_location}.src")
            if not parsed_image.src.startswith("private://") and not parsed_image.src.startswith("file://"):
               _path_component(unquote(urlsplit(parsed_image.src).path.rsplit("/", 1)[-1]),
                               f"{image_location}.src filename")

