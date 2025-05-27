<?php

namespace Drupal\ictv_web_api\EventSubscriber;

use Drupal\Core\PageCache\ResponsePolicy\KillSwitch;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class NoPageCacheSubscriber implements EventSubscriberInterface {

  public function __construct(private KillSwitch $killSwitch) {}

  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::REQUEST => ['onRequest', 30],
    ];
  }

  public function onRequest(RequestEvent $event): void {
    // Only act on the main request.
    if (!$event->isMainRequest()) {
      return;
    }

    // Disable the page cache for the large REST endpoint.
    if (str_starts_with($event->getRequest()->getPathInfo(), '/api/get-by-release-pre-expanded')) {
      $this->killSwitch->trigger();
    }
  }
}