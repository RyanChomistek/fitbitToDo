import document from "document";
import { inbox, outbox } from "file-transfer";

import { loadingScreen, taskFolderScreen, tasksScreen, PushScreen, PopScreen} from "../app/ViewSwitch";
import { taskFolderDataStreamer, taskDataStreamer } from "../app/DataStreamer";

import { dumpObject } from './util';
import {SetupTaskList} from './StreamingVirtualTable';

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
				else
				{
					// already rendering task view
					//dumpObject(VTList)
					let VTList = document.getElementById("checkbox-list");
					VTList.value = 0;
					VTList.redraw();
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

let btnBR = document.getElementById("LoadMoreBottom");
btnBR.onactivate = function(evt) {
	var id = taskDataStreamer.collection.id;
	console.log(id)
	taskDataStreamer.RequestNewCollection({id:id}, taskDataStreamer.endIndex)
}
