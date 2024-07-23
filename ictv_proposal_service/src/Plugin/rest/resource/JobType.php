<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


enum JobType: string {
   case proposal_validation = "proposal_validation";
   case sequence_classification = "sequence_classification";
}
