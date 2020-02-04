import document from "document";

import { StreamingVirtualTable, TileElement } from './StreamingVirtualTable'
import { taskDataStreamer, TaskDataStreamer, DataStreamer } from "../DataStreamer";
import { SettingsStorage, GetSettings } from '../Settings'
import { UpdateCollectionRquest, TaskCollectionItem, TasksCollection } from '../../common/Collection'
import { StatusMap } from "../../common/constants";
import { dumpObject } from '../util'

class HideOptions
{
    alignment: TileListItemAlignment = 'middle';
	animate: boolean = true;
	redraw: boolean = true;
}

export class TaskStreamingVirtualTable extends StreamingVirtualTable <TaskCollectionItem, TasksCollection>
{
    private uiTiles = {};

    public constructor(
		public loadTop: GraphicsElement,
		public loadBottom: GraphicsElement,
		public VTList: VirtualTileList<TileElement>,
		public poolId: string,
		public dataStreamer: DataStreamer<TaskCollectionItem, TasksCollection>)
	{
        super(loadTop, loadBottom, VTList, poolId, dataStreamer);
	}

    protected ConfigureTile(tile: VirtualTileListItem, info: TileElement, settings: SettingsStorage)
	{
        console.log(`config task ${info.index} ${taskDataStreamer.nonCompletedTaskIndexes[info.index]} ${tile.id}`);
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

            // taskDataStreamer.UpdateItem(new UpdateCollectionRquest(
            //     {status: StatusMap[task.status]},
            //     id
            // ));
            
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
            console.log((tiles[uiTile].id));
            tiles[uiTile].getElementById("text").text = `x-x-x`;
        }
    }

    public RebuildList()
	{
        this.InitUiTiles();

        this.uiTiles = {};
        console.log(`begin rebuild task list ${JSON.stringify(this.uiTiles)}`)
        taskDataStreamer.FindNonCompletedTaskIndexes();
        for (var key in this.uiTiles)
        {
            this.uiTiles[key].tile.style.display = 'inline';
        }
        
        super.RebuildList();

        for(var tile in this.uiTiles)
        {
            console.log(`end rebuild task list ${JSON.stringify(this.uiTiles[tile])}`)
        }
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
            (<TaskDataStreamer> this.dataStreamer).RemoveFromNonCompletedCollection(info.index);
            this.RefreshTiles();
        }, 100);
    }
    
    public RefreshTiles()
    {
        // TODO GET RID OF THE VIRTUAL TILE LIST AND REPLACE WITH NORMAL TILE LIST
        this.InitUiTiles();

        // sort the ui elements in order of what the user sees
        let uiSortedTiles = []

        for (var key in this.uiTiles)
        {
            uiSortedTiles.push(this.uiTiles[key])
            uiSortedTiles[uiSortedTiles.length - 1].tile.style.display = 'inline';
        }

        uiSortedTiles.sort((a,b) => {return a.index-b.index});

        let settings: SettingsStorage = GetSettings();
        for(let i = 0; i < uiSortedTiles.length - 1; i++)
        {
            let newInfo: TileElement = {type: "", index:i}

            // This tile has been removed so hide it
            console.log(`${uiSortedTiles[i].index} ${taskDataStreamer.GetNonCompletedTasksCollectionLength()}`);
            if(taskDataStreamer.GetNonCompletedTasksCollectionLength() < uiSortedTiles[i].index)
             {
            //     //uiSortedTiles[uiSortedTiles.length - 1].tile.style.display = 'none';
            //     console.log((uiSortedTiles[i].tile.id));
                uiSortedTiles[i].tile.getElementById("text").text = `x-x-x`;
                continue;
            }

            this.ConfigureTile(uiSortedTiles[i].tile, newInfo, settings);
        }

        // set the last item to hidden, might need to be more aggressive
        //uiSortedTiles[uiSortedTiles.length - 1].tile.style.display = 'none';
        //uiSortedTiles[uiSortedTiles.length - 1].tile.getElementById("text").text = `x-x-x`;
    }
};

export let taskSVT = new TaskStreamingVirtualTable(
	document.getElementById("LoadMoreTop") as GraphicsElement,
	document.getElementById("LoadMoreBottom") as GraphicsElement,
	document.getElementById("checkbox-list") as VirtualTileList<{type: string;index: number;}>,
    "checkbox-pool",
    taskDataStreamer);

