
import { BlastTask, Constants } from "./Common";
import { Utils } from "../../helpers/Utils";

// BLAST parameters
export class BlastParams {

   maxHSPS: number;
   maxTargetSeqs: number;
   task: BlastTask;

   // C-tor
   constructor(maxHSPS_: number, maxTargetSeqs_: number, task_: string) {
      this.maxHSPS = !isNaN(maxHSPS_) && maxHSPS_ > 0 ? maxHSPS_ : Constants.DEFAULT_MAX_HSPS;
      this.maxTargetSeqs = !isNaN(maxTargetSeqs_) && maxTargetSeqs_ > 0 ? maxTargetSeqs_ : Constants.DEFAULT_MAX_TARGET_SEQS;
      this.task = Object.values(BlastTask).includes(task_ as BlastTask) ? task_ as BlastTask : Constants.DEFAULT_BLAST_TASK;
   }
}