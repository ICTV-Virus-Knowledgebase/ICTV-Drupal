
// A collection of utilities for parsing and validating FASTA sequences.

// A regex for valid amino acids (proteins) in a FASTA sequence.
export const FASTA_AA_REGEX = /^[ACDEFGHIKLMNPQRSTVWY]+$/i;

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
   return FASTA_AA_REGEX.test(upperCase) || FASTA_AA_REGEX.test(upperCase);
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


/**
 * A generator that parses FASTA text and yields records one-by-one.
 * - Ignores blank lines and ';' comment lines
 * - Collapses whitespace in sequences
 * - Throws if sequence is encountered before a header

export function* parseFasta(text: string): Generator<FastaRecord> {

   // Normalize all line endings to \n
   const lines = text.replace(/\r\n?/g, "\n").split("\n");

   let currentId: string | null = null;
   let currentDesc = "";
   let seqChunks: string[] = [];

   const flush = () => {
      if (currentId === null) return;
      const seq = seqChunks.join("");
      const rec: FastaRecord = { id: currentId, description: currentDesc, seq };
      currentId = null;
      currentDesc = "";
      seqChunks = [];
      return rec;
   };

   for (const raw of lines) {

      const line = raw.trim();

      if (!line) continue; 
      if (line.startsWith(";")) continue;

      if (line.startsWith(">")) {

         // Emit previous record (if any)
         const rec = flush();
         if (rec) yield rec;

         // Parse header
         const header = line.slice(1).trim();
         if (!header) { throw new Error("Encountered '>' header with no identifier"); }

         // id = first token; description = rest
         const firstSpace = header.search(/\s/);
         if (firstSpace === -1) {
            currentId = header;
            currentDesc = "";
         } else {
            currentId = header.slice(0, firstSpace);
            currentDesc = header.slice(firstSpace + 1).trim();
         }

         continue;
      }
      // TODO: Add validation here!

      // Sequence line
      if (currentId === null) { throw new Error("Found sequence data before any header ('>' line). Invalid FASTA."); }

      // Remove all whitespace inside sequence lines
      seqChunks.push(line.replace(/\s+/g, ""));
   }

   // Emit the final record
   const finalRec = flush();
   if (finalRec) yield finalRec;
}

// Convenience: parse to an array instead of a generator.
export function parseFastaToArray(text: string): FastaRecord[] {
   return Array.from(parseFasta(text));
} */



/*

// --- Example usage ---
const fastaText = `
>seq1 some description
ACGTACGT
ACGT
; this is a comment line
>seq2
NNNN-ACGT
`;

for (const rec of parseFasta(fastaText)) {
   console.log(rec.id, rec.description, rec.seq.length);
   const invalid = findInvalidBases(rec.seq);
   if (invalid.length) {
      console.warn(`Invalid symbols in ${rec.id}:`, invalid.slice(0, 5), "…");
   }
}

// Or get them all at once
const records = parseFastaToArray(fastaText);

*/
