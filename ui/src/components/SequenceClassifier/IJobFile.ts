
import { JobStatus } from "../../global/Types"; 

export interface IJobFile {
    endedOn: string; // DateTime
    errorCount: number;
    filename: string;
    infoCount: number;
    message: string;
    startedOn?: string; // DateTime
    status: JobStatus;
    successCount: number;
    uid: string;
    uploadOrder: number;
    warningCount: number;
}
