<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

class Utils {

    public static function isEmptyElseTrim(string &$str) {
        if (!$str) { return true; }
        $str = trim($str);
        if (strlen($str) < 1) { return true; }
        return false;
    }

    // Is this string null or empty?
    public static function isNullOrEmpty($str){
        return ($str === null || trim($str) === '');
    }

}

