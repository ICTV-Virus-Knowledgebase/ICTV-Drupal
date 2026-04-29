
import { SequenceType } from "../global/Types";


// After evaluating a FASTA sequence, we determine the most-likely sequence type by counting standard nucleotide 
// and amino acid bases and return this object as the result.
export class SequenceMetadata {
   confidence: number;
   counts: {
      aa: {
         ambiguity: number,
         nonNT: number,
         standard: number
      },
      nt: {
         ambiguity: number,
         standard: number
      },
      total: number;
   };
   fractions: {
      aa: {
         all: number,
         nonNT: number,
         standard: number
      },
      nt: {
         all: number,
         standard: number
      }
   };
   type: SequenceType;

   // C-tor
   constructor() {
      this.confidence = 0;
      this.counts = {
         aa: {
            ambiguity: 0,
            nonNT: 0,
            standard: 0
         },
         nt: {
            ambiguity: 0,
            standard: 0
         },
         total: 0
      };
      this.fractions = {
         aa: {
            all: 0,
            nonNT: 0,
            standard: 0
         },
         nt: {
            all: 0,
            standard: 0
         }
      };
      this.type = SequenceType.unknown;
   }
   
}