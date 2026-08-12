
import { ISearchResult } from "./ISearchResult"

export interface IIctvResult {
   exemplar: string;
   family: string;
   genbankAccession: string;
   genus: string;
   matches: ISearchResult[];
   mslRelease: number;
   name: string;
   rankName: string;
   subfamily: string;
   subgenus: string;
   taxnodeID: number;
}