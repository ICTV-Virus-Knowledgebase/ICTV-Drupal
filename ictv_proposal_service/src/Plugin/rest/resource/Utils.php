<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


class Utils {

    public static function isEmptyElseTrim(string|null &$str): bool {
        if (!$str) { return true; }
        $str = trim($str);
        if (strlen($str) < 1) { return true; }
        return false;
    }

    // Is this string null or empty?
    public static function isNullOrEmpty(string|null $str): bool {
        return ($str === null || trim($str) === '');
    }

}

