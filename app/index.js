import document from "document";
import { inbox, outbox } from "file-transfer";
import { readFileSync } from 'fs';
import { EnableTaskFolderScreen, EnableTasksScreen } from "../app/ViewSwitch";
import { encode, decode } from 'cbor';

var waitingForTaskFolderCollectionFileToTransition = true;
var waitingForTaskCollectionFileToTransition = false;

// Event occurs when new file(s) are received
inbox.onnewfile = function () {
	var fileName;
	do 
	{
		// If there is a file, move it from staging into the application folder
		fileName = inbox.nextFile();
		
		if (fileName) {
			console.log(fileName);
			if (fileName == 'TaskFoldersCollection') {
				var taskFoldersCollection = readFileSync(fileName, "cbor");
				if(waitingForTaskFolderCollectionFileToTransition)
				{
					waitingForTaskFolderCollectionFileToTransition = false;
					renderTaskFolders(taskFoldersCollection)
				}
				
			}

			if (fileName == 'TaskCollection') {
				var tasksCollection = readFileSync(fileName, "cbor");
				if(waitingForTaskCollectionFileToTransition)
				{
					waitingForTaskCollectionFileToTransition = false;
					renderTaskScreen(tasksCollection);
				}
			}

		}
	} while (fileName);
};

function renderTaskFolders(collection)
{
	//enable the task folder menu
	EnableTaskFolderScreen();

	let VTList = document.getElementById("my-list");
	VTList.delegate = {
		getTileInfo: function(index) {
		  return {
			type: "my-pool",
			value: JSON.stringify(collection.data[index].name),
			index: index
		  };
		},
		configureTile: function(tile, info) {
		  if (info.type == "my-pool") {
			tile.getElementById("text").text = `${info.value}`;
			let touch = tile.getElementById("touch-me");
			touch.onclick = evt => {
			  	// get id
				var id = collection.data[info.index].id;
				// send message back to the host with id
				outbox.enqueue("RequestTasksInFolder", encode(JSON.stringify(id))).then((ft) => {
					console.log(`Transfer of ${ft.name} successfully queued.`);
					waitingForTaskCollectionFileToTransition = true;
				  })
				  .catch((error) => {
					console.log(`Failed to queue ${filename}: ${error}`);
				  })
			};
		  }
		}
	  };
	
	  VTList.length = collection.data.length;
}

function renderTaskScreen(taskCollection)
{
	EnableTasksScreen();
	let VTList = document.getElementById("checkbox-list");

	VTList.delegate = {
		getTileInfo: function(index) {
		  return {
			type: "checkbox-pool",
			value: JSON.stringify(taskCollection.data[index].subject),
			index: index
		  };
		},
		configureTile: function(tile, info) {
		  if (info.type == "checkbox-pool") {
			
			tile.getElementById("text").text = `${info.value}`;
			tile.firstChild.onclick = evt => {
			  	// get id
				var id = taskCollection.data[info.index].id;
				// do the complete/uncomplete
			};
			
		  }
		}
	  };
	
	  VTList.length = taskCollection.data.length;
}



