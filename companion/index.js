// companion/index.js
import { settingsStorage } from "settings";
import { localStorage } from "local-storage";
import { Login, GetUser } from "../companion/TaskApi";
import { inbox, outbox } from "file-transfer";
import { encode } from 'cbor';

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
		const payload = await file.text();
		console.log(`file contents: ${fileName}`);
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
	// get the tasks
	/*
	GetUser().then(function(user){
		user.TaskFolders().All().then(function(collection){
			// find the folder
			var found = false;
			var folder;
			for(folderIndex in collection.data)
			{
				if(collection.data[folderIndex].id == folderId)
				{
					folder = collection.data[folderIndex];
					found = true;
					break;
				}
			}

			// asked for a bad folder
			if(!found)
			{
				return;
			}


		});
	});
	*/
	
	await GetUser().then(function(user){
		user.TasksInFolder(folderId).All().then(function(collection){
			console.log(collection);
			/*
			outbox.enqueue("TaskCollection", encode(collection)).then((ft) => {
				console.log(`Transfer of ${ft.name} successfully queued.`);
			  })
			  .catch((error) => {
				console.log(`Failed to queue ${filename}: ${error}`);
			  })
			  */
		});
	});
	
}

