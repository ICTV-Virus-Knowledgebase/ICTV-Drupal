
import { JobStatus } from "../../global/Types";


export interface ISubmissionResult {
   errorMessage: string,
   jobUID: string,
   status: JobStatus
}