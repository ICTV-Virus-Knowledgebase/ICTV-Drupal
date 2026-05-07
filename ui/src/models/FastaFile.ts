
import { FastaError } from "./FastaError";
import { FastaStatus, SequenceType } from "../global/Types";
import { FastaRecord } from "./FastaRecord";
import { Utils } from "../helpers/Utils";


export class FastaFile {

   // The number of errors found in the file.
   errorCount: number;

   // An array of error messages. Note that this will be updated at the end of the validation process.
   errors: FastaError[];

   // The raw FASTA text.
   fasta: string;

   // The name of the file.
   filename: string;

   longestSequence: number;

   // The parsed FASTA records.
   records: FastaRecord[];
   
   // The sequence type of the file. This is determined during validation and can be nucleotide, protein, ambiguous (valid bases for both types), or unknown (no valid bases for either type).
   sequenceType: SequenceType | null;

   // Sequence type(s) found in the file.
   sequenceTypes: Set<SequenceType>;

   // The size of the file in bytes.
   size: number;

   // The validation status.
   status: FastaStatus;

   // Warning messages. Note that these are not necessarily indicative of problems with the file, but may be useful for users to know before they submit their BLAST job.
   warnings: string[];



   // C-tor
   constructor(fasta_: string, filename_: string, size_: number) {

      // Initialize collections
      this.errors = new Array<FastaError>();
      this.records = new Array<FastaRecord>();
      this.sequenceTypes = new Set<SequenceType>();
      this.warnings = new Array<string>();

      // Set initial values
      this.errorCount = 0;
      this.fasta = fasta_;
      this.filename = filename_;
      this.longestSequence = 0;
      this.records = [];
      this.size = size_;
      this.status = FastaStatus.unvalidated;

      // Use the FASTA to populate the collection of records.
      this.populateRecords();
   }

   // Add a record to the collection.
   addRecord(record_: FastaRecord) {

      if (record_ == null) { return; }

      // Validate the record before adding it.
      record_.validate();

      if (record_.errors.length > 0) {
         this.errors = this.errors.concat(record_.errors);
      }

      // Update the file's sequence types.
      this.sequenceTypes.add(record_.sequenceType);

      // Is this the longest sequence we have encountered?
      if (record_.sequence.length > this.longestSequence) { 
         this.longestSequence = record_.sequence.length; 
      }

      // Add the record to the collection.
      this.records.push(record_);
   }

   // Return an array of error messages by record number.
   getErrors(): Array<string> {
      return this.errors.map(error_ => error_.formatMessage());
   }

   // Get the length of the longest sequence in this file's records.
   getLongestSequenceLength(): number {

      return this.longestSequence;
      /*
      let longest = 0;

      console.log("in getLongestSequenceLength this.records = ", this.records)


      if (this.records.length < 1) { return 0; }

      this.records.forEach(record_ => {
         if (record_.sequence.length > longest) { 
            longest = record_.sequence.length; 
         }
      })

      return longest;*/
   }


   /*
   // Return an array of error messages by record number.
   getErrors(includeFilename_: boolean): Array<string> {

      if (this.errorCount < 1) { return []; }

      let errors = Array<string>();

      const recordCount = this.records.length;

      this.records.forEach((record, index) => {

         if (record.errors.length < 1) { return; }

         record.errors.forEach((error) => {
            
            // Include the line number of the error?
            let lineNumber = isNaN(error.lineNumber) ? "" : ` (line ${error.lineNumber})`;

            // Should we include the filename?
            let location = includeFilename_ ? `File ${this.filename}` : "";

            // If there are multiple records, preface the message with the record number.
            location += recordCount > 1 ? `, Sequence ${index + 1}` : "";
            
            if (location.length > 0) { location += ": "; }
 
            errors.push(`${location}${error.message}${lineNumber}`);
         })

         if (record.warnings.length > 0) {

            record.warnings.forEach((warning) => {

               // Should we include the filename?
               let location = includeFilename_ ? `File ${this.filename}` : "";

               // If there are multiple records, preface the message with the record number.
               location += recordCount > 1 ? `, Sequence ${index + 1}` : "";
               
               if (location.length > 0) { location += ": "; }

               warnings.push(`${location}${warning}`);
            });

            console.log("warnings = ", warnings);
         }
      })

      return errors;
   }*/

   // Parse the FASTA into FastaRecord objects.
   populateRecords() {
   
      // The current record
      let record: FastaRecord = null;
      
      // Normalize all line endings to \n
      const lines = this.fasta.replace(/\r\n?/g, "\n").split("\n");

      // Iterate over all lines
      for (let lineNumber = 1; lineNumber <= lines.length; lineNumber++) {
   
         // Get the next line using a zero-based index and trim whitespace.
         const line = Utils.safeTrim(lines[lineNumber - 1]);
   
         // Ignore empty lines and comments.
         if (!line || line.startsWith(";")) { continue; }
   
         // Is this the header/defline?
         if (line.startsWith(">")) {
   
            // If we were processing a record, validate and store it.
            if (record !== null) { this.addRecord(record); }
   
            // Create a new record.
            record = new FastaRecord(this.filename, this.records.length + 1);
   
            // Populate the header
            record.header = line;
            record.headerLineNumber = lineNumber;
   
            // Skip to the next line.
            continue;
         }
   
         if (record == null) {

            // Create a FASTA record (even though there isn't a header).
            record = new FastaRecord(this.filename, this.records.length + 1);
         }
   
         // Add this line to the record's sequence.
         record.sequence += line + "\n";
      }
   
      // Add the record we've been processing (if any).
      if (record !== null) {
         this.addRecord(record); 
      }

      // Set the file's overall sequence type. If there are multiple sequence types, set it to "mixed". 
      // If there are no valid sequence types, set it to "unknown".
      if (this.sequenceTypes.size === 0) {
         this.sequenceType = SequenceType.unknown;
      } else if (this.sequenceTypes.size === 1) {
         this.sequenceType = this.sequenceTypes.values().next().value;
      } else if (this.sequenceTypes.size > 1) {
         this.sequenceType = SequenceType.mixed;
         this.warnings.push("This file appears to contain a mix of nucleotide and protein sequences");
      }

      // Set the error count
      this.errorCount = this.errors.length;

      // Set the overall status.
      this.status = this.errorCount > 0 ? FastaStatus.invalid : FastaStatus.validated;
   }
}