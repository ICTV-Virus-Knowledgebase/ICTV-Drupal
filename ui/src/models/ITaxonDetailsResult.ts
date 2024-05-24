
import { ILineageNode } from "../models/ILineageNode";
import { IReleaseListEntry } from "../models/IReleaseListEntry";


export interface ITaxonDetailsResult {
    lineage: ILineageNode[];
    releases: IReleaseListEntry[];
}
