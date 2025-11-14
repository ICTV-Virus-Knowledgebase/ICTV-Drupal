import { DateTime } from "luxon";

// Metadata for polling the web service for job status.
export class SubmissionStatus {

    endedOn: any; // DateTime
    fileCount: number;
    intervalID: number;
    isComplete: boolean;
    retries: number;
    sequenceCount: number;
    startedOn: any // DateTime

    // The job submission has completed.
    end() {
        this.endedOn = DateTime.now();
        this.isComplete = true;
        this.intervalID = null;
    }

    // Reset the object to its default values.
    reset() {
        this.endedOn = null;
        this.fileCount = NaN,
        this.intervalID = null;
        this.isComplete = false,
        this.retries = 0,
        this.sequenceCount = NaN,
        this.startedOn = null;
    }

    // The job has been submitted.
    start(fileCount_: number, sequenceCount_: number) {

        this.reset();

        this.fileCount = fileCount_;
        this.sequenceCount = sequenceCount_;
        this.startedOn = DateTime.now();
    }
}