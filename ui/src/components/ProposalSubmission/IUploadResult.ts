
import { IValidatorResult } from "./IValidatorResult";

export interface IUploadResult {
    fileID: string;
    filename: string;
    jobUID: string;
    validatorResult: IValidatorResult;
}