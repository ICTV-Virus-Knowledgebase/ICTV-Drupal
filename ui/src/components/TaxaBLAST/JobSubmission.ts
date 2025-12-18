
import { DateTime } from "luxon";
import { IFileData } from "../../models/IFileData";


// Metadata for polling the web service for job status.
export class JobSubmission {

   endedOn: any; // DateTime
   errors: string[];
   fileCount: number; // Note: This could be calculated from validFiles.
   intervalID: number;
   isComplete: boolean;
   retries: number;
   recordCount: number;
   startedOn: any; // DateTime
   totalSize: number;

   validFiles: IFileData[];

   // TEST
   countsByType: {
      nucleotide: number,
      protein: number
   }


   // C-tor
   constructor() {
      this.initialize();
   }

   // The job submission has completed.
   end() {
      this.endedOn = DateTime.now();
      this.isComplete = true;
      this.intervalID = null;
   }

   // Populate with default values.
   initialize() {
      this.endedOn = null;
      this.errors = [];
      this.fileCount = 0,
      this.intervalID = null;
      this.isComplete = false,
      this.recordCount = 0,
      this.retries = 0,
      this.startedOn = null;
      this.totalSize = 0;

      this.validFiles = [];

      // TEST
      this.countsByType = {
         nucleotide: 0,
         protein: 0
      }
   }

   // The job has been submitted.
   start(/*fileCount_: number, sequenceCount_: number*/) {

      //this.reset();

      //this.fileCount = fileCount_;
      //this.sequenceCount = sequenceCount_;
      this.startedOn = DateTime.now();
   }
}