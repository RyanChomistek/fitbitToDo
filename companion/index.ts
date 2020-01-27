// companion/index.js
import { settingsStorage } from "settings";
import { localStorage } from "local-storage";
import { inbox, outbox } from "file-transfer";
import { encode } from 'cbor';

import { EnsureTokenState } from './Authentication'
import { Login, User, ApiCollection } from "../companion/TaskApi";
import { RequestTypes, EntityTypes } from '../common/constants'
import { MemSizeAprox } from '../common/MemSize'
import { Collection, CollectionItem, CollectionRquest, UpdateCollectionRquest } from '../common/Collection'

function SendMessage(messageTitle, messageBody)
{
	outbox.enqueue(messageTitle, encode(messageBody)).then((ft) => {
		console.log(`Transfer of ${ft.name} successfully queued.`);
	  })
	  .catch((error) => {
		console.log(`Failed to queue ${messageTitle}: ${error}`);
	  })
}

settingsStorage.onchange = function(evt) 
{
	if (evt.key === "excode") 
	{
		Login(evt).then(() => {
			new User().TaskFolders().All().then( async function<Item, CompressedItem extends CollectionItem>(collection: ApiCollection<Item, CompressedItem>){

				let compressedCollection = collection.CompressCollection();
				compressedCollection.count = await collection.Count();
				compressedCollection.skip = 0;
				compressedCollection.top = compressedCollection.data.length;
				//localStorage.setItem("TaskFoldersCollection", collection);
				
				outbox.enqueue("TaskFoldersCollection", encode(compressedCollection)).then((ft) => {
						console.log(`Transfer of ${ft.name} successfully queued.`);
					}).catch((error) => {
						console.log(`Failed to queue TaskFoldersCollection: ${error}`);
					})
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
		outbox.enqueue("ClearAllInfo", encode({})).then((ft) => {
			console.log(`Transfer of ${ft.name} successfully queued.`);
		}).catch((error) => {
			console.log(`Failed to queue ClearAllInfo: ${error}`);
		})
	} 
	else if (evt.key === 'ShowCompletedTasks')
	{
		console.log(settingsStorage.getItem('ShowCompletedTasks'));
		SendMessage('ShowCompletedTasks', settingsStorage.getItem('ShowCompletedTasks'));
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
			console.log(payload)
			let apiRequest: CollectionRquest = JSON.parse(payload)
			let user: User = null;
			try
			{
				user = new User();
			}
			catch (err)
			{
				console.error(err);
				return;
			}

			if(apiRequest.entityType == EntityTypes.TasksInFolder)
			{
				let collection = user.TasksInFolder(apiRequest.id);
				HandleApiRequestFromDevice(apiRequest, collection);
			} 
			else if(apiRequest.entityType == EntityTypes.TaskFolders)
			{
				let collection = user.TaskFolders();
				HandleApiRequestFromDevice(apiRequest, collection);
			}
			else if(apiRequest.entityType == EntityTypes.Task)
			{
				let collection = user.Task(apiRequest.id);
				HandleApiRequestFromDevice(apiRequest, collection);
			}
		}
	}
 }
 
// Process new files as they are received
inbox.addEventListener("newfile", processAllFiles);
 
// Also process any files that arrived when the companion wasn’t running
processAllFiles()

async function HandleApiRequestFromDevice<Item, CompressedItem extends CollectionItem>(apiRequest: CollectionRquest, collection: ApiCollection<Item, CompressedItem>)
{
	// make sure we have a good session token
	EnsureTokenState();

	if(apiRequest.reqType == RequestTypes.Get)
	{
		HandleApiGetRequests(apiRequest, collection);
	}
	else if(apiRequest.reqType == RequestTypes.Update)
	{
		HandleApiUpdateRequests(<UpdateCollectionRquest> apiRequest, collection);
	}
}

async function HandleApiGetRequests<Item, CompressedItem extends CollectionItem>(apiRequest: CollectionRquest, collection: ApiCollection<Item, CompressedItem>)
{
	collection = await collection.Get(apiRequest.skip, apiRequest.top);

	var compressedCollection = collection.CompressCollection();

	compressedCollection.count = await collection.Count();
	compressedCollection.skip = apiRequest.skip;
	compressedCollection.top = apiRequest.top;

	console.log(`collection : ${JSON.stringify(compressedCollection)}`)
	console.log(`response size ${MemSizeAprox(compressedCollection)}`)
	
	//console.log(apiRequest + " " + apiRequest['resName'] + " " + compressedCollection.count  )

	outbox.enqueue(apiRequest.resName, encode(compressedCollection)).then((ft) => {
		console.log(`Transfer of ${ft.name} successfully queued.`);
	  })
	  .catch((error) => {
		console.log(`Failed to queue ${apiRequest.resName}: ${error}`);
	  })
}

async function HandleApiUpdateRequests<Item, CompressedItem extends CollectionItem>(apiRequest: UpdateCollectionRquest, collection: ApiCollection<Item, CompressedItem>)
{
	console.log(`update ${JSON.stringify(apiRequest)} \n ${JSON.stringify(collection)}`)
	let result = await collection.Update(apiRequest.itemUpdated);
}