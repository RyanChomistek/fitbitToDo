import document from "document";
import { taskFolderDataStreamer, taskDataStreamer } from "../app/DataStreamer";

var tileTaskListManager = CreateTileListManager();

function CreateTileListManager(tileListId)
{
    let VTList = document.getElementById("tileListId");
}

export function SetupTaskList()
{
    switch to tumbler view!
	let VTList = document.getElementById("checkbox-list");
	
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

	VTList.length = taskDataStreamer.GetCollectionLength();;
}