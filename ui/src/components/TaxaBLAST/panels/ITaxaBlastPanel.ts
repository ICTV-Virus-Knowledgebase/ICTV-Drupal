
import { TaxaBLAST } from '../TaxaBLAST';


export interface ITaxaBlastPanel {

   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: TaxaBLAST;

   // Load the panel contents and display them on the page.
   load();

   // Unload and hide the panel contents.
   unload();
}