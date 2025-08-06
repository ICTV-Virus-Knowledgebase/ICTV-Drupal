
import { ResultFileType } from "./Common";


export interface IOutputFile {

   // Base64 encoded string of the file contents.
   contents: string; 

   // An error message (optional)
   error: string;

   // The name of the sequence-specific file.
   filename: string;

   // The name of the FASTA input file.
   inputFilename: string;
   
   // Has the file been compressed (e.g., gzipped)?
   isCompressed: boolean;

   // The job UID
   jobUID: string;
}