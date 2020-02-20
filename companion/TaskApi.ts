import { settingsStorage } from "settings";
import { localStorage } from "local-storage";

import { GetToken, EnsureTokenState } from "../companion/Authentication.js";
import { Collection, CollectionItem, TaskFolderCollectionItem, TaskCollectionItem, TaskFolderCollection, TasksCollection} from '../common/Collection'
import { HashString } from '../common/Util'
export class ApiCollection<Item, CompressedItem extends CollectionItem>
{
    endpointName: string;
    hasUnsyncedData: boolean;
    data: Item[];
    count: number;
    constructor(endpointName: string)
    {
        this.data = [];
        this.endpointName = endpointName;
        this.hasUnsyncedData = true;
        this.count = 0;
    }

    async Get(skip=0, top=10)
    {
        return await Get(this, skip, top)
    }

    async All(skip=0, maxChunkSize=10)
    {
        return await All(this, maxChunkSize)
    }

    async Count() 
    { 
        return await GetCountFromApi(this)
    }

    async Update(itemUpdated)
    { 
        return await UpdateFromApi(this, itemUpdated)
    }

    CompressCollection(): Collection<CompressedItem>
    {
        console.log('ApiCollection')
        return null;
    }
}

export interface ApiTaskFolderCollectionItem
{
    id: string;
    name: string;
    isDefaultFolder: boolean;
    parentGroupKey: string;
    changeKey: string;
}

function GetIdHashMap()
{
    let idHashMapString = localStorage.getItem("IdHashMap");
    let idHashMap = {};
    if(idHashMapString != null)
    {
        idHashMap = JSON.parse(idHashMapString);
    }

    return idHashMap;
}

export class TaskFolderApiCollection extends ApiCollection<ApiTaskFolderCollectionItem, TaskFolderCollectionItem>
{
    constructor()
    {
        super('taskfolders');
    }

    CompressCollection()
    {
        console.log('TaskFolderApiCollection')
        let compressedCollection = new TaskFolderCollection();

        for(var i = 0; i < this.data.length; i++)
        {
            let item = this.data[i];
            let hashedId = HashString(item.id);
            compressedCollection.data.push(new TaskFolderCollectionItem(hashedId, item.name, HashString(item.changeKey)));
        }

        return compressedCollection;
    }
}

export interface ApiTaskCollectionItem
{
    id: number;
    status: string;
    subject: string;
    changeKey: string;
}

export class TasksInFolderApiCollection extends ApiCollection<ApiTaskCollectionItem, TaskCollectionItem>
{
    public id: string

    constructor(id: string)
    {
        super((`taskfolders(\'${id}\')/tasks`));
        this.id = id;
    }

    CompressCollection()
    {
        let hashedFolderId = HashString(this.id);
        let compressedCollection = new TasksCollection(hashedFolderId);

        for(var i = 0; i < this.data.length; i++)
        {
            let item: ApiTaskCollectionItem = this.data[i];
            let hashedId = HashString(item.id);
            let statusBool = item.status == "completed";
            compressedCollection.data.push(new TaskCollectionItem(hashedId, statusBool, item.subject, HashString(item.changeKey)));
        }

        //console.log(`compress collection ${this.id} ${compressedCollection.id}`)

        return compressedCollection;
    }
}

export class TasksApiCollection extends ApiCollection<ApiTaskCollectionItem, TaskCollectionItem>
{
    public id: string

    constructor(taskId: string)
    {
        super(`tasks(\'${taskId}\')`);
        this.id = taskId;
    }
}

export class User
{
    constructor()
    {}

    TaskFolders()
    {
        return new TaskFolderApiCollection();
    }

    TasksInFolder(hashedTaskFolderId: number)
    {
        let idHashMap = GetIdHashMap();
        let taskFolderId = idHashMap[hashedTaskFolderId];
        console.log(`IDS hashed:${hashedTaskFolderId}, unhashed ${taskFolderId}`)
        return new TasksInFolderApiCollection(taskFolderId);
    }

    Task(hasedTaskId: number)
    {
        let idHashMap = GetIdHashMap();
        let taskId = idHashMap[hasedTaskId];
        return new TasksApiCollection(taskId);
    }
}

export async function Login(evt)
{
    return await GetToken(evt.newValue).catch(function(err){
        console.log('Err: '+ err);
    });
}

/*
Gets "top" number of entities starting after the "skip" index
*/
async function Get<Item, CompressedItem extends CollectionItem>(collection: ApiCollection<Item, CompressedItem>, skip = 0, top = 10)
{
    //console.log(skip + " | " + top);
    return await GetFromApi(collection, skip, top)
}

/*
Gets all entities from this collection, from the skip index to the end of the collection
*/
async function All<Item, CompressedItem extends CollectionItem>(collection: ApiCollection<Item, CompressedItem>, skip = 0, maxChunkSize=100)
{
    var count = await GetCountFromApi(collection)

    var chunkSize = count < maxChunkSize ? count : maxChunkSize;
    var currentIndex = 0;

    while(collection.hasUnsyncedData)
    {
        var asd = await GetFromApi(collection, currentIndex, chunkSize);
        currentIndex += chunkSize;
    }

    return collection 
}

/*
gets data form the given endpoint
valid endpoints
task, taskfolders
*/
async function GetFromApi<Item, CompressedItem extends CollectionItem>(collection: ApiCollection<Item, CompressedItem>, skip = 0, top = 10)
{
    // TODO check to see if accessToken is valid
    var accessToken = settingsStorage.getItem('AccessToken');

	const getRequest = {
		method: 'GET',
		headers: {
			'Authorization': "Bearer " + accessToken,
			'Host': 'graph.microsoft.com',
			}
        };

    var endpointUrl = 'https://graph.microsoft.com/beta/me/outlook/' + 
        collection.endpointName + 
        "?$skip=" + skip +
        "&$top=" + top;
    //console.log(skip + " " + top);

    //console.log(endpointUrl + " " + JSON.stringify(getRequest))
    return await fetch(endpointUrl, getRequest).then(function(data){
		return data.json();
	}).then(function(data){
        //console.log('data : ' + JSON.stringify(data))
        //collection.nextUrl = data['@odata.nextLink'];
        
        collection.hasUnsyncedData = data['value'].length > 0;
        var idHashMap = GetIdHashMap();

        for(var valueIndex in data['value'])
        {
            // Hash the id's because they are incredibly long and the device cant handle passing them back well
            var id = data['value'][valueIndex].id;
            var hashedId = HashString(id);
            idHashMap[hashedId] = id;
            //data['value'][valueIndex].id = hashedId;

            collection.data.push(data['value'][valueIndex]);
        }

        localStorage.setItem("IdHashMap", JSON.stringify(idHashMap));
        collection.count = data.length;

        return collection;
    });
}

async function GetCountFromApi(collection)
{
    // TODO check to see if accessToken is valid
    var accessToken = settingsStorage.getItem('AccessToken');

	const getRequest = {
		method: 'GET',
		headers: {
			'Authorization': "Bearer " + accessToken,
			'Host': 'graph.microsoft.com',
			}
    };

    var endpointUrl = 'https://graph.microsoft.com/beta/me/outlook/' + 
        collection.endpointName + "/$count";
    
    console.log(endpointUrl)

    return await fetch(endpointUrl, getRequest).then(function(data){
            return data.json();
        }).then(function(data){
            return data;
        });
}

async function UpdateFromApi(collection, itemUpdated)
{
    // TODO check to see if accessToken is valid
    var accessToken = settingsStorage.getItem('AccessToken');

	const updateRequest = {
		method: 'PATCH',
		headers: {
            'Content-Type': 'application/json',
			'Authorization': "Bearer " + accessToken,
			'Host': 'graph.microsoft.com',
        },
        body: JSON.stringify(itemUpdated),
    };

    console.log(JSON.stringify(updateRequest))

    var endpointUrl = 'https://graph.microsoft.com/beta/me/outlook/' + 
        collection.endpointName;
    
    return await fetch(endpointUrl, updateRequest).then(function(data){
            return data.json();
        }).then(function(data){
            console.log(JSON.stringify(data))
            return data;
        });
}