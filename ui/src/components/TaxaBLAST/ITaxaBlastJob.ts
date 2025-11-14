
import { ISearchResults } from "./ISearchResults";
import { JobStatus } from "../../global/Types";


export interface ITaxaBlastJob {
   createdOn: string; // Datetime
   data: ISearchResults;
   endedOn: string; // DateTime
   name: string;
   message: string;
   status: JobStatus;
   uid: string;
}