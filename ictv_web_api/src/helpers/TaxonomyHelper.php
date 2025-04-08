<?php

namespace Drupal\ictv_web_api\helpers;

// Models
use Drupal\ictv_web_api\Plugin\rest\resource\models\Taxon;

// The code here is translated from the Taxonomy.cs file in the C# code base. 
// It only includes methods that I thought fit the helper category.

class LevelInfo {

  public int $nodeDepth;
  public int $levelID;
  public int $parentID;
  public int $taxNodeID;

  public function __construct(int $nodeDepth, int $levelID, int $parentID, int $taxNodeID) {

    $this->nodeDepth = $nodeDepth;
    $this->levelID = $levelID;
    $this->parentID = $parentID;
    $this->taxNodeID = $taxNodeID;
  }
}

class TaxonomyHelper {

  // This function is used inside GetChildTaxa.php in the getByParentTaxon function.
  public static function generatePartialQuery(): string {
    return "
      tn.taxa_desc_cts AS childTaxaCount,
      tn.filename,
      tn.taxa_kid_cts AS immediateChildTaxaCount,
      tn.is_ref AS is_reference,
      tl.name AS level_name,
      tl.id AS level_id,
      tn.lineage,
      (SELECT COUNT(*) 
       FROM taxonomy_node_delta
       WHERE prev_taxid = tn.taxnode_id
       AND (tag_csv IS NOT NULL AND tag_csv <> '')
      ) AS next_delta_count,
      tn.node_depth,
      tn._numKids AS num_children,
      tn.parent_id,
      (SELECT COUNT(*) 
       FROM taxonomy_node_delta
       WHERE new_taxid = tn.taxnode_id
       AND (tag_csv IS NOT NULL AND tag_csv <> '')
      ) AS prev_delta_count,
      tn.cleaned_name AS taxon_name,
      tn.taxnode_id,
      tn.tree_id,
      tn.left_idx,
      tn.right_idx,
      tn.is_hidden,
      tn.is_deleted
      
      FROM taxonomy_node tn
      JOIN taxonomy_level tl ON tl.id = tn.level_id
    ";
  }

    /**
   * This replicates the logic of the createTaxonHTML(...) method in the C# code.
   *
   * @param bool $displayChildCount Whether to display child count
   * @param bool $displayHistoryCtrls Whether to display history controls
   * @param bool $displayMemberOfCtrls Whether to display "member of" control
   * @param bool $leftAlignAll Whether to left-align all
   * @param object $taxon An object containing the taxon data (like ChildTaxaResult or a similar object)
   * @param int $topLevelRankID The rank ID that determines offset or not
   * @param bool $useSmallFont Whether to use a smaller font size
   *
   * @return string HTML snippet for this taxon
   */

  public static function createTaxonHTML(
    bool $displayChildCount,
    bool $displayHistoryCtrls,
    bool $displayMemberOfCtrls,
    bool $leftAlignAll,
    Taxon $taxon,
    int $topLevelRankID,
    bool $useSmallFont
  ): string {

    // build HTML as a string. In C#, there's a StringBuilder;
    // in PHP, concatenate strings.
    $html = '';

    $ctrlHTML = '';
    $isRefHTML = '';

    // Icons
    $collapsedIcon = '<i class="fas fa-plus"></i>';
    $expandedIcon  = '<i class="fas fa-minus"></i>';
    $starIcon      = '<i class="fas fa-star"></i>';
    // $infoIcon = '<i class="fa fa-info-circle"></i>';

    // 1) Populate the control HTML
    if ($taxon->levelName === 'species') {

      // If levelName is "species", check if it's reference
      if (!empty($taxon->isReference) && $taxon->isReference === true) {

        // If it's a reference strain, add the star icon
        $isRefHTML = '<div class="tc-ref-species">' . $starIcon . '</div>';
      }
    } else {

      // For non-species, show expand/collapse icons if numChildren > 0
      $ctrlIcon = '';

      if (!empty($taxon->numChildren) && $taxon->numChildren > 0) {
        $ctrlIcon = (!empty($taxon->isExpanded) && $taxon->isExpanded) ? $expandedIcon : $collapsedIcon;
      }

      // Insert into a div that has data-id
      $ctrlHTML = '<div class="tc-ctrl" data-id="' . $taxon->taxnodeID . '">' . $ctrlIcon . '</div>';
    }

    // 2) Build the right-side content
    // "Click for details" text plus possible "Updated" if there's history
    $rightSide = '<div class="reveal-on-hover">Click for details</div>';

    $totalHistory = 0;
    if (!empty($taxon->nextDeltaCount) && $taxon->nextDeltaCount > 0) {
      $totalHistory += $taxon->nextDeltaCount;
    }
    if (!empty($taxon->prevDeltaCount) && $taxon->prevDeltaCount > 0) {
      $totalHistory += $taxon->prevDeltaCount;
    }

    if ($totalHistory > 0) {
      
      // If there's history, show an "Updated" label
      $rightSide .= '<span class="updated">Updated</span>';
    }

    // 3) Container classes for offset/small font
    $leftOffset = (!$leftAlignAll && !empty($taxon->parentLevelID) && $taxon->parentLevelID >= $topLevelRankID) ? ' left-offset' : '';
    $smallFont = ($useSmallFont === true) ? ' small-font' : '';
    $containerClasses = $leftOffset . $smallFont;

    // 4) "memberOf" control
    $memberOfControl = '';

    // only show if displayMemberOfCtrls is true AND taxon->memberOf, taxon->parentID, taxon->parentLevelName are non-empty
    if (
      $displayMemberOfCtrls === true &&
      !empty($taxon->memberOf) &&
      !empty($taxon->parentID) &&
      !empty($taxon->parentLevelName)
    ) {
      $memberOfControl = '<div class="member-of-control" data-id="' . $taxon->taxnodeID . '">' .
                         $taxon->parentLevelName . ': ' . $taxon->memberOf . '</div>';
    }

    // 5) isExpanded / isPopulated string values (in lower case)
    $isExpanded  = (!empty($taxon->isExpanded) && $taxon->isExpanded) ? 'true' : 'false';
    $hasChildren = (!empty($taxon->numChildren) && $taxon->numChildren > 0);
    $isPopulated = ($isExpanded === 'true' && $hasChildren) ? 'true' : 'false';

    // 6) Start building the final HTML
    $html .= '<div class="tc-container' . $containerClasses . '">';

    // If it's a reference species, add that star HTML
    $html .= $isRefHTML;

    // The taxon node element
    $html .= '<div class="tc-node" ' .
             'data-id="' . $taxon->taxnodeID . '" ' .
             'data-child-taxa="' . ($taxon->childTaxaCount ?? '') . '" ' .
             'data-history="' . $totalHistory . '" ' .
             'data-rank="' . ($taxon->levelName ?? '') . '">';

    // Left side
    $html .= '<div class="tc-left-side">';

    // Expand/collapse
    $html .= $ctrlHTML;

    // Rank
    $html .= '<div class="tc-rank">' . ($taxon->levelName ?? '') . ':</div>';

    // Taxon name
    $html .= '<div class="tc-name">' . ($taxon->taxonName ?? '') . '</div>';

    // Parent rank/name
    $html .= '<div class="tc-member-of">' . $memberOfControl . '</div>';

    // End left side
    $html .= '</div>';

    // Right side
    $html .= '<div class="tc-right-side">' . $rightSide . '</div>';

    // End tc-node
    $html .= '</div>';

    // Child container (not closed here)
    $html .= '<div class="tc-children" data-id="' . $taxon->taxnodeID . '" data-expanded="' . $isExpanded . '" data-populated="' . $isPopulated . '">';

    // Do not close off the ".tc-children" and ".tc-container" divs.
    // The C# code closes them when it moves up the tree stack (in formatSubTreeContainingNode).

    return $html;
  }

  public static function formatSubTreeContainingNode(
    bool $displayChildCount,
    bool $displayHistoryCtrls,
    bool $displayMemberOfCtrls,
    bool $leftAlignAll,
    int $preExpandToRankID,
    ?int $releaseNumber,
    int $selectedLevelID,
    array $taxa,
    int $taxNodeID,
    int $topLevelRankID,
    bool $useSmallFont
  ): string {

    // If there's nothing to process, return empty.
    if (empty($taxa)) {
      return '';
    }

    $finalHTML = '';
    $html = '';
    $levelStack = [];            // store LevelInfo objects here.
    $mostRecentTopLevelID = -1;

    // Loop over each taxon in the list (like the foreach in C#).
    foreach ($taxa as $taxon) {
      $foundParentInStack = false;

      // Generate the fragment of HTML for this taxon (one node).
      $taxonHTML = self::createTaxonHTML(
        $displayChildCount,
        $displayHistoryCtrls,
        $displayMemberOfCtrls,
        $leftAlignAll,
        $taxon,
        $topLevelRankID,
        $useSmallFont
      );

      // Check if the top of the stack is the parent of this node.
      while (!$foundParentInStack && !empty($levelStack)) {
        // Peek at the top (end) of the stack
        /** @var LevelInfo $levelInfo */
        $levelInfo = end($levelStack);
        
        // If the parent's taxNodeID matches, the parent is found.
        if ($taxon->parentID === $levelInfo->taxNodeID) {
          $foundParentInStack = true;
          // Append this node's HTML as a child of the current HTML chunk.
          $html .= $taxonHTML;

          // Push a new LevelInfo for this taxon,
          // since it might have children of its own.
          $levelStack[] = new LevelInfo(
            $taxon->nodeDepth,
            $taxon->levelID,
            (int)$taxon->parentID,
            $taxon->taxnodeID
          );

        } else {
          // Not the parent => pop from the stack and close off HTML.
          array_pop($levelStack);
          $html .= "</div></div>";
        }
      }

      // If parent is not found in the stack, it's a new top-level node.
      if (!$foundParentInStack) {
        // If building a previous top-level node, finalize it.
        if ($mostRecentTopLevelID > 0 && strlen($html) > 0) {
          $finalHTML .= $html;
        }

        $mostRecentTopLevelID = $taxon->taxnodeID;
        $html = $taxonHTML;

        // Reset the stack with this node as the new top-level.
        $levelStack = [ new LevelInfo(
          $taxon->nodeDepth,
          $taxon->levelID,
          (int)$taxon->parentID,
          $taxon->taxnodeID
        )];
      }
    }

    // Once done with all taxa, pop any remaining open nodes.
    if ($mostRecentTopLevelID > 0 && strlen($html) > 0) {
      while (!empty($levelStack)) {
        array_pop($levelStack);
        $html .= "</div></div>";
      }
      $finalHTML .= $html;
    }

    return $finalHTML;
  }

}
