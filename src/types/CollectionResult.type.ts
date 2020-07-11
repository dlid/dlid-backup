import { Archive } from "../archive/Archive";

export interface CollectionResult { 
    /**
     * True if anything was collected by the collector
     */
    isCollected: boolean; 
    
    /**
     * The filename of the zipfile
     */
    zipFilename: string, 

    /**
     * The the archive in which the data is stored
     */
    archive: Archive;
}
