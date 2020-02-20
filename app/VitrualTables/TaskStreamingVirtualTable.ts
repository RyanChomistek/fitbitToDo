import document from "document";

import { StreamingVirtualTable, TileElement } from './StreamingVirtualTable'
import { taskDataStreamer, TaskDataStreamer, DataStreamer } from "../DataStreamer";
import { SettingsStorage, GetSettings } from '../Settings'
import { UpdateCollectionRquest, TaskCollectionItem, TasksCollection } from '../../common/Collection'
import { StatusMap } from "../../common/constants";

export class TaskStreamingVirtualTable extends StreamingVirtualTable <TaskCollectionItem, TasksCollection>
{
    private uiTiles = {};

    public constructor(
		public loadTop: ComboButton,
		public loadBottom: ComboButton,
		public VTList: VirtualTileList<TileElement>,
		public poolId: string,
		public dataStreamer: DataStreamer<TaskCollectionItem, TasksCollection>)
	{
        super(loadTop, loadBottom, VTList, poolId, dataStreamer);
	}

    protected ConfigureTile(tile: VirtualTileListItem, info: TileElement, settings: SettingsStorage)
	{
        //console.log(`config task ${info.index} ${taskDataStreamer.nonCompletedTaskIndexes[info.index]} ${tile.id}`);
        this.uiTiles[tile.id] = { index: info.index, tile:tile};

        let item = taskDataStreamer.GetFromCollection(info.index);
        if(!settings.showCompletedTasks)
        {
            item = taskDataStreamer.GetFromNonCompletedCollection(info.index);
        }

        this.SetupTile(item, tile, info, settings);
    }

    protected SetupTile(item: TaskCollectionItem, tile: VirtualTileListItem, info: TileElement, settings: SettingsStorage)
    {
        if(item == undefined)
        {
            //tile.style.display = 'none';
            return;
        }

        let status = 0;
        if(item.status)
        {
            status = 1
        }

        tile.firstChild.value = status;

        let subject = item.subject;
        tile.getElementById("text").text = `${subject}`;
        
        tile.firstChild.onclick = evt => {
            let task = item;
            let id = task.id;
            task.status = !task.status;

            taskDataStreamer.UpdateItem(new UpdateCollectionRquest(
                {status: StatusMap[task.status]},
                id
            ));
            
            if(!settings.showCompletedTasks)
            {
                this.HideTile(tile, info);
            }
        };
    }

    private InitUiTiles()
    {
        // initialize all tiles to have a default value
        var tiles = this.VTList.getElementsByClassName('tile-list-item')

        for(let uiTile in tiles)
        {
            //console.log((tiles[uiTile].id));
            tiles[uiTile].getElementById("text").text = `x-x-x`;
        }
    }

    public RebuildList()
	{
        this.InitUiTiles();

        this.uiTiles = {};
        //console.log(`begin rebuild task list ${JSON.stringify(this.uiTiles)}`)
        taskDataStreamer.FindNonCompletedTaskIndexes();
        for (var key in this.uiTiles)
        {
            this.uiTiles[key].tile.style.display = 'inline';
        }
        
        super.RebuildList();
    };

	/**
	 * Logically hide whatever was in the dom element
	 * @param tile 
	 */
	public HideTile(tile: VirtualTileListItem, info: TileElement)
	{
        // reinitialize all of the visible tiles so that they reflect the changes
        // have to do this in a different callstack or else we race condition with whatever is getting done on the table
        setTimeout(() => {
            this.RefreshList();
        }, 100);
    }
};

export let taskSVT = new TaskStreamingVirtualTable(
	document.getElementById("LoadMoreTop") as ComboButton,
	document.getElementById("LoadMoreBottom") as ComboButton,
	document.getElementById("checkbox-list") as VirtualTileList<{type: string;index: number;}>,
    "checkbox-pool",
    taskDataStreamer);

