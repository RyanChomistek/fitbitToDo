import document from "document";
import { DataStreamer } from "../DataStreamer";

import { SettingsStorage, GetSettings } from '../Settings'
import { Collection, CollectionItem } from '../../common/Collection'

export interface TileElement{
	type: string; 
	index: number;
}

export class StreamingVirtualTable <Item extends CollectionItem, DataCollection extends Collection<Item>> {

	public buttonPoll: number;

	public constructor(
		public loadTop: GraphicsElement,
		public loadBottom: GraphicsElement,
		public VTList: VirtualTileList<TileElement>,
		public poolId: string,
		public dataStreamer: DataStreamer<Item, DataCollection>)
	{

	}

	public Enable()
	{
		// we have to poll every 100ms to see if we can see the top or the bottom of the list
		// If anyone discovers a way to do this via event please refactor this
		// doing this in the delegates for the list doesnt seem possible because tiles will often be loaded out of order
		this.buttonPoll = setInterval(() => {
			//console.log(` ${VTList.firstVisibleTile} ${VTList.value} ${VTList.lastVisibleTile}`);
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
		console.log("config tile base DO NOT USE")
	}

	public RebuildList()
	{
		let settings: SettingsStorage = GetSettings();
		console.log(this.poolId === "checkbox-pool")

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

		//console.log(`data length +!@_#_!@+#_!@_+#_!@+#_${this.dataStreamer.GetDisplayCollectionLength()}`)

		this.VTList.length = this.dataStreamer.GetDisplayCollectionLength();
	}
}