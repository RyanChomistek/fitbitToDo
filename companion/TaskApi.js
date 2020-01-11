import { GetToken, EnsureTokenState } from "../companion/Authentication.js";
import { settingsStorage } from "settings";
import { localStorage } from "local-storage";

export async function GetUser()
{
    return await EnsureTokenState().then(function(){
        var user = new Object();
        user.TaskFolders = function(){return TaskFolders(user);};
        user.TasksInFolder = function(taskFolder){return TasksInFolder(user, taskFolder);};
        //user.asd = function(){return 1;};
        console.log('get user'  + user)
        return user;
    }).catch(function(err) {
        console.log('problem ensuring tokens: '+ err);
    });
}

export async function Login(evt)
{
    return await GetToken(evt.newValue).catch(function(err){
        console.log('Err: '+ err);
    });
}

function CreateCollection(user, endpointName)
{
    var collection = new Object();
    collection.endpointName = endpointName;
    collection.user = user;
    collection.data = [];
    collection.HasUnsyncedData = true;
    collection.Get = async function(skip=0, top=10){return await Get(collection, skip, top)};
    collection.All = async function(skip=0, maxChunkSize=10){return await All(collection, maxChunkSize)};
    collection.Count = async function(){return await GetCountFromApi(collection)};
    return collection;
}

/*
returns an object that knows how to get taskFolders
*/
function TaskFolders(user)
{
    return CreateCollection(user, 'taskfolders');
}

/*
returns an object that knows how to get tasks
*/
function Tasks(user)
{
    return CreateCollection(user, 'tasks');
}

/*
returns an object that knows how to get tasks
*/
function TasksInFolder(user, hashedTaskFolderId)
{
    var idHashMap = JSON.parse(localStorage.getItem("IdHashMap"));
    //console.log(idHashMap)
    var id = idHashMap[hashedTaskFolderId];
    console.log('unhashed id = ' + id)
    return CreateCollection(user, (`taskfolders(\'${id}\')/tasks`));
}

/*
Gets "top" number of entities starting after the "skip" index
*/
async function Get(collection, skip = 0, top = 10)
{
    console.log(skip + " | " + top);
    return await GetFromApi(collection, skip, top)
}


/*
Gets all entities from this collection, from the skip index to the end of the collection
*/
async function All(collection, skip = 0, maxChunkSize=100)
{
    var count = await GetCountFromApi(collection)

    var chunkSize = count < maxChunkSize ? count : maxChunkSize;
    var currentIndex = 0;

    while(collection.HasUnsyncedData)
    {
        var asd = await GetFromApi(collection, currentIndex, chunkSize);
        currentIndex += chunkSize;
    }

    return collection 
}

function hashString(string) {
    var hash = 0;
    if (string.length == 0) {
        return hash;
    }
    for (var i = 0; i < string.length; i++) {
        var char = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

/*
gets data form the given endpoint
valid endpoints
task, taskfolders
*/
async function GetFromApi(collection, skip = 0, top = 10)
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
    console.log(endpointUrl)
    return await fetch(endpointUrl, getRequest).then(function(data){
		return data.json();
	}).then(function(data){
        //console.log('data len : ' + JSON.stringify(data))
        collection.nextUrl = data['@odata.nextLink'];

        collection.HasUnsyncedData = data['value'].length > 0;
        var idHashMap = localStorage.getItem("IdHashMap");
        if(idHashMap == null)
        {
            idHashMap = {};
        }
        else
        {
            //console.log(JSON.stringify(idHashMap))
            idHashMap = JSON.parse(idHashMap);
            //idHashMap = {};
        }

        for(var valueIndex in data['value'])
        {
            // Hash the id's because they are incredibly long and the device cant handle passing them back well
            var id = data['value'][valueIndex].id;
            var hashedId = hashString(id);
            
            idHashMap[hashedId] = id;
            data['value'][valueIndex].id = hashedId;

            collection.data.push(data['value'][valueIndex]);
        }

        localStorage.setItem("IdHashMap", JSON.stringify(idHashMap));
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
    
    return await fetch(endpointUrl, getRequest).then(function(data){
            return data.json();
        }).then(function(data){
            //console.log(data)
            return data;
        });
}