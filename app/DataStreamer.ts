import { outbox } from "file-transfer";
import { readFileSync, writeFileSync, existsSync, closeSync } from 'fs';

import { encode, decode } from 'cbor';
import { RequestTypes, EntityTypes, CollectionRequestSize } from '../common/constants'
import { Collection, CollectionItem, TaskFolderCollectionItem, TaskCollectionItem, TaskFolderCollection, TasksCollection, CollectionRequest, UpdateCollectionRquest } from '../common/Collection'
import { NetworkEventHandler } from './FileIO'
import { SettingsStorage, GetSettings } from './Settings'
import { HashString } from '../common/Util'

export class DataStreamer <Item extends CollectionItem, DataCollection extends Collection<Item>>
{
    public collection: DataCollection;
    public collectionHash: number = -1;

    private startIndex = 0;
    private endIndex = 0;

    constructor(
        public reqType = -1,
        public getRequestName = "default",
        public getResponseName = "default",
        public entityType = -1,
        public updateEntityType = -1,
        public updateRequestName = 'default',
        public updateResponseName = 'default',
        public maxSize = CollectionRequestSize,
        
        public cacheLoadEventName = 'default')
    {
    }

    public GetRawStartIndex()
    {
        return this.startIndex;
    }

    public GetRawEndIndex()
    {
        return this.endIndex;
    }

    public GetDisplayStartIndex(): number
    {
        return this.startIndex;
    }

    public GetDisplayEndIndex(): number
    {
        return this.startIndex + this.GetDisplayCollectionLength();
    }

    public GetDisplayCollectionSize()
    {
        return this.GetDisplayEndIndex() - this.GetDisplayStartIndex();
    }

    public GetCacheFileName(collectionId: number, skip: number, top: number)
    {
        return `dataCache_${collectionId}_${skip}_${top}.bin`;
    }

    public TryGetCollectionFromCache(requestPayload: CollectionRequest)
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

    public RequestNewCollection(requestPayload: CollectionRequest, skip = 0)
    {
        requestPayload.skip = skip;
        requestPayload.top = this.maxSize;

        // try to load cached data, much faster than round tripping the api request
        // this will have old data however, so we still need to make a web request to get new data
        if(this.TryGetCollectionFromCache(requestPayload))
        {
            //return;
        }

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
        console.log('loading from object ')
        this.collection = rawData;
        // Should probably add a time stamp

        this.WriteCollectionToCache();
        
        this.startIndex = this.collection.skip;
        this.endIndex = this.collection.skip + this.collection.top;
        
        this.collectionHash = HashString(JSON.stringify(this.collection));
        console.log(`collection hash ${this.collectionHash}`)
    }

    public GetFromCollection(index: number): Item
    {
        if(index >= this.collection.data.length)
        {
            return null;
        }

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


    /**
     * Gets display collection length
     * mainly used by the streaming virtual table to react to changes in the datastreamer eg. the user turned of show completed tasks
     */
    public GetDisplayCollectionLength(): number
    {
        return this.GetLocalCollectionLength();
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
    public nonCompletedTaskIndexes: number[] = [];

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

    public FindNonCompletedTaskIndexes()
    {
        this.nonCompletedTaskIndexes = [];
        for(let i = 0; i < this.collection.data.length; i++)
        {
            if(!this.collection.data[i].status)
            {
                this.nonCompletedTaskIndexes.push(i);
            }
        }
    }

    public GetFromNonCompletedCollection(index: number): TaskCollectionItem
    {
        return this.collection.data[this.nonCompletedTaskIndexes[index]];
    }

    public RemoveFromNonCompletedCollection(index: number)
    {
        console.log(`non completed tasks pre ${this.nonCompletedTaskIndexes.length}`)
        this.nonCompletedTaskIndexes.splice(index, 1);
        console.log(`non completed tasks post ${this.nonCompletedTaskIndexes.length}`)
    }

    public GetNonCompletedTasksCollectionLength(): number
    {
        return this.nonCompletedTaskIndexes.length;
    }

    public GetDisplayCollectionLength(): number
    {
        let settings: SettingsStorage = GetSettings();

        if(settings.showCompletedTasks)
		{
			return this.GetLocalCollectionLength();
		}
		else
		{
			return  this.GetNonCompletedTasksCollectionLength();
		}
    }
}

export let taskFolderDataStreamer = new TaskFolderDataStreamer();
export let taskDataStreamer = new TaskDataStreamer();