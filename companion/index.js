// companion/index.js
import { settingsStorage } from "settings";
import { localStorage } from "local-storage";
import { inbox, outbox } from "file-transfer";
import { encode } from 'cbor';
import { readFileSync } from 'fs';

import { Login, GetUser } from "../companion/TaskApi";
import { RequestTypes } from '../common/constants'

settingsStorage.onchange = function(evt) 
{
	if (evt.key === "excode") 
	{
		Login(evt);
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
	} 
	else if (evt.key === "refresh_token")
	{
	}
}

// wait for file input from device
async function processAllFiles() {
	console.log('process all files')
	let file;
	while ((file = await inbox.pop())) {
		const fileName = file.name;
		console.log('processing file' + fileName);
		var payload = await file.text();

		// I think this is a bug with the file transfer, it always prepends random characters, so find the first bracket
		payload = payload.slice(payload.indexOf('{'));
		console.log(`file contents: ${fileName} ${payload}`);
		if(fileName == 'RequestTasksInFolder' || fileName == "RequestTaskFolders")
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
	var apiRequest = JSON.parse(payload)
	var user = await GetUser();

	var collection;

	if(apiRequest.reqType == RequestTypes.Tasks)
	{
		collection= await user.TasksInFolder(apiRequest.id);
	} 
	else if(apiRequest.reqType == RequestTypes.TaskFolders)
	{
		collection = await user.TaskFolders();
	}

	collection = await collection.Get(apiRequest.s, apiRequest.t);

	collection.count = await collection.Count();

	collection.s = apiRequest.s;
	collection.t = apiRequest.t;

	console.log(apiRequest + " " + apiRequest['resName'] + " " + collection.count  )

	outbox.enqueue(apiRequest.resName, encode(collection)).then((ft) => {
		console.log(`Transfer of ${ft.name} successfully queued.`);
	  })
	  .catch((error) => {
		console.log(`Failed to queue ${apiRequest.resName}: ${error}`);
	  })
}

async function OnRequestTasksInFolder(folderId)
{
	console.log(JSON.stringify(folderId))

	await GetUser().then(function(user){
		user.TasksInFolder(folderId).All().then(function(collection){
			collection.taskFolderId = folderId;
			

			// strip down collection
			var strippedCollection = {
				id: collection.id,
				data: [],
				taskFolderId: folderId,
				count: collection.data.length,
			};

			for(var taskIndex in collection.data)
			{
				var task = collection.data[taskIndex];
				strippedCollection.data.push({
					id: task.id,
					subject: task.subject,
					status: task.status
				});
			}

			//console.log(JSON.stringify(strippedCollection));
			
			outbox.enqueue("TaskCollection", encode(strippedCollection)).then((ft) => {
				console.log(`Transfer of ${ft.name} successfully queued.`);
			  })
			  .catch((error) => {
				console.log(`Failed to queue ${filename}: ${error}`);
			  })
		});
	});
	
}

