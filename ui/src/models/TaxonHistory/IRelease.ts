
import { ITaxon } from "./ITaxon";

export interface IRelease {
    rankNames: string;
    releaseNumber: number;
    taxa: ITaxon[];
    taxaElement: HTMLElement;
    title: string;
    treeID: number;
    year: string;
}