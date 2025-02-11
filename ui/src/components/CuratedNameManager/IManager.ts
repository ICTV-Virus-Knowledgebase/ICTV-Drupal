import { ICuratedName } from "../../models/ICuratedName";


export interface IManager {

   // The auth token
   readonly authToken: string;

   // The container Element.
   readonly containerEl: HTMLElement;

   // The DOM selector of the module's container Element.
   readonly containerSelector: string;

   // User information
   readonly user: {
      email: string, 
      name: string,
      uid: number
   }


   //----------------------------------------------------------------------------------------------------------------
   // Methods
   //----------------------------------------------------------------------------------------------------------------

   // Create a new curated name.
   createName(curatedName_: ICuratedName);

   // Handle a request to delete a curated name.
   deleteName(uid_: string): Promise<any>;

   // Format and return the taxon name and rank.
   formatTaxonNameAndRank(name_: string, rankName_: string): string;
   
   // Handle a request to get a curated name by UID.
   getName(uid_: string): Promise<ICuratedName>;

   // Handle a request to return all curated names.
   getNames(): Promise<ICuratedName[]>;

   // Handle a request to create a curated name.
   navigateToCreateView();

   // Handle a request to edit a curated name.
   navigateToEditView(uid_: string);

   // Update a curated name.
   updateName(curatedName_: ICuratedName);

}