<?php

// PHP api call:
// https://logan1.ictv.global/api/get-virus-isolates?taxon_name=whispovirus&msl_release=40&only_unassigned=false

// C# api call:
// https://dev.ictv.global/ICTV/api/virusIsolate.ashx?action_code=get_virus_isolates&taxon_name=whispovirus&msl_release=40&only_unassigned=false

namespace Drupal\ictv_web_api\Plugin\rest\resource;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\ictv_common\Utils;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

// Model
use Drupal\ictv_web_api\Plugin\rest\resource\models\VirusIsolate;

/**
 * GET /api/get-virus-isolates
 *
 * @RestResource(
 *   id = "get_virus_isolates",
 *   label = @Translation("Get virus isolates"),
 *   uri_paths = {
 *     "canonical" = "/api/get-virus-isolates"
 *   }
 * )
 */

final class GetVirusIsolates extends ResourceBase {

  /** Database wrapper injected in the constructor. */
  protected Connection $connection;

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $current_user
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->connection = \Drupal\Core\Database\Database::getConnection('default', 'ictv_taxonomy');
  }

  public static function create(ContainerInterface $c, array $config, $plugin_id, $plugin_definition) {
    return new static(
      $config,
      $plugin_id,
      $plugin_definition,
      $c->getParameter('serializer.formats'),
      $c->get('logger.factory')->get('ictv_web_api_resource'),
      $c->get('current_user')
    );
  }

  /******************************************************************
   *  GET handler
   *****************************************************************/
  public function get(Request $request): ResourceResponse {

    //----------------------------------------------------------------
    // Read & validate query parameters
    //----------------------------------------------------------------
    $taxonName = $request->get('taxon_name');
    if (Utils::isNullOrEmpty($taxonName)) {throw new BadRequestHttpException('taxon_name is required.');}

    // optional msl_release (integer or NULL)
    $mslRelease = $request->get('msl_release');
    $mslRelease = (Utils::isNullOrEmpty($mslRelease) || !is_numeric($mslRelease)) ? null: (int) $mslRelease;

    // optional only_unassigned (defaults FALSE)
    $onlyUnassigned = strtolower((string) $request->get('only_unassigned')) === 'true';

    //----------------------------------------------------------------
    // Call the database‑level helper
    //----------------------------------------------------------------
    $isolates = $this->getVirusIsolates($mslRelease, $onlyUnassigned, $taxonName);

    //----------------------------------------------------------------
    // Build & return JSON
    //----------------------------------------------------------------
    $response = new ResourceResponse($isolates);
    $response->addCacheableDependency(['#cache' => ['max-age' => 0]]);
    $response->headers->set('Access-Control-Allow-Origin', '*');
    return $response;
  }

  /******************************************************************
   *  Low‑level DB call – kept inside the resource (SQL is tiny)
   *****************************************************************/
  private function getVirusIsolates(?int $mslRelease, bool $onlyUnassigned, string $taxonName): array {

    // Stored‑procedure call with named placeholders
    $sql = <<<SQL
      CALL getVirusIsolates(:mslRelease, :onlyUnassigned, :searchTaxon);
    SQL;

    $params = [
      ':mslRelease'     => $mslRelease,               // PDO will bind NULL automatically
      ':onlyUnassigned' => $onlyUnassigned ? 1 : 0,
      ':searchTaxon'    => $taxonName,
    ];

    try {
      $rows = $this->connection->query($sql, $params)->fetchAll(\PDO::FETCH_ASSOC);
    } catch (\Throwable $e) {
      // log & bubble a 500
      \Drupal::logger('ictv_web_api')->error($e->getMessage());
      throw new \RuntimeException('Database error while fetching virus isolates.');
    }

    // Map DB rows → model → normalised array
    $results = [];
    foreach ($rows as $r) {
      $results[] = VirusIsolate::fromArray($r)->normalize();
    }
    return $results;
  }

     /**
    * {@inheritdoc}
    * 
    * Prevent this block from being cached.
    */
    public function getCacheMaxAge() {
        return 2;

    // NOTE: ChatGPT suggested that we disable caching by setting the max-age to permanent (no expiration).
    // return Cache::PERMANENT;
 }

    /** 
    * {@inheritdoc} 
    * This function has to exist in order for the admin to assign user permissions 
    * to the web service.
    */

    public function permissions() {
        return []; 
     } 

}