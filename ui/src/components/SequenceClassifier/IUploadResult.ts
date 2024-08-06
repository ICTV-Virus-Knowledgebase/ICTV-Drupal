
import { IClassifierResult } from "./IClassifierResult";

export interface IUploadResult {
    fileID: string;
    filename: string;
    jobUID: string;
    classifierResult: IClassifierResult;
}