
import { IResultFile } from "./IResultFile";

export interface IResultFiles {
   files: IResultFile[];
   jobUID: string;
   sequenceIndex: number;
}