// companion/index.js
import { settingsStorage } from "settings";
import { localStorage } from "local-storage";
import { Login, GetUser } from "../companion/TaskApi";
import { inbox, outbox } from "file-transfer";
import { encode } from 'cbor';
import { readFileSync } from 'fs';

settingsStorage.onchange = function(evt) 
{
	if (evt.key === "excode") 
	{
		Login(evt);
		GetUser().then(function(user){
			user.TaskFolders().All().then(function(collection){
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
	let file;
	while ((file = await inbox.pop())) {
		const fileName = file.name;
		var payload = await file.text();

		// I think this is a bug with the file transfer, it always prepends xq, so remove that
		payload = payload.slice(2);
		console.log(`file contents: ${fileName} ${payload}`);
		if(fileName == 'RequestTasksInFolder')
		{
			OnRequestTasksInFolder(payload);
		}
	}
 }
 
 // Process new files as they are received
 inbox.addEventListener("newfile", processAllFiles);
 
 // Also process any files that arrived when the companion wasn’t running
 processAllFiles()


async function OnRequestTasksInFolder(folderId)
{
	console.log(JSON.stringify(folderId))

	await GetUser().then(function(user){
		user.TasksInFolder(folderId).All().then(function(collection){
			console.log(JSON.stringify(collection));
			collection.taskFolderId = folderId;
			outbox.enqueue("TaskCollection", encode(collection)).then((ft) => {
				console.log(`Transfer of ${ft.name} successfully queued.`);
			  })
			  .catch((error) => {
				console.log(`Failed to queue ${filename}: ${error}`);
			  })
		});
	});
	
}

