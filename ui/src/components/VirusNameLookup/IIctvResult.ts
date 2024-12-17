
import { ISearchResult } from "./ISearchResult"

export interface IIctvResult {
   matches: ISearchResult[];
   mslRelease: number;
   name: string;
   rankName: string;
   taxnodeID: number;

   family: string;
   subfamily: string;
   genus: string;
   subgenus: string;
}