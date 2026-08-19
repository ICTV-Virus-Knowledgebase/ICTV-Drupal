
import { IMslRelease } from "../../models/IMslRelease";


// The response from the getReleaseHistory web service.
export interface IReleaseHistoryResult {
   releases: IMslRelease[]
}