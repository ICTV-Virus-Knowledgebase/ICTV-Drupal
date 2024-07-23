<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


enum JobStatus: string {
   case crashed = "crashed";
   case invalid = "invalid";
   case pending = "pending";
   case valid = "valid";
}