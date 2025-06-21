
import { ITaxon } from "./ITaxon";

export interface IRelease {
   isCurrent: boolean;
   isVisible: boolean;
   rankNames: string;
   releaseNumber: number;
   title: string;
   year: string;

   // The following properties are added after the JSON is returned by the web service.
   bodyElement?: HTMLElement;
   taxa?: ITaxon[];
}
