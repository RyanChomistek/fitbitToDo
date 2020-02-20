import document from "document";

import { StreamingVirtualTable, TileElement } from './StreamingVirtualTable'
import { taskFolderDataStreamer, taskDataStreamer, TaskDataStreamer, DataStreamer } from "../DataStreamer";
import { SettingsStorage, GetSettings } from '../Settings'
import { UpdateCollectionRquest, TaskFolderCollectionItem, TaskFolderCollection, CollectionRequest } from '../../common/Collection'
import { TaskFolderCollectionId } from "../../common/constants";
import { dumpObject } from '../util'
import { loadingScreen, PushScreen, tasksScreen } from "../ViewSwitch";

export class TaskFoldersStreamingVirtualTable extends StreamingVirtualTable <TaskFolderCollectionItem, TaskFolderCollection>
{
    protected ConfigureTile(tile: VirtualTileListItem, info: TileElement, settings: SettingsStorage)
	{
        if (info.type == "my-pool") 
        {
            let value = this.dataStreamer.GetFromCollection(info?.index)?.name;
            tile.getElementById("text").text = `${value}`;
            let touch = tile.getElementById("touch-me");
            let self = this;
            touch.onclick = evt => {
                loadingScreen.SetText(`Loading: ${value}`)
                PushScreen(loadingScreen);
                loadingScreen.SetWaitingFor(tasksScreen);
                
                // get id
                var id = taskFolderDataStreamer.GetFromCollection(info.index).id;
                
                // send message back to the host with id
                taskDataStreamer.RequestNewCollection(new CollectionRequest(id));
            };
        }
    }
}

export let taskFoldersSVT = new TaskFoldersStreamingVirtualTable(
	document.getElementById("LoadMoreTop") as ComboButton,
	document.getElementById("LoadMoreBottom") as ComboButton,
	document.getElementById("my-list") as VirtualTileList<{type: string; index: number;}>,
    "my-pool",
    taskFolderDataStreamer);