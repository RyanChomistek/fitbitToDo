import { outbox } from "file-transfer";
import { readFileSync, writeFileSync, existsSync, closeSync } from 'fs';

import { encode, decode } from 'cbor';
import { RequestTypes, EntityTypes } from '../common/constants'
import {Collection, CollectionItem, TaskFolderCollectionItem, TaskCollectionItem, TaskFolderCollection, TasksCollection, CollectionRquest, UpdateCollectionRquest } from '../common/Collection'
import { NetworkEventHandler } from './FileIO'

class DataStreamer <Item extends CollectionItem, DataCollection extends Collection<Item>>
{
    public collection: DataCollection;

    constructor(
        public reqType = -1,
        public getRequestName = "default",
        public getResponseName = "default",
        public entityType = -1,
        public updateEntityType = -1,
        public updateRequestName = 'default',
        public updateResponseName = 'default',
        public maxSize = 25,
        public startIndex = 0,
        public endIndex = 0,
        public cacheLoadEventName = 'default')
    {
    }

    public GetCacheFileName(collectionId: number, skip: number, top: number)
    {
        return `dataCache_${collectionId}_${skip}_${top}.bin`;
    }

    public TryGetCollectionFromCache(requestPayload: CollectionRquest)
    {
        let cacheFileName = this.GetCacheFileName(requestPayload.id, requestPayload.skip, requestPayload.top);
        if(!existsSync(cacheFileName))
        {
            return false;
        }

        // fire off a file event like if we had recieved this from the companion
        console.log(`LOADING FROM CACHE ${this.cacheLoadEventName} ${cacheFileName}`)
        NetworkEventHandler.Invoke(this.cacheLoadEventName, cacheFileName);

        return true;
    }

    public RequestNewCollection(requestPayload: CollectionRquest, skip = 0)
    {
        requestPayload.skip = skip;
        requestPayload.top = this.maxSize;

        // try to load cached data, much faster than round tripping the api request
        // this will have old data however, so we still need to make a web request to get new data
        this.TryGetCollectionFromCache(requestPayload)

        requestPayload.resName = this.getResponseName;
        requestPayload.entityType = this.entityType;

        requestPayload.reqType = RequestTypes.Get;

        console.log(this.getRequestName +"|"+ JSON.stringify(requestPayload) + "|" + JSON.stringify(requestPayload).length)
        console.log(`requesting new payload = ${JSON.stringify(requestPayload)}`)

        outbox.enqueue(this.getRequestName, encode(JSON.stringify(requestPayload))).then((ft) => {
            console.log(`Transfer of ${ft.name} successfully queued.`);
          })
          .catch((error) => {
            console.log(`Failed to queue ${this.getRequestName}: ${error}`);
          })
    }

    public LoadFromFileSync(fileName: string): void
    {
        let rawData = readFileSync(fileName, "cbor");
        console.log(`${Object.keys(rawData)} ${rawData.id} | ${JSON.stringify(rawData)}`);
        this.LoadFromObject(rawData);
    }

    public WriteCollectionToCache()
    {
        // check if we have a valid id, we can call this function when switching screens and we might not have a valid data streamer at that point
        if(this.collection && this.collection.id)
        {
            writeFileSync(this.GetCacheFileName(this.collection.id, this.collection.skip, this.collection.top), this.collection, 'cbor');
        }
    }

    public LoadFromObject(rawData: any)
    {
        this.collection = rawData;

        // Should probably add a time stamp

        this.WriteCollectionToCache();
        
        this.startIndex = this.collection.skip;
        this.endIndex = this.collection.skip + this.collection.top;
        console.log(this.startIndex + " " + this.endIndex )
    }

    public GetFromCollection(index: number): Item
    {
        return this.collection.data[index];
    }

    public GetCollectionLength(): number
    {
        if(this.collection)
        {
            return this.collection.count;
        }
        
        return 0;
    }

    public GetLocalCollectionLength(): number
    {
        if(this.collection)
        {
            return this.collection.data.length;
        }
        
        return 0;
    }

    public UpdateItem(requestPayload: UpdateCollectionRquest): void
    {
        console.log(JSON.stringify(requestPayload));
        requestPayload.reqType = RequestTypes.Update;
        requestPayload.resName = this.updateResponseName;
        requestPayload.entityType = this.updateEntityType;

        outbox.enqueue(this.updateRequestName, encode(JSON.stringify(requestPayload))).then((ft) => {
            console.log(`Transfer of ${ft.name} successfully queued.`);
          })
          .catch((error) => {
            console.log(`Failed to queue ${this.updateRequestName}: ${error}`);
          })
    }
}

export class TaskFolderDataStreamer 
    extends DataStreamer<TaskFolderCollectionItem, TaskFolderCollection>    
{
    constructor()
    {
        super();
        this.getRequestName = 'RequestTaskFolders';
        this.getResponseName = 'TaskFoldersCollection';
        this.entityType = EntityTypes.TaskFolders;

        this.cacheLoadEventName = 'TaskFoldersCollection';
    }
}

export class TaskDataStreamer 
    extends DataStreamer<TaskCollectionItem, TasksCollection>  
{
    constructor()
    {
        super();
        this.entityType = EntityTypes.TasksInFolder;
        this.getRequestName = 'RequestTasksInFolder';
        this.getResponseName = 'TaskCollection';
    
        this.updateEntityType = EntityTypes.Task;
        this.updateRequestName = 'UpdateTask';
        this.updateResponseName = 'UpdatedTask';

        this.cacheLoadEventName = 'TaskCollection';
    }
}

export let taskFolderDataStreamer = new TaskFolderDataStreamer();
export let taskDataStreamer = new TaskDataStreamer();

/*
export let taskDataStreamer = CreateTasksDataStreamer();
export let taskFolderDataStreamer = CreateTaskFolderDataStreamer();

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


*/