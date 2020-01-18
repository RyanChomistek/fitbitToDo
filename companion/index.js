// companion/index.js
import { settingsStorage } from "settings";
import { localStorage } from "local-storage";
import { inbox, outbox } from "file-transfer";
import { encode } from 'cbor';
import { readFileSync } from 'fs';

import { Login, GetUser } from "../companion/TaskApi";
import { RequestTypes, EntityTypes } from '../common/constants'
import { MemSizeAprox } from '../common/MemSize'

console.log('here')

function SendMessage(messageTitle, messageBody)
{
	outbox.enqueue(messageTitle, encode(messageBody)).then((ft) => {
		console.log(`Transfer of ${ft.name} successfully queued.`);
	  })
	  .catch((error) => {
		console.log(`Failed to queue ${filename}: ${error}`);
	  })
}

settingsStorage.onchange = function(evt) 
{
	if (evt.key === "excode") 
	{
		Login(evt).then(() => {
			GetUser().then(function(user){
				user.TaskFolders().All().then(function(collection){
					collection.count = collection.data.length;
					localStorage.setItem("TaskFoldersCollection", collection);
	
					outbox.enqueue("TaskFoldersCollection", encode(collection)).then((ft) => {
						console.log(`Transfer of ${ft.name} successfully queued.`);
					  })
					  .catch((error) => {
						console.log(`Failed to queue ${filename}: ${error}`);
					  })
				});
			});
		});
	} 
	else if (evt.key === "NormalColorChanged")
	{
		console.log(settingsStorage.getItem('NormalColorChanged'));
		SendMessage('NormalColorChanged', settingsStorage.getItem('NormalColorChanged'));
	} 
	else if(evt.key === "ClearAllInfo")
	{
		localStorage.clear();
		outbox.enqueue("ClearAllInfo", encode({}, 'json')).then((ft) => {
			console.log(`Transfer of ${ft.name} successfully queued.`);
		  })
		  .catch((error) => {
			console.log(`Failed to queue ${filename}: ${error}`);
		  })
	}
}

// wait for file input from device
async function processAllFiles() {
	//console.log('process all files')
	let file;
	while ((file = await inbox.pop())) {
		const fileName = file.name;
		//console.log('processing file' + fileName);
		var payload = await file.text();

		// I think this is a bug with the file transfer, it always prepends random characters, so find the first bracket
		payload = payload.slice(payload.indexOf('{'));
		console.log(`file contents: ${fileName} ${payload}`);
		if(fileName == 'RequestTasksInFolder' || fileName == "RequestTaskFolders" || fileName == 'UpdateTask')
		{
			HandleApiRequestFromDevice(payload);
		}
	}
 }
 
// Process new files as they are received
inbox.addEventListener("newfile", processAllFiles);
 
// Also process any files that arrived when the companion wasn’t running
processAllFiles()

async function HandleApiRequestFromDevice(payload)
{
	console.log(payload)
	let apiRequest = JSON.parse(payload)
	let user = null;
	try
	{
		user = await GetUser();
	}
	catch (err)
	{
		console.error(err);
		return;
	}
	
	var collection;

	//console.log(`${apiRequest.entityType} ${EntityTypes}` );

	if(apiRequest.entityType == EntityTypes.TasksInFolder)
	{
		collection = user.TasksInFolder(apiRequest.id);
	} 
	else if(apiRequest.entityType == EntityTypes.TaskFolders)
	{
		collection = user.TaskFolders();
	}
	else if(apiRequest.entityType == EntityTypes.Task)
	{
		collection = user.Task(apiRequest.id);
	}

	if(apiRequest.reqType == RequestTypes.Get)
	{
		HandleApiGetRequests(apiRequest, collection);
	}
	else if(apiRequest.reqType == RequestTypes.Update)
	{
		HandleApiUpdateRequests(apiRequest, collection);
	}
}

async function HandleApiGetRequests(apiRequest, collection)
{
	collection = await collection.Get(apiRequest.s, apiRequest.t);

	var compressedCollection = collection.CompressCollection();

	if(apiRequest.entityType == EntityTypes.TasksInFolder)
	{
		compressedCollection.id = apiRequest.id;
	} 

	compressedCollection.count = await collection.Count();

	compressedCollection.s = apiRequest.s;
	compressedCollection.t = apiRequest.t;

	//console.log(`collection : ${JSON.stringify(compressedCollection)}`)
	//console.log(`response size ${MemSizeAprox(compressedCollection)}`)

	//console.log(apiRequest + " " + apiRequest['resName'] + " " + compressedCollection.count  )

	outbox.enqueue(apiRequest.resName, encode(compressedCollection)).then((ft) => {
		console.log(`Transfer of ${ft.name} successfully queued.`);
	  })
	  .catch((error) => {
		console.log(`Failed to queue ${apiRequest.resName}: ${error}`);
	  })
}

async function HandleApiUpdateRequests(apiRequest, collection)
{
	console.log(`update ${JSON.stringify(apiRequest)} \n ${JSON.stringify(collection)}`)
	let result = await collection.Update(apiRequest.itemUpdated);
}