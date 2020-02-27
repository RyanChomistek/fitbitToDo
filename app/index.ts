import document from "document";
import { inbox, outbox } from "file-transfer";
import { memory } from "system";
import { readFileSync, unlinkSync, existsSync, listDirSync } from 'fs';

import { loadingScreen, taskFolderScreen, tasksScreen, PushScreen, PopScreen, GetCurrentScreen, ClearStack} from "./ViewSwitch";
import { SettingsStorage, GetSettings } from './Settings'
import { taskFolderDataStreamer, taskDataStreamer } from "./DataStreamer";
import { dumpObject } from './util';
import { DeviceFileNames, TaskFolderCollectionId } from '../common/constants'
import { NetworkEventHandler } from './FileIO'
import { CollectionRequest } from "../common/Collection"
import { taskSVT } from './VitrualTables/TaskStreamingVirtualTable';
import { taskFoldersSVT } from './VitrualTables/TaskFoldersStreamingVirtualTable';

// Set up settings

GetSettings().ChangeColor(GetSettings().color)

PushScreen(loadingScreen);
loadingScreen.SetWaitingFor(taskFolderScreen);

NetworkEventHandler.AddEventHandler('TaskFoldersCollection', (eventName, fileName) => {
	console.log(`event ${eventName} ${fileName}`)
	GetSettings().ChangeHasLoggedIn(true);
	let oldCollectionHash = taskFolderDataStreamer.collectionHash;

	taskFolderDataStreamer.LoadFromFileSync(fileName);

	if(GetCurrentScreen() == loadingScreen && loadingScreen.GetWaitingFor() == taskFolderScreen)
	{
		loadingScreen.SetWaitingFor(undefined);
		ClearStack();
		PushScreen(taskFolderScreen);
		taskFoldersSVT.RebuildList();
	}
	else if(GetCurrentScreen() == taskFolderScreen && taskFolderDataStreamer.collectionHash != oldCollectionHash)
	{
		taskFoldersSVT.RefreshList();
	}
});

NetworkEventHandler.AddEventHandler('TaskCollection', (eventName, fileName) => {
	console.log(`event ${eventName} ${fileName}`)

	let oldCollectionHash = taskDataStreamer.collectionHash;

	taskDataStreamer.LoadFromFileSync(fileName);
	console.log(JSON.stringify(taskDataStreamer.collection.data));
	if(GetCurrentScreen() == loadingScreen && loadingScreen.GetWaitingFor() == tasksScreen)
	{
		loadingScreen.SetWaitingFor(undefined);
		// pop the loading screen
		PopScreen();
		PushScreen(tasksScreen);
		taskSVT.RebuildList();
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
	GetSettings().ChangeColor(JSON.parse(color));
});

NetworkEventHandler.AddEventHandler('ShowCompletedTasks', (eventName, fileName) => {
	let showCompletedTasks = readFileSync(fileName, "cbor");
	GetSettings().ChangeShowCompletedTasks(JSON.parse(showCompletedTasks));
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

	// clear all cached data
	const listDir = listDirSync('/private/data');
	var dirIter;
	while ((dirIter = listDir.next()) && !dirIter.done) {
		if(dirIter.value.indexOf('dataCache_') != -1)
		{
			unlinkSync(dirIter.value);
		}
	}
});

// Tells the user that they are haivng account problems and need to check their phone
NetworkEventHandler.AddEventHandler('LoggedOut', (eventName, fileName) => {
	// They havent logged in so dont bother showing a new loading screen
	if(!GetSettings().hasLoggedInBefore)
	{
		return;
	}

	GetSettings().ChangeHasLoggedIn(false);
	ClearStack();
	loadingScreen.SetText("problem accessing Microsoft data. You may need to re-login in the fit bit app.");
	PushScreen(loadingScreen);
});

// Tells the user that they are having account problems and need to check their phone
NetworkEventHandler.AddEventHandler('LoadingScreenMessage', (eventName, fileName) => {
	let message = readFileSync(fileName, "cbor");
	if(GetCurrentScreen() == loadingScreen)
	{
		loadingScreen.SetWaitingFor(taskFolderScreen);
		loadingScreen.SetText(message);
	}
});

document.onkeypress = function(e) {
	//console.log("Key pressed: " + e.key);
	e.preventDefault();
	if (e.key==="back") {
		PopScreen();
	}
}

// start off the process by asking for a new collection
taskFolderDataStreamer.RequestNewCollection(new CollectionRequest(TaskFolderCollectionId));