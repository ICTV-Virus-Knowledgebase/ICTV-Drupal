
import { ResultFileType } from "./Common";


export interface IResultFile {

   // Base64 encoded string of the file contents.
   contents: string; 

   // The name of the file.
   filename: string;
   
   // Has the file been compressed (e.g., gzipped)?
   isCompressed: boolean;

   // Type of the file (e.g., "csv", "html", etc.)
   type: ResultFileType; 
}