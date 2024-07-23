<?php

namespace Drupal\ictv_d3_taxonomy_visualization\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class PdfExportController extends ControllerBase
{

  public function export(Request $request)
  {

  // Extract the SVG data from the request.
  $svg = $request->get('svg');

  // tmp directory
  $tempDir = '/tmp';

  // Set the HOME environment variable to the temporary directory.
  // putenv('HOME=' . $tempDir);

  // Save the SVG data to a temporary file.
  $svgTempFile = tempnam($tempDir, 'svg');
  file_put_contents($svgTempFile, $svg);

  // Create a new SvgSanitizer instance and sanitize the SVG file.
  $sanitizer = new SvgSanitizer();
  $sanitizer->load($svgTempFile);
  $sanitizer->sanitize();

  // Get the sanitized SVG data.
  $sanitizedSvg = $sanitizer->saveSVG();

  // Overwrite the original SVG file with the sanitized SVG data.
  file_put_contents($svgTempFile, $sanitizedSvg);

  // Generate a temporary file name for the PDF, and append the .pdf extension.
  $pdfTempFile = tempnam($tempDir, 'pdf');
  $pdfFile = $pdfTempFile . '.pdf';

  // Call Inkscape to convert the SVG file to a PDF file.
  exec("inkscape -y 0 $svgTempFile -o $pdfFile");

  // Read the PDF file.
  $pdf = file_get_contents($pdfFile);

  // Delete the temporary files.
  unlink($svgTempFile);
  unlink($pdfTempFile);
  unlink($pdfFile);

  // Create a response and set the PDF as its content.
  $response = new Response($pdf);

  // Set the Content-Type and Content-Disposition headers to force the browser to download the PDF.
  $response->headers->set('Content-Type', 'application/pdf');
  $response->headers->set('Content-Disposition', 'attachment; filename="export.pdf"');

  return $response;
  }

}