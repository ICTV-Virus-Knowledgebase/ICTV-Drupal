
import { FastaFile } from "../../models/FastaFile";

// FASTA files selected to be uploaded and BLAST-ed.
export class SelectedFiles {

   // An array of FASTA file objects.
   files: FastaFile[];

   // A lookup from filename to array index in this.files.
   nameLookup: Map<string, number>;

   // The total number of FASTA records in the file.
   recordCount: number;

   // The total file size of the FASTA records.
   totalSize: number;


   // C-tor
   constructor() {
      this.files = [];
      this.nameLookup = new Map<string, number>();
      this.recordCount = 0;
      this.totalSize = 0;
   }

   // Add a new FASTA file.
   addFile(fastaFile_: FastaFile) {

      // Has a file with this name already been added?
      if (this.hasFilename(fastaFile_.filename)) { throw new Error(`File ${fastaFile_.filename} has already been added`); }
            
      // Update the record count and total size.
      this.recordCount += fastaFile_.records.length;
      this.totalSize += fastaFile_.size;

      // Add the file to the array.
      this.files.push(fastaFile_);

      // Update the name lookup with the filename.
      this.nameLookup.set(fastaFile_.filename, this.files.length - 1);
   }

   // Return the FastaFile with this filename.
   getFile(filename_: string): FastaFile {
      
      if (!filename_) { throw new Error("Invalid filename in getFile()"); }
      if (!this.hasFilename(filename_)) { throw new Error(`File ${filename_} is no longer a selected file`); }

      const index = this.nameLookup.get(filename_);
      if (index < 0) { throw new Error(`File ${filename_} was not found in the name lookup`); }

      return this.files[index];
   }

   // Has a file with this name already been added?
   hasFilename(filename_: string): boolean {
      return this.nameLookup.has(filename_);
   }

   // Is the files array empty?
   isEmpty(): boolean {
      return !Array.isArray(this.files) || this.files.length < 1;
   }
}