import { NameClass, TaxonomyDB } from "../../global/Types";

export interface ISearchResult {

   // The NCBI division (phages, viruses)
   division: string;
         
   // Prefer virus and phage results over anything else.
   divisionScore: number;

   // The result's exemplar virus (optional).
   exemplar: string;

   // The taxon's family name.
   family: string;

   // Does the first character of the search text match the first character of the matching name?
   firstCharacterMatch: number;

   // The exemplar virus' GenBank accession numbers.
   genbankAccession: string;
   
   // The taxon's genus name.
   genus: string;

   // Does the matching taxon have an associated ICTV result?
   hasTaxnodeID: number;

   // A scientific name corresponding to an NCBI taxon name with a different name class. The scientific name is what matches an ICTV taxon.
   intermediateName: string;
   intermediateRank: string;
   
   // Is this an exact match?
   isExactMatch: number;

   // Is this a valid taxon (not obsolete)?
   isValid: number;

   // How much did the search text's length differ from the match's length?
   lengthDifference: number;

   // The matching name
   name: string;

   // The name class/type, inspired by NCBI name class.
   nameClass: NameClass;
   nameClassScore: number;

   // The match's taxonomic rank.
   rankName: string;

   // Ranks found in ICTV, VMR, and NCBI Taxonomy (virus and phage divisions only).
   // Prefer lower ranks over higher ranks.
   rankScore: number;

   // How recent is the ICTV result?
   recentResultScore: number;

   // ICTV results
   resultMslRelease: number;
   resultName: string;
   resultRankName: string;
   resultTaxnodeID: number;

   // The overall score.
   score: number;
   
   // The taxon's subfamily and subgenus names.
   subfamily: string;
   subgenus: string;

   // The match's taxonomy database
   taxonomyDB: TaxonomyDB;

   // Taxonomy databases in order of preference.
   taxonomyDbScore: number;

   // The match's unique identifier in its taxonomy database.
   taxonomyID: number;

   // The version of the match (for ICTV this is MSL release number).
   versionID: number;
}