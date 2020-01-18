import document from "document";
import { taskFolderDataStreamer, taskDataStreamer } from "../app/DataStreamer";

import { StatusMap } from "../common/constants";
import { dumpObject } from "./util"
var tileTaskListManager = CreateTileListManager();

function CreateTileListManager(tileListId)
{
    let VTList = document.getElementById("tileListId");
}

let buttonPoll;

export function EnableStreamingVirtualList()
{
	let VTList = document.getElementById("checkbox-list");

	// we have to poll every 100ms to see if we can see the top or the bottom of the list
	// If anyone discovers a way to do this via event please refactor this
	// doing this in the delegates for the list doesnt seem possible because tiles will often be loaded out of order
	buttonPoll = setInterval(() => {
		//console.log(` ${VTList.firstVisibleTile} ${VTList.value} ${VTList.lastVisibleTile}`);
		// if we are showing the first local element, and the first element is not the first batch
		if(VTList.firstVisibleTile == 0 && taskDataStreamer.startIndex != 0)
		{
			document.getElementById("LoadMoreTop").style.display = "inline";
			document.getElementById("LoadMoreBottom").style.display = "none";
		}
		// if we are showing the last local and there is another batch
		else if(VTList.lastVisibleTile >= taskDataStreamer.maxSize - 3 && taskDataStreamer.endIndex < taskDataStreamer.GetCollectionLength() - 1)
		{
			document.getElementById("LoadMoreTop").style.display = "none";
			document.getElementById("LoadMoreBottom").style.display = "inline";
		}
		// We're somewhere in the middle
		else
		{
			document.getElementById("LoadMoreTop").style.display = "none";
			document.getElementById("LoadMoreBottom").style.display = "none";
		}
	}, 100);

}

export function disableStreamingVirtualList()
{
	clearInterval(buttonPoll);
	document.getElementById("LoadMoreBottom").style.display = "none";
    document.getElementById("LoadMoreTop").style.display = "none";
}

export function SetupTaskList()
{
    // have 2 blocks of the tumber 
    //the current block and the next block, whenever we get close to either end of the 
	let VTList = document.getElementById("checkbox-list");
	
	VTList.delegate = {
		getTileInfo: function(index) {
			//console.log(`info ${index}, ${0}`);
			return {
				type: "checkbox-pool",
				index: index
			};
		},

		configureTile: function(tile, info) {
			if (info.type == "checkbox-pool") 
			{
				//console.log(`task ${info.index} + ${VTList.firstVisibleTile} - ${VTList.lastVisibleTile}`);
				let status = 0;
				if(taskDataStreamer.GetFromCollection(info.index).status)
				{
					status = 1
				}

                tile.firstChild.value = status;
				let subject = taskDataStreamer.GetFromCollection(info.index).subject;
				//console.log(`config ${info.index}, ${subject}`);
				tile.getElementById("text").text = `${subject}`;
				tile.firstChild.onclick = evt => {
					let task = taskDataStreamer.GetFromCollection(info.index);
					let id = task.id;
					task.status = !task.status;

					taskDataStreamer.UpdateItem({
						id:id,
						itemUpdated:{
							status: StatusMap[task.status],
						}
					});
				};
			}
		}
	};

	VTList.length = taskDataStreamer.GetLocalCollectionLength();
}