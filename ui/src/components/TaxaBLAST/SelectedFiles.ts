
import { Constants } from "./Common";
import { FastaFile } from "../../models/FastaFile";
import { FastaStatus } from "../../global/Types";
import { IFileData } from "../../models/IFileData";


// FASTA files selected to be uploaded and BLAST-ed.
export class SelectedFiles {

   // An array of FASTA file objects.
   files: Array<FastaFile>;

   // A lookup from filename to array index in this.files.
   nameLookup: Map<string, number>;

   // The total number of FASTA records in the file.
   recordCount: number;

   // The total file size of the FASTA records.
   totalSize: number;


   // C-tor
   constructor() {
      this.files = new Array<FastaFile>();
      this.nameLookup = new Map<string, number>();
      this.recordCount = 0;
      this.totalSize = 0;
   }

   // Add a new FASTA file.
   addFile(fastaFile_: FastaFile) {

      // Has a file with this name already been added?
      if (this.nameLookup.has(fastaFile_.filename)) { throw new Error(`File ${fastaFile_.filename} has already been added`); }
            
      // Update the record count and total size.
      this.recordCount += fastaFile_.records.length;
      this.totalSize += fastaFile_.size;

      // Add the file to the array.
      this.files.push(fastaFile_);

      // Update the name lookup with the filename.
      this.nameLookup.set(fastaFile_.filename, this.files.length - 1);
   }

   getErrorCount(): number {

      let errorCount = 0;

      this.files.forEach((file_: FastaFile) => {
         errorCount += file_.errorCount;
      })

      return errorCount;
   }

   getErrors(includeFilename_: boolean): Array<string> {

      let errors = new Array<string>();

      // Have we exceeded the maxiumum total file size?
      if (this.totalSize > Constants.MAX_FILE_SIZE_TOTAL) {
         errors.push(`The total size of all uploaded files must be less than ${Constants.MAX_FILE_SIZE_TOTAL}. ` +
            `Please remove files from your submission or refresh the page to start over.`);
      }

      // Validate the number of FASTA records/sequences found in the file(s).
      if (this.recordCount > Constants.MAX_SEQUENCE_COUNT) {

         const s = this.recordCount === 1 ? "" : "s";

         // Create an error message.
         let errorMessage = `The maximum number of sequences you can submit is ${Constants.MAX_SEQUENCE_COUNT} and your `;

         if (this.files.length === 1) {
            errorMessage += `FASTA file contains ${this.recordCount}. `;
         } else {
            errorMessage += `FASTA files contain ${this.recordCount}. `;
         }

         errorMessage += `Please remove files from your submission or refresh the page to start over.`;

         errors.push(errorMessage);

      } else if (this.recordCount < 1) {

         // No records/sequences were found.
         if (this.files.length === 1) {
            errors.push("Your FASTA file does not contain any valid FASTA sequences.");
         } else {
            errors.push("Your FASTA files do not contain any valid FASTA sequences.")
         }
      }

      this.files.forEach((file_: FastaFile) => {
         errors = errors.concat(file_.getErrors(includeFilename_));
      })

      return errors;
   }

   // Return the FastaFile with this filename.
   getFile(filename_: string): FastaFile {
      
      if (!filename_) { throw new Error("Invalid filename in getFile()"); }
      if (!this.nameLookup.has(filename_)) { throw new Error(`File ${filename_} is no longer a selected file`); }

      const index = this.nameLookup.get(filename_);
      if (index < 0) { throw new Error(`File ${filename_} was not found in the name lookup`); }

      return this.files[index];
   }

   // Get a summary of the statuses of the FASTA files, each with a file count.
   getStatusSummary(): Map<FastaStatus, number> {

      const statuses = new Map<FastaStatus, number>();

      this.files.forEach((file_: FastaFile) => {
         
         let count = 0;
         if (statuses.has(file_.status)) {
            count = statuses.get(file_.status);
         }

         statuses.set(file_.status, count + 1);
      })

      return statuses;
   }

   getValidFiles(): Array<IFileData> {

      let results = new Array<IFileData>();

      this.files.forEach((file_: FastaFile) => {
         results.push({
            name: file_.filename,
            contents: file_.fasta
         } as IFileData)
      })

      return results;
   }

   // Has a file with this name already been added?
   hasFilename(filename_: string): boolean {
      return this.nameLookup.has(filename_);
   }

   // Is the files array empty?
   isEmpty(): boolean {
      return !Array.isArray(this.files) || this.files.length < 1;
   }

   // Remove files with these filenames.
   removeFiles(filenames_: Array<string>) {

      let updatedFiles = [];

      // We will rebuild the name lookup and recalculate the record count and total file size.
      this.nameLookup.clear();
      this.recordCount = 0;
      this.totalSize = 0;

      // Iterate over all files.
      this.files.forEach((file_: FastaFile) => {

         // If the file's name isn't one of the filenames to be removed, add the file
         // to the array of updated files and update the name lookup.
         if (!filenames_.includes(file_.filename)) {
            updatedFiles.push(file_);
            this.nameLookup.set(file_.filename, updatedFiles.length - 1);
            this.recordCount += file_.records.length;
            this.totalSize += file_.size;
         }
      })

      // Replace the array of files.
      this.files = updatedFiles;
   }

}