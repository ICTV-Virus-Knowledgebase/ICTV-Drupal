
import { CuratedTaxonType, NameClass, TaxonomyRank } from "../../global/Types";

export interface ICuratedTaxon {
   id: number;
   ictvID: number;
   ictvName: string;
   ictvTaxnodeID: number;
   isActive: boolean;
   name: string;
   nameClass: NameClass;
   rankName: TaxonomyRank;
   type: CuratedTaxonType;
   comments: string;
}