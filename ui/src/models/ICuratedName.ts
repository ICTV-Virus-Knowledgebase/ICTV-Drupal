
import { CuratedNameType, TaxonomyRank } from "../global/Types";

export interface ICuratedName {
   comments: string;
   createdBy?: string;
   createdOn?: string;
   ictvTaxnodeID: number;
   isValid?: boolean;
   name: string;
   rankName?: TaxonomyRank;
   taxonName?: string;
   type: CuratedNameType;
   uid?: string;
   versionID?: number;
}