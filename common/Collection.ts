import { TaskFolderCollectionId } from "../common/Constants"

export class CollectionItem 
{
    constructor(
        public id: number,
        public changeId: number)
        {

        }
}

export class TaskFolderCollectionItem extends CollectionItem
{
    constructor(
        id: number,
        public name: string,
        changeId: number)
    {
        super(id, changeId);
    }
}

export class TaskCollectionItem extends CollectionItem
{
    constructor(
        id: number,
        public status: boolean, // true = completed, false = notStarted
        public subject: string,
        changeId: number)
    {
        super(id, changeId);
    }
}

export class Collection <Item extends CollectionItem>
{
    data: Item[];
    public skip: number;
    public top: number;
    public count: number;
    public id: number;
    public changeId: number;
    
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