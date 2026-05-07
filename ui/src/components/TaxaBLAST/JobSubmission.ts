
import { DateTime } from "luxon";
import { FormatDuration } from "./Common";

// Metadata for polling the web service for job status.
export class JobSubmission {

   jobUID: string;
   startedOn: any; // DateTime

   // C-tor
   constructor(jobUID_: string) {

      if (!jobUID_) { throw new Error("Invalid job UID in JobSubmission"); }

      this.jobUID = jobUID_;
      this.startedOn = DateTime.now();
   }

   getDuration() {

      // Format the duration between two date/times.
      //let duration = FormatDuration(this.job.createdOn, this.job.endedOn);

   }
}