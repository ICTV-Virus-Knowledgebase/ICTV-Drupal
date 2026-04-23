
import { FastaStatus, SequenceType } from "../global/Types";
import { FastaRecord } from "./FastaRecord";
import { Utils } from "../helpers/Utils";


export class FastaFile {

   // The number of errors found in the file.
   errorCount: number;

   // An array of error messages. Note that this will be updated at the end of the validation process.
   errors: string[];

   // The raw FASTA text.
   fasta: string;

   // The name of the file.
   filename: string;

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
      this.errors = new Array<string>();
      this.records = new Array<FastaRecord>();
      this.sequenceTypes = new Set<SequenceType>();
      this.warnings = new Array<string>();

      // Set initial values
      this.errorCount = 0;
      this.fasta = fasta_;
      this.filename = filename_;
      this.records = [];
      this.size = size_;
      this.status = FastaStatus.unvalidated;

      // Use the FASTA to populate the collection of records.
      this.populateRecords();
   }

   // Add a record to the collection.
   addRecord(record_: FastaRecord) {

      console.log("In addRecord with record: ", record_);

      if (record_ == null) { return; }

      // Validate the record before adding it.
      record_.validate();

      // Update the file's error count.
      this.errorCount += record_.errors.length;
      this.records.push(record_);

      // Update the file's sequence types.
      this.sequenceTypes.add(record_.sequenceType);
   }

   // Return an array of error messages by record number.
   getErrors(includeFilename_: boolean): Array<string> {

      if (this.errorCount < 1) { return []; }

      let errors = Array<string>();

      // TEST
      let warnings = Array<string>();

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
   }

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
            record = new FastaRecord();
   
            // Populate the header
            record.header = line + "\n";
            record.headerLineNumber = lineNumber;
   
            // Skip to the next line.
            continue;
         }
   
         if (record == null) {
            
            console.log("record is null and line = ", line)

            record = new FastaRecord();
            record.addError("Invalid header/defline", lineNumber);
            continue;
         }
   
         // Add this line to the record's sequence.
         record.sequence += line + "\n";
      }
   
      // Add the record we've been processing (if any).
      if (record !== null) {
         this.addRecord(record); 
      }

      if (this.sequenceTypes.size > 1) {
         let warning = "This file appears to contain a mix of nucleotide and protein sequences";
         this.warnings.push(warning);
      }

      // Set the file's overall sequence type. If there are multiple sequence types, set it to "mixed". If there are no valid sequence types, set it to "unknown".
      if (this.sequenceTypes.size === 0) {
         this.sequenceType = SequenceType.unknown;
      } else if (this.sequenceTypes.size === 1) {
         this.sequenceType = this.sequenceTypes.values().next().value;
      } else if (this.sequenceTypes.size > 1) {
         this.sequenceType = SequenceType.mixed;
      }

      // Set the overall status.
      this.status = FastaStatus.validated;
   }
}