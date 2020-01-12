import document from "document";
import { inbox, outbox } from "file-transfer";

import { loadingScreen, taskFolderScreen, tasksScreen, PushScreen, PopScreen} from "../app/ViewSwitch";
import { taskFolderDataStreamer, taskDataStreamer } from "../app/DataStreamer";


var waitingForTaskFolderCollectionFileToTransition = true;
var waitingForTaskCollectionFileToTransition = false;

taskFolderDataStreamer.RequestNewCollection({});

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
				//var taskFoldersCollection = readFileSync(fileName, "cbor");
				taskFolderDataStreamer.LoadFromFileSync(fileName);
				if(waitingForTaskFolderCollectionFileToTransition)
				{
					waitingForTaskFolderCollectionFileToTransition = false;
					RenderTaskFolders()
				}
				
			}

			if (fileName == 'TaskCollection') {
				taskDataStreamer.LoadFromFileSync(fileName);
				if(waitingForTaskCollectionFileToTransition)
				{
					waitingForTaskCollectionFileToTransition = false;
					renderTaskScreen();
				}
			}

		}
	} while (fileName);
};

document.onkeypress = function(e) {
	//console.log("Key pressed: " + e.key);
	e.preventDefault();
	if (e.key==="back") {
		PopScreen();
	}
}

function RenderTaskFolders()
{
	PushScreen(taskFolderScreen);
	let VTList = document.getElementById("my-list");
	VTList.length = taskFolderDataStreamer.GetLocalCollectionLength();
}

function renderTaskScreen()
{
	PushScreen(tasksScreen);
	let VTList = document.getElementById("checkbox-list");
	console.log("++++$$$$$$$$$$$$$$$$$$$" + JSON.stringify(taskDataStreamer.GetCollectionLength()))
	VTList.length = taskDataStreamer.GetLocalCollectionLength();
}

// setup the list ui's
SetUpTaskFolderList();
SetupTaskList();

function SetUpTaskFolderList()
{
	let VTList = document.getElementById("my-list");
	
	VTList.delegate = {
		getTileInfo: function(index) {
		  return {
			type: "my-pool",
			value: taskFolderDataStreamer.GetFromCollection(index).name,
			index: index
		  };
		},
		configureTile: function(tile, info) {
		  if (info.type == "my-pool") {
			tile.getElementById("text").text = `${info.value}`;
			let touch = tile.getElementById("touch-me");
			touch.onclick = evt => {
			  	// get id
				var id = taskFolderDataStreamer.GetFromCollection(info.index).id;
				// send message back to the host with id
				console.log('requesting new collection ' + id.length)
				taskDataStreamer.RequestNewCollection({id:id});
				waitingForTaskCollectionFileToTransition = true;
			};
		  }
		}
	};
	
	VTList.length = taskFolderDataStreamer.GetCollectionLength();
}

function SetupTaskList()
{
	let VTList = document.getElementById("checkbox-list");
	var length = taskDataStreamer.GetCollectionLength();
	
	VTList.delegate = {
		getTileInfo: function(index) {
			console.log('task' + index);
			// when we hit the bottom (or top if were in the middle),
			//show a button to load more things
			console.log("pool ++++++ " + VTList.getElementById("virtual").value)
			console.log(index + " " + taskDataStreamer.GetLocalCollectionLength() + " | ");
			if(index == taskDataStreamer.GetLocalCollectionLength() - 1)
			{
				//console.log(JSON.stringify(VTList));
				document.getElementById("LoadMoreBottom").style.display = "inline";
			}

			return {
				type: "checkbox-pool",
				value: taskDataStreamer.GetFromCollection(index).subject,
				index: index
			};
		},

		configureTile: function(tile, info) {
			if (info.type == "checkbox-pool") 
			{
				tile.getElementById("text").text = `${info.value}`;
				tile.firstChild.onclick = evt => {
					// get id
					//var id = GetFromTasksCollection(info.index).id;
					// do the complete/uncomplete
				};
			}
		}
	};

	VTList.length = length;
}


