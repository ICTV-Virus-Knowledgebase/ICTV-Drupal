
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { CuratedNameService } from "../../services/CuratedNameService";
import { EditView } from "./EditView";
import { ICuratedName } from "./ICuratedName";
import { IManager } from "./IManager";
import { TableView } from "./TableView";
import { ViewMode } from "./Terms";


export class CuratedNameManager implements IManager {

   authToken: string;

   // The container Element.
   containerEl: HTMLElement;

   // The DOM selector of the module's container Element.
   containerSelector: string = null;

   editView: EditView;

   icons: {
      add: string,
      spinner: string
   }

   tableView: TableView;

   // User information
   user: {
      email: string, 
      name: string,
      uid: number
   }


   // C-tor
   constructor(authToken_: string, containerSelector_: string, userEmail_: string, userName_: string, userUID_: number) {

      // TODO: validate the auth token
      this.authToken = authToken_;

      // TESTING: If authToken isn't null the web service will try to use it to authenticate.
      this.authToken = null;

      if (!containerSelector_) { throw new Error("Invalid container selector in CuratedNameManager"); }
      this.containerSelector = containerSelector_;

      // TODO: validate user parameters.

      // Get the container Element.
      this.containerEl = document.querySelector(this.containerSelector);
      if (!this.containerEl) { AlertBuilder.displayErrorSync("Invalid container Element"); }

      this.icons = {
         add: `<i class="fa-solid fa-plus add-icon"></i>`,
         spinner: `<i class="fa fa-spinner fa-spin spinner-icon"></i>`
      }

      this.user = {
         email: userEmail_,
         name: userName_,
         uid: userUID_
      }

      /*
      // Initialize the object.
      this.initialize().then(result => {
         console.log("Async result:", result);
      }).catch(error => {
            console.error("Error:", error);
      });*/
   }


   async createName() {

      console.log("In createName")
      return;
   }

   // Handle a request to delete a curated name.
   async deleteName(uid_: string): Promise<any> {
      return await CuratedNameService.deleteCuratedName(this.authToken, uid_, this.user.email, this.user.uid);
   }
   
   // Handle a request to edit a curated name.
   async editName(uid_: string) {
      this.editView.initialize(uid_, ViewMode.edit);
      return;
   }

   async getName(uid_: string): Promise<ICuratedName> {
      return await CuratedNameService.getCuratedName(this.authToken, uid_, this.user.email, this.user.uid);
   }

   async getNames(): Promise<ICuratedName[]> {
      return await CuratedNameService.getCuratedNames(this.authToken, this.user.email, this.user.uid);
   }


   async initialize() {
   
      // Create a new instance of "edit view".
      this.editView = new EditView(this.containerEl, this);

      // Create a new instance of "table view" and initialize it.
      this.tableView = new TableView(this.containerEl, this);
      await this.tableView.initialize();

      return;
   }


}