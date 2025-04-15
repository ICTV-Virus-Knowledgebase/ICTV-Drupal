
import { IRelease } from "./IRelease";
import { ITaxon } from "./ITaxon";

export interface ITaxonHistoryResult {
   messages: string;
   releases: IRelease[];
   selectedTaxon: ITaxon;
   taxa: ITaxon[];
}