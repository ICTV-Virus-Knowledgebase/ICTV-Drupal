
import { ISequence } from "./ISequence";

export interface ISequenceFile {
   errors: string[];
   filename: string;
   sequences: ISequence[];
}