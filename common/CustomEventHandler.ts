export class CustomEventHandler 
{
    // map of strings to array of custom events
    private Handlers: {};

    constructor() 
    {
        this.Handlers = {};
    }


    /**
     * Adds event handler
     * @param name 
     * @param callback 
     */
    public AddEventHandler(name: string, callback: (name: string, eventData: any) => void): void
    {
        this.AddEventHandlerInternal(name, new CustomEvent(callback, -1));
    }


    /**
     * Adds one hit event handler
     * @param name 
     * @param callback 
     */
    public AddOneHitEventHandler(name: string, callback: (name: string, eventData: any) => void): void
    {
        this.AddEventHandlerInternal(name, new CustomEvent(callback, 1));
    }


    /**
     * Invokes custom event handler
     * @param name name of the event to invoke
     * @param eventData data to pass to the events
     */
    public Invoke(name: string, eventData: any): void
    {
        let events = this.Handlers[name];

        if(events)
        {
            //event.callback(name, eventData);
            for(let i = 0; i < events.length; i++)
            {
                let event: CustomEvent;
                event = events[i];
                event.Callback(name, eventData);

                if(event.HitsBeforeDeath == -1)
                {
                    continue;
                }

                event.HitsBeforeDeath--;

                if(event.HitsBeforeDeath <= 0)
                {
                    events.splice(i,1);
                    i--;
                }
            }
        }
    }


    /**
     * Adds event handler to the events event list
     * @param name 
     * @param event 
     */
    private AddEventHandlerInternal(name: string, event: CustomEvent): void
    {
        let events = this.Handlers[name];
        if(events)
        {
            events.push(event);
        }
        else
        {
            this.Handlers[name] = [event];
        }
    }
}

class CustomEvent
{
    /**
     * Creates an instance of custom event.
     * @param Name 
     * @param Callback 
     * @param hitsBeforeDeath number of hits before this event destructs, set to -1 to never terminate
     */
    constructor(
        public Callback: (name: string, eventData: any) => void,
        public HitsBeforeDeath: number) 
    {
    }
}

