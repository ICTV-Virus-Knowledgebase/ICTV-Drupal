
import { IJobFile } from "./IJobFile";
import { ITaxResult } from "./ITaxResult";
import { JobStatus } from "../../global/Types";


export interface IClassificationJob {
   createdOn: string; // Datetime
   data: ITaxResult;
   endedOn: string; // DateTime
   files: IJobFile[];
   name: string;
   message: string;
   status: JobStatus;
   uid: string;
}