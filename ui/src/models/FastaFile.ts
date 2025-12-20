
import { FastaStatus } from "../global/Types";
import { FastaRecord } from "./FastaRecord";
import { Utils } from "../helpers/Utils";


export class FastaFile {

   // The number of errors found in the file.
   errorCount: number;

   // The raw FASTA text.
   fasta: string;

   // The name of the file.
   filename: string;

   // The parsed FASTA records.
   records: FastaRecord[];
   
   // The size of the file in bytes.
   size: number;

   // The validation status.
   status: FastaStatus;


   // C-tor
   constructor(fasta_: string, filename_: string, size_: number) {
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

      if (record_ == null) { return; }

      // Validate the record before adding it.
      record_.validate();

      // Update the file's error count.
      this.errorCount += record_.errors.length;
      this.records.push(record_);
   }

   // Return an array of error messages by record number.
   getErrors(): string[] {

      let errors = [];

      if (this.errorCount < 1) { return errors; }

      const recordCount = this.records.length;

      this.records.forEach((record, index) => {

         if (record.errors.length < 1) { return; }

         let recordErrors = "";

         record.errors.forEach((error) => {
            
            let lineNumber = isNaN(error.lineNumber) ? "" : ` (line ${error.lineNumber})`;

            if (recordErrors.length > 0) { recordErrors += "; "; }
            recordErrors += `${error.message}${lineNumber}`;
         })

         if (recordErrors.length > 0) {

            // If there are multiple records, preface the message with the record number.
            let sequenceLabel = recordCount > 1 ? `Sequence ${index + 1}: ` : "";
            errors.push(`${sequenceLabel}${recordErrors}`); 
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
      if (record !== null) { this.addRecord(record); }

      // Set the overall status.
      this.status = FastaStatus.validated;
   }
}