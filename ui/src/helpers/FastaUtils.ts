
// A collection of utilities for parsing and validating FASTA sequences.

// A regex for valid amino acids (proteins) in a FASTA sequence.
//export const FASTA_AA_REGEX = /^[ACDEFGHIKLMNPQRSTVWY]+$/i;

// A regex for valid nucleotides in a FASTA sequence.
export const FASTA_NT_REGEX = /^[ACGTURYSWKMBDHVN\.\-]+$/i;



// A FASTA record
export interface IFastaRecord {

  // The identifier after '>' up to first whitespace.
  id: string;

  // Any remaining text on the header line after the id.
  description: string;

  // Sequence with whitespace removed and line-breaks collapsed.
  sequence: string[];
}


// A quick validator for IUPAC approved bases.
export function IsValidFastaSequence(sequence_: string): boolean {
   const upperCase = sequence_.toUpperCase();
   return FASTA_NT_REGEX.test(upperCase);
}


// Parse text for one or more FASTA records, optionally validating the sequences.
export function ParseFASTA(fasta_: string, validate_: boolean): IFastaRecord[] {

   let records: IFastaRecord[] = [];

   // Normalize all line endings to \n
   const lines = fasta_.replace(/\r\n?/g, "\n").split("\n");

   let record: IFastaRecord = null;

   lines.forEach((line_: string) => {

      const line = line_.trim();

      if (!line) { return; }
      if (line.startsWith(";")) { return; }

      // Is this the header/defline?
      if (line.startsWith(">")) {

         if (record !== null) { records.push(record); }

         // Parse header
         const header = line.slice(1).trim();
         if (!header) { throw new Error("Encountered '>' header with no identifier"); }

         // Create a new record.
         record = {
            id: null,
            description: null,
            sequence: []
         } as IFastaRecord;

         const spaceIndex = header.search(/\s/);
         if (spaceIndex === -1) {
            record.id = header;
            record.description = "";
         } else {
            record.id = header.slice(0, spaceIndex);
            record.description = header.slice(spaceIndex + 1).trim();
         }

         // Skip to the next line.
         return;
      }

      console.log(`Processing line: ${line} and record is `, record)

      // Is the current record valid?
      if (!record || !record.id) { throw new Error("Invalid record: Unable to add sequence line"); }

      // Is the FASTA sequence valid?
      if (validate_ && !IsValidFastaSequence(line)) { throw new Error(`The following line of FASTA sequence ${records.length + 1} is invalid: ${line}`); }

      // Update the current record's sequence.
      record.sequence.push(line);
   })

   if (!!record) { records.push(record); }

   return records;
}
