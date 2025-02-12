
import { ICuratedName } from "../models/ICuratedName";
import { IResult } from "../models/IResult";
import { WebService } from "../services/WebService";
import { WebServiceKey } from "../global/Types";


export class _CuratedNameService {


   // Create a new curated name.
   async createCuratedName(authToken_: string, curatedName_: ICuratedName, userEmail_: string, userUID_: number): Promise<IResult> {

      const data = {
         curatedName: curatedName_,
         userEmail: userEmail_,
         userUID: userUID_
      }

      return await WebService.drupalPost<IResult>(WebServiceKey.createCuratedName, authToken_, data);
   }


   // Delete the curated name with this UID.
   async deleteCuratedName(authToken_: string, uid_: string, userEmail_: string, userUID_: number): Promise<IResult> {
      
      const data = {
         uid: uid_,
         userEmail: userEmail_,
         userUID: userUID_
      }

      return await WebService.drupalPost<IResult>(WebServiceKey.deleteCuratedName, authToken_, data);
   }


   // Get the curated name with this UID.
   async getCuratedName(authToken_: string, uid_: string, userEmail_: string, userUID_: number): Promise<ICuratedName> {

      const data = {
         uid: uid_,
         userEmail: userEmail_,
         userUID: userUID_
      }

      return await WebService.drupalGet<ICuratedName>(WebServiceKey.getCuratedName, authToken_, data) as ICuratedName;
   }


   // Get all curated names.
   async getCuratedNames(authToken_: string, userEmail_: string, userUID_: number): Promise<ICuratedName[]> {

      const data = {
         userEmail: userEmail_,
         userUID: userUID_
      }

      return await WebService.drupalGet<ICuratedName[]>(WebServiceKey.getCuratedNames, authToken_, data) as ICuratedName[];
   }

   
   // Update an existing curated name.
   async updateCuratedName(authToken_: string, curatedName_: ICuratedName, userEmail_: string, userUID_: number): Promise<IResult> {

      const data = {
         curatedName: curatedName_,
         userEmail: userEmail_,
         userUID: userUID_
      }

      return await WebService.drupalPost(WebServiceKey.updateCuratedName, authToken_, data) as IResult;
   }

}

// Create a singleton instance of _CuratedNameService.
export const CuratedNameService = new _CuratedNameService();