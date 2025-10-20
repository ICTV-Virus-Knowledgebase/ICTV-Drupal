
import { BlastTask, Constants } from "./Common";
import { Utils } from "../../helpers/Utils";

// BLAST parameters
export class BlastParams {

   maxHSPS: number;
   maxTargetSeqs: number;
   task: BlastTask;

   // C-tor
   constructor(maxHSPS_: string, maxTargetSeqs_: string, task_: string) {
      
      // Get and validate the maxHSPS.
      let maxHSPS = parseInt(Utils.safeTrim(maxHSPS_));
      this.maxHSPS = !isNaN(maxHSPS) && maxHSPS > 0 ? maxHSPS : Constants.DEFAULT_MAX_HSPS;
      
      // Get and validate the maxTargetSeqs.
      let maxTargetSeqs = parseInt(Utils.safeTrim(maxTargetSeqs_));
      this.maxTargetSeqs = !isNaN(maxTargetSeqs) && maxTargetSeqs > 0 ? maxTargetSeqs : Constants.DEFAULT_MAX_TARGET_SEQS;

      // Get and validate the task.
      let task = Utils.safeTrim(task_);
      this.task = Object.values(BlastTask).includes(task as BlastTask) ? task as BlastTask : Constants.DEFAULT_BLAST_TASK;
   }
}