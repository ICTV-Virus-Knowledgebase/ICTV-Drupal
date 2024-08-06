<?php

namespace Drupal\ictv_sequence_classifier_service\Plugin\rest\resource;


// The result status of a sequence classification.
enum ResultStatus: string {
   case classified = "CLASSIFIED";
   case failed = "FAILED";
}