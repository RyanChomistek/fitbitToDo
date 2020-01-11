import { readFileSync } from 'fs';
import { outbox } from "file-transfer";
import { encode, decode } from 'cbor';

import { RequestTypes } from '../common/constants'

export var taskDataStreamer = CreateTasksDataStreamer();
export var taskFolderDataStreamer = CreateTaskFolderDataStreamer();

function CreateDataStreamer()
{
    var dataStreamer = {
        requestName: "default",
        responseName: "default",
        requestType: -1,
        collection: null,
        maxSize: 15,
        startIndex: 0,
        endIndex:0,
        RequestNewCollection: (requestPayload) =>{
            requestPayload.s = 0;
            requestPayload.t = dataStreamer.maxSize;
            requestPayload.resName = dataStreamer.responseName;
            requestPayload.reqType = dataStreamer.requestType;
            requestPayload.data = "123456789012345678901234567890"
            //requestPayload.data2 = "123456789012345678901234567890123456789012345678901234567890"
            console.log(dataStreamer.requestName +"|"+ JSON.stringify(requestPayload) + "|" + JSON.stringify(requestPayload).length)
            console.log(JSON.stringify(requestPayload))
            outbox.enqueue(dataStreamer.requestName, encode(JSON.stringify(requestPayload))).then((ft) => {
                console.log(`Transfer of ${ft.name} successfully queued.`);
              })
              .catch((error) => {
                console.log(`Failed to queue ${filename}: ${error}`);
              })
        },
        LoadFromFileSync: (fileName) => {
            dataStreamer.collection = readFileSync(fileName, "cbor");
        },
        GetFromCollection: (index) => {
            return dataStreamer.collection.data[index];
        },
        GetCollectionLength: () => {
            if(dataStreamer.collection)
            {
                //console.log(JSON.stringify(dataStreamer.collection))
                return dataStreamer.collection.count;
            }
            
            return 0;
        }
    };

    return dataStreamer;
}

function CreateTasksDataStreamer()
{
    var tasksDataStreamer = CreateDataStreamer();
    tasksDataStreamer.requestName = 'RequestTasksInFolder';
    tasksDataStreamer.responseName = 'TaskCollection';
    tasksDataStreamer.requestType = RequestTypes.Tasks;
    return tasksDataStreamer;
}

function CreateTaskFolderDataStreamer()
{
    var taskFolderDataStreamer = CreateDataStreamer();
    taskFolderDataStreamer.requestName = 'RequestTaskFolders';
    taskFolderDataStreamer.responseName = 'TaskFoldersCollection';
    taskFolderDataStreamer.requestType = RequestTypes.TaskFolders;
    return taskFolderDataStreamer;
}
