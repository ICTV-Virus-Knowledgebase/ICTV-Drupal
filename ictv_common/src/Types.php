<?php

namespace Drupal\ictv_common;


enum JobStatus: string {
   case crashed = "crashed";
   case invalid = "invalid";
   case pending = "pending";
   case valid = "valid";
}

enum JobType: string {
   case proposal_validation = "proposal_validation";
   case sequence_classification = "sequence_classification";
}
