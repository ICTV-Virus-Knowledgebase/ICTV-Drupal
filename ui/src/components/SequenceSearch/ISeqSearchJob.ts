
import { ITaxResult } from "./ITaxResult";
import { JobStatus } from "../../global/Types";


export interface ISeqSearchJob {
   createdOn: string; // Datetime
   data: ITaxResult;
   endedOn: string; // DateTime
   name: string;
   message: string;
   status: JobStatus;
   uid: string;
}