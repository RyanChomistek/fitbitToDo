import document from "document";
import { taskFolderDataStreamer, taskDataStreamer } from "../app/DataStreamer";

var tileTaskListManager = CreateTileListManager();

function CreateTileListManager(tileListId)
{
    let VTList = document.getElementById("tileListId");
}

export function SetupTaskList()
{
    // have 2 blocks of the tumber 
    //the current block and the next block, whenever we get close to either end of the 
	let VTList = document.getElementById("checkbox-list");
	
	VTList.delegate = {
		getTileInfo: function(index) {
			console.log('task' + index);
			// when we hit the bottom (or top if were in the middle),
			//show a button to load more things
			//console.log("pool ++++++ " + VTList.getElementById("virtual").value)
			//console.log(index + " " + taskDataStreamer.GetLocalCollectionLength() + " | ");
			if(index == taskDataStreamer.GetLocalCollectionLength() - 1)
			{
				//console.log(JSON.stringify(VTList));
				document.getElementById("LoadMoreBottom").style.display = "inline";
			}

            var status = 0;
            if(taskDataStreamer.GetFromCollection(index).status == 'completed')
            {
                status = 1
            }

			return {
				type: "checkbox-pool",
                value: taskDataStreamer.GetFromCollection(index).subject,
                status: status,
				index: index
			};
		},

		configureTile: function(tile, info) {
			if (info.type == "checkbox-pool") 
			{
                //console.log(JSON.stringify(info))
                //console.log(info.index + " | " + taskDataStreamer.GetFromCollection(info.index).status)
                tile.firstChild.value = info.status;

				tile.getElementById("text").text = `${info.value}`;
				tile.firstChild.onclick = evt => {
					// get id
					// var id = GetFromTasksCollection(info.index).id;
					// do the complete/uncomplete
				};
			}
		}
	};

	VTList.length = taskDataStreamer.GetCollectionLength();;
}