<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


enum JobStatus {
    case complete;
    case failed;
    case pending;
    case running;
};