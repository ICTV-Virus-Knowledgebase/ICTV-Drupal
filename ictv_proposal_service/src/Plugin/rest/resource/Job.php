<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;


class Job {

    
    public string $completedOn; // datetime
    public string $createdOn; // datetime
    public string $failedOn; // datetime
    public string $filename; 
    public int $id;
    public string $message;
    public string $status; //: JobStatus;
    public string $type; // TODO!
    public string $uid;
    public string $userEmail;
    public string $userUID;

    /*
    public function __construct(int $id_, string $status_, string $uid_, string $userEmail_, string $userUID_) {

        //$this->$createdOn = $createdOn_;
        $this->$id = $id_;
        $this->$status = $status_;
        //$this->$type = $type_;
        $this->$uid = $uid_;
        $this->$userEmail = $userEmail_;
        $this->$userUID = $userUID_;
    }*/

    /*
    public function __construct(string $createdOn_, int $id_, string $status_, string $type_, 
        string $uid_, string $userEmail_, string $userUID_) {

        $this->$createdOn = $createdOn_;
        $this->$id = $id_;
        $this->$status = $status_;
        $this->$type = $type_;
        $this->$uid = $uid_;
        $this->$userEmail = $userEmail_;
        $this->$userUID = $userUID_;
    }
    */

}



