<?php

namespace Drupal\ictv_common\Types;

enum JobType: string {
   case proposal_validation = "proposal_validation";
   case sequence_search = "sequence_search";
}
