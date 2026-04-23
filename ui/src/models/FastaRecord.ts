
import { FastaError } from "./FastaError";
import { FastaStatus, REGEX, SequenceType } from "../global/Types";
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

   // Is the sequence nucleotide, protein, or ambiguous/unknown? This is determined during validation.
   sequenceType: SequenceType;
   
   // The validation status of the record.
   status: FastaStatus;

   // How confident are we in the sequence type? 
   typeConfidence: number;

   // TEST
   warnings: string[];


   // C-tor
   constructor() {
      this.errors = [];
      this.header = "";
      this.headerLineNumber = NaN;
      this.sequence = "";
      this.sequenceType = SequenceType.unknown;
      this.status = FastaStatus.unvalidated;
      this.typeConfidence = NaN;
      this.warnings = [];
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

      // Do we already know that it's invalid?
      if (this.status === FastaStatus.invalid) { return; }

      let isHeaderEmpty = false;
      let isHeaderValid = true;
      let isSequenceEmpty = false;
      let isSequenceValid = true;

      // Validate the FASTA header/defline
      this.header = Utils.safeTrim(this.header);
      if (this.header.length === 1) {
         isHeaderValid = false;
      } else if (this.header.length < 1) { 
         isHeaderEmpty = true; 
      }

      // Trim the sequence, remove whitespace, and validate it.
      this.sequence = Utils.safeTrim(this.sequence).replace(/\s+/g, "");
      if (this.sequence.length < 1) {
         isSequenceEmpty = true;
      } else if (REGEX.NOT_AA_OR_NT.test(this.sequence)) {
         isSequenceValid = false;
      }

      // Determine the sequence type and confidence level.
      const typeResult = Utils.classifyFastaSequence(this.sequence);
      console.log("In fastaRecord validate, typeResult = ", typeResult);
      this.sequenceType = typeResult.type;

      if (isHeaderEmpty && isSequenceEmpty) {
         this.status = FastaStatus.empty;

      } else if (isHeaderEmpty || !isHeaderValid) {
         this.addError("The header/defline is invalid", this.headerLineNumber);

      } else if (isSequenceEmpty) {
         this.addError("No sequence data was provided", this.headerLineNumber);

      } else if (!isSequenceValid) {
         this.addError("The sequence contains symbols that aren't IUPAC-approved nucleotide or protein bases", this.headerLineNumber);

      } else {
         this.status = FastaStatus.valid;
      }

      if (this.sequenceType === SequenceType.ambiguous) {
         this.warnings.push("Unable to determine if the sequence is nucleotide or protein because the FASTA contains valid bases for both types");
      } 

      return;
   }

}