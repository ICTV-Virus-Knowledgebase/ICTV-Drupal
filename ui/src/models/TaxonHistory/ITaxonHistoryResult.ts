
import { IRelease } from "./IRelease";
import { ITaxon } from "./ITaxon";
import { ITaxonDetail } from "./ITaxonDetail";

export interface ITaxonHistoryResult {
    currentTaxon: ITaxonDetail;
    messages: string;
    releases: IRelease[];
    selectedTaxon: ITaxonDetail;
    taxa: ITaxon[];
}