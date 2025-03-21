<?php

namespace Drupal\ictv_common\Types;

enum JobStatus: string {
   case complete = "complete";
   case crashed = "crashed";
   case error = "error";
   case invalid = "invalid";
   case pending = "pending";
   case valid = "valid";
}