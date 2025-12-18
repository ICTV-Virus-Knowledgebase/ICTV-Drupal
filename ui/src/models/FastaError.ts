
// An error found in a FASTA file.
export class FastaError {

   lineNumber: number;
   message: string;

   // C-tor
   constructor(message_: string, lineNumber_: number = NaN) {
      this.lineNumber = lineNumber_;
      this.message = message_ || "Unknown error";
   }
}