
import { IRelease } from "./IRelease";
import { ITaxon } from "./ITaxon";
import { ITaxonDetail } from "./ITaxonDetail";

export interface ITaxonHistoryResult {
    detail: ITaxonDetail;
    messages: string;
    releases: IRelease[];
    taxa: ITaxon[];
}