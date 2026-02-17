<?php

namespace Drupal\ictv_taxablast_service\Plugin\rest\resource;

enum ResultFileType: string {
   case asn = "asn";
   case csv = "csv";
   case fasta = "fasta";
   case html = "html";
   case stdout = "stdout";
   case stderr = "stderr";
}