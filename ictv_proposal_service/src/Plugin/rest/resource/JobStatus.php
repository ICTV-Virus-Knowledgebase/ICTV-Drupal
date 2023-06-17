<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


class JobStatus {
    public static string $crashed = "crashed";
    public static string $invalid = "invalid";
    public static string $pending = "pending";
    public static string $valid = "valid";
}


/*
class ResultFile {
    public static string $summaryAllPrettyXLSX = "QC.pretty_summary.all.xlsx";
    public static string $summaryTSV = "QC.summary.tsv";
    public static string $summaryXLSX = "QC.summary.xlsx";
}
*/
/*

QC.summary.tsv
QC.pretty_summary.all.xlsx
QC.summary.xlsx

*/

/*
enum JobStatus {
    case complete;
    case failed;
    case pending;
    case running;
}; */

