import { readFileSync } from 'fs';
import { outbox } from "file-transfer";
import { encode, decode } from 'cbor';

import { RequestTypes, EntityTypes } from '../common/constants'

export let taskDataStreamer = CreateTasksDataStreamer();
export let taskFolderDataStreamer = CreateTaskFolderDataStreamer();

function CreateDataStreamer()
{
    let dataStreamer = {
        getRequestName: "default",
        getResponseName: "default",
        entityType: -1,
        collection: null,
        maxSize: 25,
        startIndex: 0,
        endIndex:0,
        RequestNewCollection: (requestPayload, skip = 0) =>{
            requestPayload.s = skip;
            requestPayload.t = dataStreamer.maxSize;

            requestPayload.resName = dataStreamer.getResponseName;
            requestPayload.entityType = dataStreamer.entityType;

            requestPayload.reqType = RequestTypes.Get;

            console.log(dataStreamer.getRequestName +"|"+ JSON.stringify(requestPayload) + "|" + JSON.stringify(requestPayload).length)
            console.log(JSON.stringify(requestPayload))

            outbox.enqueue(dataStreamer.getRequestName, encode(JSON.stringify(requestPayload))).then((ft) => {
                console.log(`Transfer of ${ft.name} successfully queued.`);
              })
              .catch((error) => {
                console.log(`Failed to queue ${filename}: ${error}`);
              })
        },
        LoadFromFileSync: (fileName) => {
            dataStreamer.collection = readFileSync(fileName, "cbor");
            console.log(JSON.stringify(dataStreamer.collection));
            dataStreamer.startIndex = dataStreamer.collection.s;
            dataStreamer.endIndex = dataStreamer.collection.s + dataStreamer.collection.t;
            console.log(dataStreamer.startIndex + " " + dataStreamer.endIndex )
        },
        GetFromCollection: (index) => {
            return dataStreamer.collection.data[index];
        },
        GetCollectionLength: () => {
            if(dataStreamer.collection)
            {
                return dataStreamer.collection.count;
            }
            
            return 0;
        },
        GetLocalCollectionLength: () => {
            if(dataStreamer.collection)
            {
                return dataStreamer.collection.data.length;
            }
            
            return 0;
        },
        // The payload needs to contain the id and what changed
        UpdateItem: (requestPayload) => {
            console.log(JSON.stringify(requestPayload));
            requestPayload.reqType = RequestTypes.Update;
            requestPayload.resName = dataStreamer.updateResponseName;
            requestPayload.entityType = dataStreamer.updateEntityType;

            outbox.enqueue(dataStreamer.updateRequestName, encode(JSON.stringify(requestPayload))).then((ft) => {
                console.log(`Transfer of ${ft.name} successfully queued.`);
              })
              .catch((error) => {
                console.log(`Failed to queue ${filename}: ${error}`);
              })
        }
    };

    return dataStreamer;
}

function CreateTasksDataStreamer()
{
    let tasksDataStreamer = CreateDataStreamer();
    tasksDataStreamer.entityType = EntityTypes.TasksInFolder;
    tasksDataStreamer.getRequestName = 'RequestTasksInFolder';
    tasksDataStreamer.getResponseName = 'TaskCollection';

    tasksDataStreamer.updateEntityType = EntityTypes.Task;
    tasksDataStreamer.updateRequestName = 'UpdateTask';
    tasksDataStreamer.updateResponseName = 'UpdatedTask';
    return tasksDataStreamer;
}

function CreateTaskFolderDataStreamer()
{
    let taskFolderDataStreamer = CreateDataStreamer();
    taskFolderDataStreamer.getRequestName = 'RequestTaskFolders';
    taskFolderDataStreamer.getResponseName = 'TaskFoldersCollection';
    taskFolderDataStreamer.entityType = EntityTypes.TaskFolders;
    taskFolderDataStreamer.getRequestType =  RequestTypes.GetTaskFolders;
    return taskFolderDataStreamer;
}
