import document from "document";
import { inbox, outbox } from "file-transfer";
import { memory } from "system";
import { readFileSync, unlinkSync, existsSync} from 'fs';

import { loadingScreen, taskFolderScreen, tasksScreen, PushScreen, PopScreen, GetCurrentScreen, ClearStack} from "./ViewSwitch";
import { SettingsStorage, GetSettings } from './Settings'
import { taskFolderDataStreamer, taskDataStreamer } from "./DataStreamer";
import { dumpObject } from './util';
import { SetupTaskList } from './StreamingVirtualTable';
import { DeviceFileNames, TaskFolderCollectionId } from '../common/constants'
import { NetworkEventHandler } from './FileIO'
import { CollectionRquest } from "../common/Collection"

var waitingForTaskFolderCollectionFileToTransition = true;
var waitingForTaskCollectionFileToTransition = false;

// Set up settings
let settings: SettingsStorage = GetSettings();
settings.ChangeColor(settings.color)

PushScreen(loadingScreen);

//loadingScreen.SetText('Loading Task Folders')

NetworkEventHandler.AddEventHandler('TaskFoldersCollection', (eventName, fileName) => {
	console.log(`event ${eventName} ${fileName}`)
	taskFolderDataStreamer.LoadFromFileSync(fileName);
	if(waitingForTaskFolderCollectionFileToTransition)
	{
		waitingForTaskFolderCollectionFileToTransition = false;
		ClearStack();
		RenderTaskFolders();
	}
});

NetworkEventHandler.AddEventHandler('TaskCollection', (eventName, fileName) => {
	console.log(`event ${eventName} ${fileName}`)
	taskDataStreamer.LoadFromFileSync(fileName);
	if(waitingForTaskCollectionFileToTransition)
	{
		waitingForTaskCollectionFileToTransition = false;
		renderTaskScreen();
	}
	else if(GetCurrentScreen() == tasksScreen)
	{
		// already rendering task view
		let VTList = document.getElementById("checkbox-list") as VirtualTileList<{
			type: string;
			value: string;
			index: number;
		}>;
		
		SetupTaskList()
		VTList.value = 0;
		VTList.redraw();
	}
});

NetworkEventHandler.AddEventHandler('NormalColorChanged', (eventName, fileName) => {
	let color = readFileSync(fileName, "cbor");
	console.log(JSON.parse(color) + " " + JSON.stringify(color));
	settings.ChangeColor(JSON.parse(color));
});

NetworkEventHandler.AddEventHandler('ShowCompletedTasks', (eventName, fileName) => {
	let showCompletedTasks = readFileSync(fileName, "cbor");
	settings.ChangeShowCompletedTasks(JSON.parse(showCompletedTasks));
});

NetworkEventHandler.AddEventHandler('ClearAllInfo', (eventName, fileName) => {
	for(let i = 0; i < DeviceFileNames.length; i++)
	{
		if(existsSync(DeviceFileNames[i]))
		{
			unlinkSync(DeviceFileNames[i]);
		}
	}
});

document.onkeypress = function(e) {
	//console.log("Key pressed: " + e.key);
	e.preventDefault();
	if (e.key==="back") {
		// these will assume the loading screen is up, if we back out and dont reset these wewill exit the app when the new info comes in
		waitingForTaskFolderCollectionFileToTransition = false;
		waitingForTaskCollectionFileToTransition = false;

		PopScreen();
	}
}

taskFolderDataStreamer.RequestNewCollection(new CollectionRquest(TaskFolderCollectionId));

function RenderTaskFolders()
{
	PushScreen(taskFolderScreen);
	let VTList = document.getElementById("my-list") as VirtualTileList<{
		type: string;
		index: number;
	}>;

	// hack to se the length
	(<any> VTList).length = taskFolderDataStreamer.GetLocalCollectionLength();
}

function renderTaskScreen()
{
	// pop the loading screen
	PopScreen();
	PushScreen(tasksScreen);
	let VTList = document.getElementById("checkbox-list");

	//console.log("++++$$$$$$$$$$$$$$$$$$$" + JSON.stringify(taskDataStreamer.GetCollectionLength()))
	(<any> VTList).length = taskDataStreamer.GetLocalCollectionLength();
}

// setup the list ui's
SetUpTaskFolderList();
SetupTaskList();

function SetUpTaskFolderList()
{
	let VTList = document.getElementById("my-list") as VirtualTileList<{
		type: string;
		value: string;
		index: number;
	}>;
	
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
				waitingForTaskCollectionFileToTransition = true;
				loadingScreen.SetText(`Loading: ${info.value}`)
				PushScreen(loadingScreen);

				// get id
				var id = taskFolderDataStreamer.GetFromCollection(info.index).id;
				// send message back to the host with id
				taskDataStreamer.RequestNewCollection(new CollectionRquest(id));
			};
		  }
		}
	};
	
	VTList.length = taskFolderDataStreamer.GetCollectionLength();
}

let btnBottom = document.getElementById("LoadMoreBottom");
btnBottom.onactivate = function(evt) {
	var id = taskDataStreamer.collection.id;
	console.log(id)
	taskDataStreamer.RequestNewCollection(new CollectionRquest(id), taskDataStreamer.endIndex)
}

let btnTop = document.getElementById("LoadMoreTop");
btnTop.onactivate = function(evt) {
	var id = taskDataStreamer.collection.id;
	console.log(id);
	taskDataStreamer.RequestNewCollection(new CollectionRquest(id), taskDataStreamer.startIndex - taskDataStreamer.maxSize);
}
