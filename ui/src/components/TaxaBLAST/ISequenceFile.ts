
import { ISequence } from "./ISequence";

export interface ISequenceFile {
   errors: string[];
   name: string;
   sequences: ISequence[];
}