import document from "document";
import { DataStreamer } from "../DataStreamer";

import { SettingsStorage, GetSettings } from '../Settings'
import { Collection, CollectionItem, CollectionRequest } from '../../common/Collection'
export interface TileElement{
	type: string; 
	index: number;
}

export class StreamingVirtualTable <Item extends CollectionItem, DataCollection extends Collection<Item>> {

	public buttonPoll: number;

	/**
	 * Rebuild on refresh of streaming virtual table
	 * used when you want the next refesh to actually rebuild
	 */
	public rebuildOnRefresh: boolean = false;

	public constructor(
		public loadTop: ComboButton,
		public loadBottom: ComboButton,
		public VTList: VirtualTileList<TileElement>,
		public poolId: string,
		public dataStreamer: DataStreamer<Item, DataCollection>)
	{
		console.log(`data streamer +++++++++++++++++ ${JSON.stringify(dataStreamer)}`)
	}

	public Enable()
	{
		console.log(`enable folders &&&&&&&&&&&&&&&&&&&&&&&`)
		
		// weird javascript hack for maintaining scope when in callback
		let self = this;

		this.loadTop.onactivate = function(evt) {
			var id = self.dataStreamer.collection.id;
			self.rebuildOnRefresh = true;
			self.dataStreamer.RequestNewCollection(new CollectionRequest(id), self.dataStreamer.GetRawStartIndex() - self.dataStreamer.maxSize);
		}

		this.loadBottom.onactivate = function(evt) {
			console.log(`data streamer +++++++++++++++++ ${JSON.stringify(self.dataStreamer)}`)
			var id = self.dataStreamer.collection.id;
			self.rebuildOnRefresh = true;
			self.dataStreamer.RequestNewCollection(new CollectionRequest(id), self.dataStreamer.GetRawEndIndex())
		}

		// we have to poll every 100ms to see if we can see the top or the bottom of the list
		// If anyone discovers a way to do this via event please refactor this
		// doing this in the delegates for the list doesnt seem possible because tiles will often be loaded out of order
		this.buttonPoll = setInterval(() => {
			// if we are showing the first local element, and the first element is not the first batch
			if(this.VTList.firstVisibleTile == 0 && this.dataStreamer.GetDisplayStartIndex() != 0)
			{
				this.loadTop.style.display = "inline";
				this.loadBottom.style.display = "none";
			}
			// if we are showing the last local and there is another batch
			else if(this.VTList.lastVisibleTile >= this.dataStreamer.GetDisplayCollectionSize() - 3 && this.dataStreamer.GetDisplayEndIndex() < this.dataStreamer.GetCollectionLength() - 1)
			{
				this.loadTop.style.display = "none";
				this.loadBottom.style.display = "inline";
			}
			// We're somewhere in the middle
			else
			{
				this.loadTop.style.display = "none";
				this.loadBottom.style.display = "none";
			}
		}, 100);
	}

	public Disable()
	{
		clearInterval(this.buttonPoll);
		this.loadBottom.style.display = "none";
		this.loadTop.style.display = "none";
	}

	protected ConfigureTile(tile: VirtualTileListItem, info: TileElement, settings: SettingsStorage)
	{
		console.error("config tile base DO NOT USE")
	}

	public RebuildList()
	{
		console.log(this.rebuildOnRefresh)

		let settings: SettingsStorage = GetSettings();

		// not sure why but if I pass this.poolId into the next function it won't owrk have to assign it to a local
		let poolType = this.poolId;

		this.VTList.delegate = {
			getTileInfo: function(index) {
				return {
					type: poolType,
					index: index
				};
			},
			configureTile: (tile: VirtualTileListItem, info: TileElement) => this.ConfigureTile(tile, info, settings)
		};

		this.VTList.length = this.dataStreamer.GetDisplayCollectionLength();
	}

	/**
     * Reloads the tiles, and attempts to preserve the view location of the user
     */
    public RefreshList()
    {
		if(this.rebuildOnRefresh)
		{
			this.rebuildOnRefresh = false;
			this.RebuildList();
		}
		else
		{
			let viewLocation = this.VTList.value;
			this.RebuildList();
			this.VTList.value = viewLocation;
			this.VTList.redraw();
		}
    }
}