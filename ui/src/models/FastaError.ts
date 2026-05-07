
// An error found in a FASTA file.
export class FastaError {

   filename: string;
   lineNumber: number;
   message: string;
   recordNumber: number;

   // C-tor
   constructor(message_: string, lineNumber_?: number, filename_?: string, recordNumber_?: number) {
      this.filename = filename_;
      this.lineNumber = lineNumber_ ;
      this.message = message_ || "Unknown error";
      this.recordNumber = recordNumber_;
   }

   formatMessage() {

      // Include the line number of the error?
      let lineNumber = isNaN(this.lineNumber) ? "" : ` (line ${this.lineNumber})`;

      // Include the filename?
      let location = !this.filename ? "" : `File ${this.filename}`;

      // If there are multiple records, preface the message with the record number.
      location += isNaN(this.recordNumber) ? "" : `, Record ${this.recordNumber}`;
      
      if (location.length > 0) { location += ": "; }

      return `${location}${this.message}${lineNumber}`;
   }
}