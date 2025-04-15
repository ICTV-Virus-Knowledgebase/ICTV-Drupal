<?php

namespace Drupal\ictv_web_api\helpers;

use Drupal\Core\Database\Connection;

// Common class
use Drupal\ictv_web_api\helpers\Common;

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
   * This replicates the “SQL version” of getByReleasePreExpanded(...) (SQL Version).
   * It returns an array with:
   *   'taxa'                => array of Taxon objects,
   *   'topLevelTaxNodeIDs'  => int[],
   *   'topLevelRankID'      => int,
   *   'preExpandToRankID'   => int
   *
   * @param Connection $connection
   * @param int|null $releaseNumber
   * @param string|null $preExpandToRank
   * @param string|null $topLevelRank
   * @return array
   */

  public static function getByReleasePreExpandedData(Connection $connection, ?int $releaseNumber, ?string $preExpandToRank, 
  ?string $topLevelRank): array {

    // Provide defaults:
    if (empty($topLevelRank)) { $topLevelRank = 'tree'; }
    // LOWEST_TAXONOMY_RANK = 'species'
    if (empty($preExpandToRank)) { $preExpandToRank = Common::LOWEST_TAXONOMY_RANK; }

    $treeID = self::fetchTreeID($connection, $releaseNumber);

    // topLevelID
    $topLevelID = self::fetchTaxonomyLevelID($connection, $topLevelRank);

    // preExpandToLevelID
    $preExpandToLevelID = self::fetchTaxonomyLevelID($connection, $preExpandToRank);

    // Build the partial query:
    $partial = self::generatePartialQuery();

    $sqlPreExpandedTaxa = "
      SELECT
        parent.level_id AS parent_level_id,
        parent_level.name AS parent_level_name,
        CASE WHEN parent.level_id < :topLevelID THEN 0 ELSE 1 END AS visible_parent,
        CASE WHEN (tn.level_id >= :topLevelID AND tn.level_id < :preExpandToLevelID) THEN 1 ELSE 0 END AS is_expanded,
        $partial
      JOIN taxonomy_node parent ON parent.taxnode_id = tn.parent_id
      JOIN taxonomy_level parent_level ON parent_level.id = parent.level_id
      WHERE tn.tree_id = :treeID
        AND tn.is_hidden = 0
        AND tn.is_deleted = 0
        AND tn.level_id >= :topLevelID
        AND parent.level_id < :preExpandToLevelID
      ORDER BY
        tn.left_idx,
        CASE WHEN tn.start_num_sort IS NULL THEN COALESCE(tn.name, 'ZZZZ')
             ELSE LEFT(tn.name, tn.start_num_sort)
        END,
        CASE WHEN tn.start_num_sort IS NULL THEN NULL
             ELSE FLOOR(LTRIM(SUBSTRING(tn.name, tn.start_num_sort + 1, 50)))
        END
    ";

    // 3) Execute that query
    $params = [
      ':treeID'             => $treeID,
      ':topLevelID'         => $topLevelID,
      ':preExpandToLevelID' => $preExpandToLevelID,
    ];

    $stmt1 = $connection->query($sqlPreExpandedTaxa, $params);

    // fetch all rows
    $rows1 = $stmt1->fetchAll(\PDO::FETCH_ASSOC);

    // Convert each row to a Taxon (assuming you have Taxon::fromArray)
    $taxa = [];
    foreach ($rows1 as $row) {
      // $taxa[] = Taxon::fromArray($row); // if you have special fields for parent_level_id, is_expanded, etc. handle them
      $taxon = Taxon::fromArray($row);
      $taxon->process();
      $taxa[] = $taxon;
    }

    // 4) Next, replicate the “SELECT tn.taxnode_id as taxnode_id…"
    $sqlTopLevelNodes = "
      SELECT tn.taxnode_id AS taxnode_id
      FROM taxonomy_node tn
      JOIN taxonomy_level tl ON tl.id = tn.level_id
      JOIN taxonomy_node parent ON parent.taxnode_id = tn.parent_id
      WHERE tn.tree_id = :treeID
        AND tn.is_hidden = 0
        AND tn.is_deleted = 0
        AND tn.level_id >= :topLevelID
        AND parent.level_id < :topLevelID
      ORDER BY
        tn.level_id,
        CASE WHEN tn.start_num_sort IS NULL THEN COALESCE(tn.name, 'ZZZZ')
             ELSE LEFT(tn.name, tn.start_num_sort)
        END,
        CASE WHEN tn.start_num_sort IS NULL THEN NULL
             ELSE FLOOR(LTRIM(SUBSTRING(tn.name, tn.start_num_sort + 1, 50)))
        END
    ";

    $stmt2 = $connection->query($sqlTopLevelNodes, $params);
    $rows2 = $stmt2->fetchAll(\PDO::FETCH_ASSOC);

    $topLevelTaxNodeIDs = [];

    foreach ($rows2 as $r) {
      $topLevelTaxNodeIDs[] = (int)$r['taxnode_id'];
    }

    // 5) The final “SELECT top_level_id = @topLevelID, pre_expand_to_level_id = @preExpandToLevelID”
    // Actually, we already have them in $topLevelID and $preExpandToLevelID from earlier. 
    // If you want them in the return structure:
    $finalTopLevelID      = $topLevelID;       // in T-SQL, you might store them
    $finalPreExpandToID   = $preExpandToLevelID; 

    return [
      'taxa'               => $taxa,
      'topLevelTaxNodeIDs' => $topLevelTaxNodeIDs,
      'topLevelRankID'     => $finalTopLevelID,
      'preExpandToRankID'  => $finalPreExpandToID,
    ];
  }

  /**
   * Replicates the "HTML-building" version of C# getByReleasePreExpanded(...).
   *
   * It calls getByReleasePreExpandedData(...) to fetch:
   *   - A list of $taxa
   *   - A list of top-level taxnode IDs
   *   - The topLevelRankID
   * Then uses the stack logic to build a final HTML snippet.
   *
   * @param Connection $connection
   *   The DB connection, used by getByReleasePreExpandedData(...) 
   * @param bool $displayChildCount
   * @param bool $displayHistoryCtrls
   * @param bool $displayMemberOfCtrls
   * @param string &$htmlResults
   *   (In C#, it's passed by ref; in PHP, we can either return the final string
   *   or accept a reference parameter. We'll do "return string" for clarity.)
   * @param bool $leftAlignAll
   * @param string|null $preExpandToRank
   * @param int|null $releaseNumber
   * @param string|null $topLevelRank
   * @param bool $useSmallFont
   *
   * @return string
   *   The final HTML that C# puts in htmlResults_.
   */
  
  public static function buildPreExpandedHtml(Connection $connection, bool $displayChildCount, bool $displayHistoryCtrls, bool $displayMemberOfCtrls,
    bool $leftAlignAll, ?string $preExpandToRank, ?int $releaseNumber, ?string $topLevelRank, bool $useSmallFont): string {

    // Get all taxa that match our criteria.
    $data = self::getByReleasePreExpandedData( $connection, $releaseNumber, $preExpandToRank, $topLevelRank );

    $taxa               = $data['taxa'] ?? [];
    $topLevelTaxNodeIDs = $data['topLevelTaxNodeIDs'] ?? [];
    $topLevelRankID     = $data['topLevelRankID'] ?? -1;

    // Check if taxa is empty.
    if (empty($taxa)) { return ''; }

    // If no top-level taxa were found.
    if (empty($topLevelTaxNodeIDs)) {
      throw new \Exception("No top-level taxa were found.");
    }

    // Now replicate the stack-based approach from the C# code
    $html = '';
    $mostRecentTopLevelID = -1;

    // Store "LevelInfo" objects in an array for the stack.
    $levelStack = [];

    // Store top-level node HTML in a map: topLevelHtmlLookup[taxNodeID] => partial HTML
    $topLevelHtmlLookup = [];

    // For each taxon, generate HTML, see if we find its parent in the stack, etc.
    foreach ($taxa as $taxon) {

      $foundParentInStack = false;

      // Generate HTML for this taxon's node in the tree (the taxonomy browser).
      $taxonHTML = self::createTaxonHTML($displayChildCount, $displayHistoryCtrls, $displayMemberOfCtrls, $leftAlignAll, $taxon, $topLevelRankID, $useSmallFont);

      // Is this node's parent taxon already in the stack?
      while (!$foundParentInStack && !empty($levelStack)) {

        /** @var LevelInfo $levelInfo */
        // Peek the top of the stack.
        $levelInfo = end($levelStack);

        if ($taxon->parentID === $levelInfo->taxNodeID) {

          // We found the parent
          $foundParentInStack = true;

          // Append this taxon's HTML to the current $html
          $html .= $taxonHTML;

          // Push new LevelInfo for this node
          $levelStack[] = new LevelInfo($taxon->nodeDepth, $taxon->levelID, $taxon->parentID, $taxon->taxnodeID);

        } else {
          // Pop the top of the stack so we can compare against the next-higher level.
          array_pop($levelStack);

          // "Close off the taxon HTML as we traverse up the tree"
          $html .= "</div></div>";
        }
      }

      // If we didn't find a parent in the stack, it's a top-level parent.
      if (!$foundParentInStack) {

        // If the parentLevelID >= topLevelRankID, we have an error
        if ($taxon->parentLevelID >= $topLevelRankID) { throw new \Exception("Found a taxon that shouldn't be top-level: " . $taxon->taxonName); }

        // Have we been populating HTML for a previous top-level parent?
        if ($mostRecentTopLevelID > 0 && strlen($html) > 0) { 
          
          $topLevelHtmlLookup[$mostRecentTopLevelID] = $html; 
        }

        $mostRecentTopLevelID = $taxon->taxnodeID;
        $html = $taxonHTML;

        // Reset the stack with this node as the top
        $levelStack = [new LevelInfo($taxon->nodeDepth, $taxon->levelID, $taxon->parentID, $taxon->taxnodeID)];
      }
    }

    // If we have a final top-level parent with leftover HTML.
    if ($mostRecentTopLevelID > 0 && strlen($html) > 0) {

      // Clear the stack
      while (!empty($levelStack)) {
        array_pop($levelStack);
        $html .= "</div></div>";
      }

      $topLevelHtmlLookup[$mostRecentTopLevelID] = $html;
    }

    // Build final HTML by iterating top-level IDs in order
    $finalHTML = '';

    foreach ($topLevelTaxNodeIDs as $tid) {

      if (isset($topLevelHtmlLookup[$tid])) {

        $topLevelHTML = $topLevelHtmlLookup[$tid];
        if (!empty($topLevelHTML)) { $finalHTML .= $topLevelHTML; }
      }
    }

    // Return final HTML
    return $finalHTML;
  }

  /**
   * Example function to fetch treeID from a stored function `udf_getTreeId`.
   * In T-SQL you had: DECLARE @treeID = dbo.udf_getTreeId(...).
   * In MySQL you might replicate with a subselect or your own function.
   */

  protected static function fetchTreeID(Connection $connection, ?int $releaseNumber): int {

    // If releaseNumber is null => "SELECT NULL"?? or "some default"
    // For demonstration, let's do something like:
    if (!$releaseNumber || $releaseNumber < 1) {

      // fallback
      return 0;
    }

    // If you do have a MySQL function named udf_getTreeId, you can do:
    $sql = "SELECT udf_getTreeID(:releaseNumber) AS treeID";
    $stmt = $connection->query($sql, [':releaseNumber' => $releaseNumber]);
    $row = $stmt->fetchAssoc();
    return $row ? (int)$row['treeID'] : 0;
  }

  /**
   * Example function to fetch a rank level ID from `taxonomy_level` table where name = ?
   */

  protected static function fetchTaxonomyLevelID(Connection $connection, string $rankName): int {

    $sql = "SELECT id FROM taxonomy_level WHERE name = :rankName LIMIT 1";
    $stmt = $connection->query($sql, [':rankName' => $rankName]);
    $row = $stmt->fetchAssoc();

    if (!$row) {
      return 0;
    }

    return (int)$row['id'];
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

  public static function createTaxonHTML(bool $displayChildCount, bool $displayHistoryCtrls, bool $displayMemberOfCtrls, bool $leftAlignAll,
    Taxon $taxon, int $topLevelRankID, bool $useSmallFont): string {

    // Build HTML as a string.
    $html = '';

    $ctrlHTML = '';
    $isRefHTML = '';

    // Icons
    $collapsedIcon = '<i class="fas fa-plus"></i>';
    $expandedIcon  = '<i class="fas fa-minus"></i>';
    $starIcon      = '<i class="fas fa-star"></i>';
    // $infoIcon = '<i class="fa fa-info-circle"></i>';

    // Populate the control HTML
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

    // Build the right-side content
    // "Click for details" text plus possible "Updated" if there's history
    $rightSide = '<div class="reveal-on-hover">Click for details</div>';

    $totalHistory = 0;
    if (!empty($taxon->nextDeltaCount) && $taxon->nextDeltaCount > 0) { $totalHistory += $taxon->nextDeltaCount; }
    if (!empty($taxon->prevDeltaCount) && $taxon->prevDeltaCount > 0) { $totalHistory += $taxon->prevDeltaCount; }

    if ($totalHistory > 0) {
      
      // If there's history, show an "Updated" label
      $rightSide .= '<span class="updated">Updated</span>';
    }

    // Container classes for offset/small font
    $leftOffset = (!$leftAlignAll && !empty($taxon->parentLevelID) && $taxon->parentLevelID >= $topLevelRankID) ? ' left-offset' : '';
    $smallFont = ($useSmallFont === true) ? ' small-font' : '';
    $containerClasses = $leftOffset . $smallFont;

    // "memberOf" control
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

    // isExpanded / isPopulated string values (in lower case)
    $isExpanded  = (!empty($taxon->isExpanded) && $taxon->isExpanded) ? 'true' : 'false';
    $hasChildren = (!empty($taxon->numChildren) && $taxon->numChildren > 0);
    $isPopulated = ($isExpanded === 'true' && $hasChildren) ? 'true' : 'false';

    // Start building the final HTML
    $html .= '<div class="tc-container' . $containerClasses . '">';

    // If it's a reference species, add that star HTML
    $html .= $isRefHTML;

    // The taxon node element
    $html .= '<div class="tc-node" '
      // data-id
      . 'data-id="' . $taxon->taxnodeID . '" '
      // data-child-taxa
      . 'data-child-taxa="' . ($taxon->childTaxaCount ?? '') . '" '
      // data-history
      . 'data-history="' . $totalHistory . '" '
      // data-rank
      . 'data-name="' . ($taxon->taxonName ?? '') . '" '
      // data-name
      . 'data-rank="' . ($taxon->levelName ?? '') . '">'
    ;

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

  public static function formatSubTreeContainingNode(bool $displayChildCount, bool $displayHistoryCtrls, bool $displayMemberOfCtrls,
    bool $leftAlignAll, int $preExpandToRankID, ?int $releaseNumber, int $selectedLevelID, array $taxa, int $taxNodeID,
    int $topLevelRankID, bool $useSmallFont): string {

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
        $levelStack = [new LevelInfo($taxon->nodeDepth, $taxon->levelID, (int)$taxon->parentID, $taxon->taxnodeID)];
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

  /**
   * Replicates getSubTreeContainingNode(...) from C#,
   * returning an array of 'taxa' (Taxon[]), plus
   * 'parentTaxNodeID', 'selectedLevelID', 'topLevelRankID', 'preExpandToRankID'.
   *
   * @param Connection $connection
   *   The DB connection
   * @param ?string $preExpandToRank
   * @param ?int $releaseNumber
   * @param int $taxNodeID
   * @param ?string $topLevelRank
   *
   * @return array {
   *   'parentTaxNodeID'     => ?int,
   *   'selectedLevelID'     => int,
   *   'taxa'                => Taxon[],
   *   'topLevelRankID'      => int,
   *   'preExpandToRankID'   => int
   * }
   */

  public static function getSubTreeContainingNodeData(Connection $connection, ?string $preExpandToRank, ?int $releaseNumber, int $taxNodeID,
    ?string $topLevelRank): array {

    // Validate rank inputs
    if (empty($preExpandToRank)) { throw new \Exception("Invalid preExpandToRank"); }
    if (empty($topLevelRank)) { throw new \Exception("Invalid topLevelRank"); }

    // 1) get treeID
    $treeID = self::fetchTreeID($connection, $releaseNumber);

    // 2) get topLevelID
    $topLevelID = self::fetchTaxonomyLevelID($connection, $topLevelRank);

    // 3) get preExpandToLevelID
    $preExpandToLevelID = self::fetchTaxonomyLevelID($connection, $preExpandToRank);

    // 4) get the selectedLevelID for $taxNodeID (i.e. the rank of that node)
    // Also get the left_idx for that node
    // Then build the partial query that references:
    //   - "parent_level_id = parent.level_id"
    //   - "visible_parent = CASE WHEN parent.level_id < @topLevelID THEN 0 ELSE 1 END"
    //   - "is_expanded = CASE WHEN ... THEN 1 ELSE 0 END"
    // plus your generatePartialQuery

    // For T-SQL, we see multiple DECLARE statements. We'll replicate them with subselects or multiple queries in MySQL.

    // A) fetch selectedLevelID and selectedLeftIdx for that node
    $sqlSelected = "
      SELECT
        level_id    AS selectedLevelID,
        left_idx    AS selectedLeftIdx
      FROM taxonomy_node
      WHERE taxnode_id = :taxNodeID
      LIMIT 1
    ";

    $rowSelected = $connection->query($sqlSelected, [':taxNodeID' => $taxNodeID])->fetchAssoc();

    if (!$rowSelected) {
      // if node not found
      throw new \Exception("Taxnode ID not found: $taxNodeID");
    }

    $selectedLevelID = (int)$rowSelected['selectedLevelID'];
    $selectedLeftIdx = (int)$rowSelected['selectedLeftIdx'];

    // B) replicate your partial query with is_expanded logic
    $partial = self::generatePartialQuery(); // the large snippet
    // We'll inject the "parent_level_id = parent.level_id, ... is_expanded = CASE WHEN ..."

    // Because we have "and tn.level_id <= @selectedLevelID", we can add that as well
    $sqlSubTree = "
      SELECT
        parent.level_id AS parent_level_id,
        parent_level.name AS parent_level_name,
        CASE WHEN parent.level_id < :topLevelID THEN 0 ELSE 1 END AS visible_parent,
        CASE
          WHEN (tn.level_id >= :topLevelID AND tn.level_id < :preExpandToLevelID) THEN 1
          WHEN (tn.level_id >= :preExpandToLevelID AND :selectedLeftIdx BETWEEN tn.left_idx AND tn.right_idx AND tn.taxnode_id <> :taxNodeID)
               THEN 1
          ELSE 0
        END AS is_expanded,
        $partial
      JOIN taxonomy_node parent ON parent.taxnode_id = tn.parent_id
      JOIN taxonomy_level parent_level ON parent_level.id = parent.level_id
      WHERE tn.tree_id = :treeID
        AND tn.is_hidden = 0
        AND tn.is_deleted = 0
        AND parent.taxnode_id IN (
          SELECT ancestor_node.taxnode_id
          FROM taxonomy_node ancestor_node
          JOIN taxonomy_node target_node ON (
            target_node.left_idx BETWEEN ancestor_node.left_idx AND ancestor_node.right_idx
            AND target_node.tree_id = ancestor_node.tree_id
          )
          WHERE target_node.taxnode_id = :taxNodeID
            AND ancestor_node.level_id >= :preExpandToLevelID
        )
        AND tn.level_id <= :selectedLevelID
      ORDER BY
        tn.left_idx,
        CASE WHEN tn.start_num_sort IS NULL THEN COALESCE(tn.name, 'ZZZZ')
             ELSE LEFT(tn.name, tn.start_num_sort)
        END,
        CASE WHEN tn.start_num_sort IS NULL THEN NULL
             ELSE FLOOR(LTRIM(SUBSTRING(tn.name, tn.start_num_sort + 1, 50)))
        END
    ";

    $paramsSubTree = [
      ':taxNodeID'         => $taxNodeID,
      ':selectedLeftIdx'   => $selectedLeftIdx,
      ':treeID'            => $treeID,
      ':topLevelID'        => $topLevelID,
      ':preExpandToLevelID'=> $preExpandToLevelID,
      ':selectedLevelID'   => $selectedLevelID
    ];

    $stmt = $connection->query($sqlSubTree, $paramsSubTree);
    $dbRows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    $taxa = [];
    foreach ($dbRows as $r) {

      $taxon = Taxon::fromArray($r);
      $taxon->process();
      $taxa[] = $taxon;
      // $taxa[] = $taxon->normalize();
    }

    // C) get topLevelRankID, preExpandToRankID, plus parent_taxnode_id, selected_level_id from the second result set
    // In T-SQL, you had a second SELECT returning "top_level_id, pre_expand_to_level_id, parent_taxnode_id, selected_level_id".
    // So we do the same in MySQL:
    $sqlSecond = "
      SELECT
        :topLevelID AS top_level_id,
        :preExpandToLevelID AS pre_expand_to_level_id,
        (
          SELECT ancestor_node.taxnode_id
          FROM taxonomy_node ancestor_node
          JOIN taxonomy_node target_node ON (
            target_node.left_idx BETWEEN ancestor_node.left_idx AND ancestor_node.right_idx
            AND target_node.tree_id = ancestor_node.tree_id
          )
          WHERE target_node.taxnode_id = :taxNodeID
            AND ancestor_node.level_id >= :preExpandToLevelID
          ORDER BY ancestor_node.level_id ASC
          LIMIT 1
        ) AS parent_taxnode_id,
        :selectedLevelID AS selected_level_id
    ";

    $paramsSecond = [
      ':taxNodeID'          => $taxNodeID,
      ':topLevelID'         => $topLevelID,
      ':preExpandToLevelID' => $preExpandToLevelID,
      ':selectedLevelID'    => $selectedLevelID
    ];

    $row2 = $connection->query($sqlSecond, $paramsSecond)->fetchAssoc();

    // If the second query returned no row, provide a fallback:
    if (!$row2) {
    // NOTE: The fallback array keys should match the column names,
    //       not placeholders like ":taxNodeID"...
    $row2 = [
      'top_level_id'             => $topLevelID,
      'pre_expand_to_level_id'   => $preExpandToLevelID,
      'parent_taxnode_id'        => null,
      'selected_level_id'        => $selectedLevelID
  ];
}

    $topLevelRankID  = (int)$row2['top_level_id'];
    $preExpandToRankID = (int)$row2['pre_expand_to_level_id'];
    $parentTaxNodeID = $row2['parent_taxnode_id'] === null ? null : (int)$row2['parent_taxnode_id'];
    $selectedLevelID = (int)$row2['selected_level_id'];

    return [
      'parentTaxNodeID'     => $parentTaxNodeID,
      'selectedLevelID'     => $selectedLevelID,
      'taxa'                => $taxa,
      'topLevelRankID'      => $topLevelRankID,
      'preExpandToRankID'   => $preExpandToRankID,
    ];
  }

}
