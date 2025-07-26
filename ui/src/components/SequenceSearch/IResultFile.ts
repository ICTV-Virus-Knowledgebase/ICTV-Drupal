
import { ResultFileType } from "./Common";


export interface IResultFile {

   // Base64 encoded string of the file contents.
   contents: string; 

   // Type of the file (e.g., "csv", "html", etc.)
   type: ResultFileType; 
}