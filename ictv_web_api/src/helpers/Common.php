<?php

namespace Drupal\ictv_web_api\helpers;

use Exception;

/**
 * A direct translation of the C# "Common.cs" into PHP static methods.
 */

class Common {

  // The delimiter between lineage taxa that's used by the database.
  public const LINEAGE_DB_DELIMITER = '>';

  // The delimiter between lineage taxa that's expected by the client.
  public const LINEAGE_RESULT_DELIMITER = ' &#8250; ';

  // The taxonomy rank at the bottom of the tree.
  public const LOWEST_TAXONOMY_RANK = 'species';


  /**
   * Equivalent to C#:
   *  public static void convertDelimitedStringToList(string delimitedString_, string delimiter_, ref IEnumerable<string> results_)
   *
   */
  public static function convertDelimitedStringToList(string $delimitedString, string $delimiter): array {
    if ($delimiter === '') {
      throw new Exception("Invalid delimiter");
    }

    // This replicates if (utils.isEmptyElseTrim(ref delimitedString)) { return; }
    $delimitedStringTrim = trim($delimitedString);
    if ($delimitedStringTrim === '') {
      return [];
    }

    // Split by $delimiter
    $parts = explode($delimiter, $delimitedStringTrim);

    // Filter out empty or null tokens
    $results = [];
    foreach ($parts as $p) {
      $token = trim($p);
      if ($token !== '') {
        $results[] = $token;
      }
    }

    return $results;
  }


  /**
   * Equivalent to C# formatLineage(...)
   *   public static string formatLineage(string lineageText_, string resultDelimiter_, string searchText_, string sourceDelimiter_, ref string terminalName_)
   *
   * Instead of ref string terminalName_, return it by reference param.
   * If tokens is empty => return null (like in C#).
   */
  public static function formatLineage(
    string $lineageText,
    string $resultDelimiter,
    ?string $searchText,
    string $sourceDelimiter,
    ?string &$terminalName
  ): ?string {
  
    // 1) Trim & check if empty
    $lineageText = trim($lineageText);
    if ($lineageText === '') {
      return $lineageText;
    }
  
    // 2) Split into tokens
    $tokens = self::convertDelimitedStringToList($lineageText, $sourceDelimiter);
    if (empty($tokens)) {
      return null;
    }
  
    // 3) The last token is the terminal name (like "Potyvirus plumpoxi").
    $terminalName = end($tokens);
    if (trim($terminalName) === '') {
      throw new \Exception("terminal name was empty");
    }
  
    // 4) Build up the HTML
    $results = '';
    foreach ($tokens as $i => $token) {
      $tokenTrim = trim($token);
      if ($tokenTrim === '') continue;
  
      // highlight
      $formattedTaxon = self::highlightSearchTextInName("search-term-result", $searchText, $tokenTrim);
  
      // italicize
      if (self::italicizeTaxaName($tokenTrim)) {
        $formattedTaxon = "<i>$formattedTaxon</i>";
      }
  
      // only append delimiter if not the first token
      if ($results !== '') {
        $results .= $resultDelimiter;
      }
  
      $results .= $formattedTaxon;
    }
  
    return $results;
  }  


  /**
   * Equivalent to highlightSearchTextInName(string highlightedCssClass_, string searchText_, string name_)
   */
  public static function highlightSearchTextInName(
    string $highlightedCssClass_,
    ?string $searchText_,
    ?string $name_
  ): ?string {
    // if (utils.isEmptyElseTrim(ref highlightedCssClass)) => throw ...
    $highlightedCssClass = trim($highlightedCssClass_);
    if ($highlightedCssClass === '') {
      throw new Exception("Invalid highlighted CSS class");
    }

    $name = trim($name_ ?? '');
    if ($name === '') {
      return null;
    }

    $searchText = trim($searchText_ ?? '');
    if ($searchText === '') {
      return $name;
    }

    // Case-insensitive find the substring
    // check if name contains searchText
    $matchStart = stripos($name, $searchText);
    if ($matchStart === false) {
      return $name;
    }

    // matchEnd = matchStart + searchText_.Length - 1
    $matchEnd = $matchStart + strlen($searchText) - 1;

    // preMatch = name.Substring(0, matchStart)
    $preMatch = substr($name, 0, $matchStart);
    // match = name.Substring(matchStart, searchText.Length)
    $match = substr($name, $matchStart, strlen($searchText));
    // postMatch = name.Substring(matchEnd + 1)
    $postMatch = substr($name, $matchEnd + 1);

    return sprintf(
      '%s<span class="%s">%s</span>%s',
      $preMatch,
      $highlightedCssClass,
      $match,
      $postMatch
    );
  }

  /**
   * Equivalent to italicizeTaxaName(string taxaName_)
   * returns (bool).
   */
  public static function italicizeTaxaName(?string $taxaName_): bool {
    $taxaName = trim($taxaName_ ?? '');
    if ($taxaName === '') {
      return false;
    }

    $lowerCaseName = strtolower($taxaName);

    // return (!lowerCaseName.Contains("like viruses") && !lowerCaseName.Contains("unknown") && !lowerCaseName.Contains("unassigned"));
    if (strpos($lowerCaseName, 'like viruses') !== false ||
        strpos($lowerCaseName, 'unknown') !== false ||
        strpos($lowerCaseName, 'unassigned') !== false) {
      return false;
    }
    return true;
  }

}

