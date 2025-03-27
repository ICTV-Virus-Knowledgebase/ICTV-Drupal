

import { IJobFile } from "./IJobFile";
import { JobStatus } from "../../global/Types";


export interface IJob {
   createdOn: string; // DateTime
   endedOn: string; // DateTime
   files: IJobFile[];
   message: string;
   name: string;
   status: JobStatus;
   uid: string;
}
