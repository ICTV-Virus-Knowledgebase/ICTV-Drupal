<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


class JobStatus {
    public static string $complete = "complete";
    public static string $failed = "failed";
    public static string $pending = "pending";
    public static string $running = "running";
}

/*
enum JobStatus {
    case complete;
    case failed;
    case pending;
    case running;
}; */

