
//import { SequenceSearch } from './SequenceSearch';

export interface ISeqSearchPanel {

   // Is the panel currently active/displayed?
   isActive: boolean;

   // Load the panel contents and display them on the page.
   load();

   // Unload and hide the panel contents.
   unload();
}