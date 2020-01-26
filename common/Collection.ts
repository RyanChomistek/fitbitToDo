import { TaskFolderCollectionId } from "../common/Constants"

export class CollectionItem 
{
    constructor(
        public id: number)
        {

        }
}

export class TaskFolderCollectionItem extends CollectionItem
{
    constructor(
        public id: number,
        public name: string)
    {
        super(id);
    }
}

export class TaskCollectionItem extends CollectionItem
{
    constructor(
        public id: number,
        public status: boolean,
        public subject: string)
    {
        super(id);
    }
}

export class Collection <Item extends CollectionItem>
{
    data: Item[];
    public skip: number;
    public top: number;
    public count: number;
    public id: number;

    constructor(id: number)
    {
        this.data = []; 
        this.id = id;
    }
}

export class TaskFolderCollection extends Collection<TaskFolderCollectionItem>
{
    constructor()
    {
        super(TaskFolderCollectionId);
    }
}

export class TasksCollection extends Collection<TaskCollectionItem>
{
    constructor(id: number)
    {
        super(id);
    }
}

export class CollectionRquest 
{
    public skip: number; // skip
    public top: number; // top
    public resName: string;
    public entityType: number;
    public reqType: number;

    constructor(
        public id: number)
    {
        
    }
}

export class UpdateCollectionRquest extends CollectionRquest
{
    constructor( 
        public itemUpdated: any,
         id: number)
    {
        super(id);
    }
}