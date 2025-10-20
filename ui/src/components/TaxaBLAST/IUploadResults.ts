
import { JobStatus } from "../../global/Types";


export interface IUploadResult {
   errorMessage: string,
   jobUID: string,
   status: JobStatus
}