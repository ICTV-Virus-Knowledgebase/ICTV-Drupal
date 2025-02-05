import { ICuratedName } from "./ICuratedName";


export interface IManager {

   // The auth token
   readonly authToken: string;

   // The container Element.
   readonly containerEl: HTMLElement;

   // User information
   readonly user: {
      email: string, 
      name: string,
      uid: number
   }


   // Methods
   
   // Handle a request to create a curated name.
   createName();

   // Handle a request to delete a curated name.
   deleteName(uid_: string): Promise<any>;

   // Handle a request to edit a curated name.
   editName(uid_: string);

   // Handle a request to get a curated name by UID.
   getName(uid_: string): Promise<ICuratedName>;

   // Handle a request to return all curated names.
   getNames(): Promise<ICuratedName[]>;
}