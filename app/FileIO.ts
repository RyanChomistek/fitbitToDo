import { inbox, outbox } from "file-transfer";
import {CustomEventHandler} from '../common/CustomEventHandler'
import { memory } from 'system';

export let NetworkEventHandler = new CustomEventHandler();

inbox.onnewfile = function () {
    var fileName;
	do 
	{
        // If there is a file, move it from staging into the application folder
        fileName = inbox.nextFile();
        if (fileName) {
            NetworkEventHandler.Invoke(fileName, fileName);
        }
    } while(fileName)

    console.log("JS memory: " + memory.js.used + "/" + memory.js.total);
}