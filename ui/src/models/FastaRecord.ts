
import { FastaError } from "./FastaError";
import { FastaStatus, REGEX } from "../global/Types";
import { Utils } from "../helpers/Utils";


// A FASTA record
export class FastaRecord {

   // Errors encountered while parsing the record.
   errors: FastaError[];

   // The header/defline
   header: string;

   headerLineNumber: number;

   // The sequence of nucleotide or protein bases.
   sequence: string;

   // The validation status of the record.
   status: FastaStatus;


   // C-tor
   constructor() {
      this.errors = [];
      this.header = "";
      this.headerLineNumber = NaN;
      this.sequence = "";
      this.status = FastaStatus.unvalidated;
   }

   // Add an error and invalidate the record.
   addError(message_: string, lineNumber_?: number): void { 
      this.status = FastaStatus.invalid;
      this.errors.push(new FastaError(message_, lineNumber_));
   }

   // Get the ID from the FASTA header.
   getHeaderID(): string {

      if (!this.header) { return ""; }

      const spaceIndex = this.header.indexOf(" ");
      if (spaceIndex > -1) {
         return this.header.substring(1, spaceIndex);
      } else {
         return this.header.substring(1);
      }
   }

   // Validate the object. Note that the addError() method sets the status to "invalid".
   validate() {

      // Do we already know that it's invalid or empty?
      if (this.status === FastaStatus.invalid || this.status === FastaStatus.empty) { return; }

      let isHeaderEmpty = false;
      let isSequenceEmpty = false;
      let isSequenceValid = true;

      // Validate the FASTA header/defline
      this.header = Utils.safeTrim(this.header);
      if (this.header.length < 2) { isHeaderEmpty = true; }

      // Trim the sequence, remove whitespace, and validate it.
      this.sequence = Utils.safeTrim(this.sequence).replace(/\s+/g, "");
      if (this.sequence.length < 1) {
         isSequenceEmpty = true;
      } else if (REGEX.FASTA_INVALID_BASES.test(this.sequence)) {
         isSequenceValid = false;
      }

      if (isHeaderEmpty && isSequenceEmpty) {
         this.status = FastaStatus.empty;
      } else if (isHeaderEmpty) {
         this.addError("The header/defline is invalid", this.headerLineNumber);
      } else if (isSequenceEmpty) {
         this.addError("No sequence data was provided", this.headerLineNumber);
      } else if (!isSequenceValid) {
         this.addError("The sequence contains symbols that aren't IUPAC-approved nucleotide or protein bases", this.headerLineNumber);
      } else {
         this.status = FastaStatus.valid;
      }
   }

}