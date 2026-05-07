
import { FastaError } from "./FastaError";
import { FastaStatus, REGEX, SequenceType } from "../global/Types";
import { Utils } from "../helpers/Utils";


// A FASTA record
export class FastaRecord {

   // Errors encountered while parsing the record.
   errors: FastaError[];

   // The name of the file that contains the record.
   filename: string; 

   // The header/defline
   header: string;

   headerLineNumber: number;

   recordNumber: number;

   // The sequence of nucleotide or protein bases.
   sequence: string;

   // Is the sequence nucleotide, protein, or ambiguous/unknown? This is determined during validation.
   sequenceType: SequenceType;
   
   // The validation status of the record.
   status: FastaStatus;

   // How confident are we in the sequence type? 
   //typeConfidence: number;

   // Warnings
   warnings: string[];


   // C-tor
   constructor(filename_: string, recordNumber_: number) {
      this.errors = [];
      this.filename = filename_;
      this.header = "";
      this.headerLineNumber = NaN;
      this.recordNumber = recordNumber_;
      this.sequence = "";
      this.sequenceType = SequenceType.unknown;
      this.status = FastaStatus.unvalidated;
      //this.typeConfidence = NaN;
      this.warnings = [];
   }

   // Add an error and invalidate the record.
   addError(message_: string, lineNumber_?: number): void { 
      this.status = FastaStatus.invalid;
      this.errors.push(new FastaError(message_, lineNumber_, this.filename, this.recordNumber));
   }

   // Get the ID from the FASTA header.
   getHeaderID(): string {

      if (!this.header) { return ""; }

      // Everything after the > and before the first space is the ID.
      const spaceIndex = this.header.indexOf(" ");
      if (spaceIndex > -1) {  
         return this.header.substring(1, spaceIndex);
      } else {
         return this.header.substring(1);
      }
   }

   // Validate the object. Note that the addError() method sets the status to "invalid".
   validate() {

      // Do we already know that it's invalid?
      if (this.status === FastaStatus.invalid) { return; }

      let isSequenceEmpty = false;
      let isSequenceValid = true;

      // Trim the sequence, remove whitespace, and validate it.
      this.sequence = Utils.safeTrim(this.sequence).replace(/\s+/g, "");
      if (this.sequence.length < 1) {
         isSequenceEmpty = true;
      } else if (REGEX.NOT_AA_OR_NT.test(this.sequence)) {
         isSequenceValid = false;
      }

      // Determine the sequence type and confidence level.
      const typeResult = Utils.classifyFastaSequence(this.sequence);
      this.sequenceType = typeResult.type;

      if (isSequenceEmpty) {
         this.status = FastaStatus.empty;
         this.addError("No sequence data was provided");

      } else if (!isSequenceValid) {
         this.status = FastaStatus.invalid;
         this.addError("The sequence contains symbols that aren't IUPAC-approved nucleotide or protein bases");

      } else {
         this.status = FastaStatus.valid;
      }

      if (this.sequenceType === SequenceType.ambiguous) {
         this.warnings.push("Unable to determine if the sequence is nucleotide or protein because the FASTA contains valid bases for both types");
      } 

      return;
   }

}