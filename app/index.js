import document from "document";
import { inbox, outbox } from "file-transfer";
import { readFileSync } from 'fs';
import { EnableTaskFolderScreen } from "../app/ViewSwitch";
import { encode } from 'cbor';

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
				var taskFoldersCollection = readFileSync(fileName, "cbor");
				renderTaskFolders(taskFoldersCollection)

			}

		}
	} while (fileName);
};

function renderTaskFolders(collection)
{
	//enable the task folder menu
	EnableTaskFolderScreen();

	let VTList = document.getElementById("my-list");
	VTList.delegate = {
		getTileInfo: function(index) {
		  return {
			type: "my-pool",
			value: JSON.stringify(collection.data[index].name),
			index: index
		  };
		},
		configureTile: function(tile, info) {
		  if (info.type == "my-pool") {
			tile.getElementById("text").text = `${info.value}`;
			let touch = tile.getElementById("touch-me");
			touch.onclick = evt => {
			  	// get id
				var id = collection.data[info.index].id;
				// send message back to the host with id
				outbox.enqueue("RequestTasksInFolder", encode(id)).then((ft) => {
					console.log(`Transfer of ${ft.name} successfully queued.`);
				  })
				  .catch((error) => {
					console.log(`Failed to queue ${filename}: ${error}`);
				  })
			};
		  }
		}
	  };
	
	  VTList.length = collection.data.length;
}

