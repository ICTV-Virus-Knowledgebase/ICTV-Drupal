<?php

namespace Drupal\ictv_common\Types;

enum JobStatus: string {
   case crashed = "crashed";
   case invalid = "invalid";
   case pending = "pending";
   case valid = "valid";
}