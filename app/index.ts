import document from "document";
import { inbox, outbox } from "file-transfer";
import { memory } from "system";
import { readFileSync, unlinkSync, existsSync} from 'fs';

import { loadingScreen, taskFolderScreen, tasksScreen, PushScreen, PopScreen, GetCurrentScreen, ClearStack} from "./ViewSwitch";
import { SettingsStorage, GetSettings } from './Settings'
import { taskFolderDataStreamer, taskDataStreamer } from "./DataStreamer";
import { dumpObject } from './util';
import {  } from './VitrualTables/StreamingVirtualTable';
import { DeviceFileNames, TaskFolderCollectionId } from '../common/constants'
import { NetworkEventHandler } from './FileIO'
import { CollectionRquest } from "../common/Collection"
import { taskSVT } from './VitrualTables/TaskStreamingVirtualTable';

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

	let oldCollectionHash = taskDataStreamer.collectionHash;

	taskDataStreamer.LoadFromFileSync(fileName);
	console.log(JSON.stringify(taskDataStreamer.collection.data));
	if(waitingForTaskCollectionFileToTransition)
	{
		waitingForTaskCollectionFileToTransition = false;
		renderTaskScreen();
	}
	else if(GetCurrentScreen() == tasksScreen && taskDataStreamer.collectionHash != oldCollectionHash)
	{
		// already rendering task view, but we got new info so we should rerender
		taskSVT.RebuildList();
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
	if(GetCurrentScreen() == tasksScreen)
	{
		taskSVT.RefreshList();
	}
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

	// hack to set the length
	(<any> VTList).length = taskFolderDataStreamer.GetLocalCollectionLength();
}

function renderTaskScreen()
{
	// pop the loading screen
	PopScreen();
	PushScreen(tasksScreen);
	console.log("!@#!@#!@#!@#!@#!@#!@#!@#!@#")
	taskSVT.RebuildList();
}

// setup the list ui's
SetUpTaskFolderList();
//SetupTaskList();

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
			value: taskFolderDataStreamer.GetFromCollection(index)?.name,
			index: index
		  };
		},
		configureTile: function(tile, info) {
		  if (info.type == "my-pool") {
			tile.getElementById("text").text = `${info?.value}`;
			let touch = tile.getElementById("touch-me");
			touch.onclick = evt => {
				waitingForTaskCollectionFileToTransition = true;
				loadingScreen.SetText(`Loading: ${info?.value}`)
				PushScreen(loadingScreen);

				// get id
				var id = taskFolderDataStreamer.GetFromCollection(info.index).id;
				// send message back to the host with id
				taskDataStreamer.RequestNewCollection(new CollectionRquest(id));
			};
		  }
		}
	};

	VTList.length = taskFolderDataStreamer.GetLocalCollectionLength();
}

let btnBottom = document.getElementById("LoadMoreBottom");
btnBottom.onactivate = function(evt) {
	var id = taskDataStreamer.collection.id;
	console.log(id)
	taskDataStreamer.RequestNewCollection(new CollectionRquest(id), taskDataStreamer.GetRawEndIndex())
}

let btnTop = document.getElementById("LoadMoreTop");
btnTop.onactivate = function(evt) {
	var id = taskDataStreamer.collection.id;
	console.log(id);
	taskDataStreamer.RequestNewCollection(new CollectionRquest(id), taskDataStreamer.GetRawStartIndex() - taskDataStreamer.maxSize);
}
