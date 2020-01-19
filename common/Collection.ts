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

    constructor()
    {
        this.data = []; 
    }
}

export class TaskFolderCollection extends Collection<TaskFolderCollectionItem>
{
    constructor()
    {
        super();
    }
}

export class TasksCollection extends Collection<TaskCollectionItem>
{
    id: number;

    constructor(id: number)
    {
        super();
        this.id = id;
    }
}