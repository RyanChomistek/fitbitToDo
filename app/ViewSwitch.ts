import document from "document";
import { me } from "appbit";
import { dumpObject } from './util';
import { readFileSync, writeFileSync, existsSync } from "fs";
import { encode, decode } from 'cbor';
import { TextColorFileName, SettingsFileName } from '../common/constants'
import { taskSVT } from './VitrualTables/TaskStreamingVirtualTable'
import { taskFolderDataStreamer, taskDataStreamer } from "./DataStreamer";

export class Screen
{
    public constructor(
        public Container: GraphicsElement)
    {}
    
    public Enable(): void
    {
        this.Container.style.display = "inline";
    }

    public Disable(): void
    {
        this.Container.style.display = "none";
    }
}

export class LoadingScreen extends Screen
{
    public constructor(
        public Container:GraphicsElement,
        public Spinner:GraphicsElement)
    {
        super(Container);
    }
    
    public Enable(): void
    {
        super.Enable();
        this.Spinner.state = "enabled";
    }

    public Disable(): void
    {
        super.Disable();
        this.Spinner.state = "disabled";
    }

    public SetText(text: string) {
        this.Container.getElementById('text').text = text;
    }
}

export class TasksScreen extends Screen
{
    public constructor(
        public Container:GraphicsElement)
    {
        super(Container);
    }
    
    public Enable(): void
    {
        super.Enable();
        taskSVT.Enable();
    }

    public Disable(): void
    {
        super.Disable();
        taskSVT.Disable();
        taskDataStreamer.WriteCollectionToCache();
    }
}

export class TaskFolderScreen extends Screen
{
    public Disable(): void
    {
        super.Disable();
        taskFolderDataStreamer.WriteCollectionToCache();
    }
}


// Setup screens
export let loadingScreen = new LoadingScreen(document.getElementById("loadingScreen") as GraphicsElement, document.getElementById("spinner") as GraphicsElement);
export let taskFolderScreen = new TaskFolderScreen(document.getElementById("TaskFolderScreen") as GraphicsElement);
export let tasksScreen = new TasksScreen(document.getElementById("TasksScreen") as GraphicsElement);

let screens = [loadingScreen, taskFolderScreen, tasksScreen];

// This is the stack that gets used for remembering the order of the screens
let ScreenStack = [];

export function GetCurrentScreen()
{
    return ScreenStack[ScreenStack.length - 1];
}

function DisableAllScreens()
{
    for(let i = 0; i < screens.length; i++)
    {
        screens[i].Disable();
    }
}

export function ClearStack()
{
    DisableAllScreens();
    ScreenStack = [];
}

export function PushScreen(screen)
{
    DisableAllScreens();

    screen.Enable();
    ScreenStack.push(screen);
}

export function PopScreen()
{
    DisableAllScreens();

    if(ScreenStack.length > 1)
    {
        ScreenStack.pop()
        ScreenStack[ScreenStack.length - 1].Enable();
    }
    else
    {
        me.exit();
    }
}

/*
export let loadingScreen = document.getElementById("loadingScreen");
let spinner = document.getElementById("spinner");
loadingScreen.Enable = () => {EnableLoadingScreen()}
loadingScreen.SetText = function(text) {
    loadingScreen.getElementById('text').text = text;
    //console.log(text);
}

export let taskFolderScreen = document.getElementById("TaskFolderScreen");
taskFolderScreen.Enable = () => {EnableTaskFolderScreen()}

export let tasksScreen = document.getElementById("TasksScreen");
tasksScreen.Enable = () => {EnableTasksScreen()}

// start with the loading screen on
loadingScreen.Enable();
*/

/*
function EnableLoadingScreen()
{
    loadingScreen.style.display = "inline";
    spinner.state = "enabled";
}

function EnableTaskFolderScreen()
{
    taskFolderScreen.style.display = "inline";
    // hook onto the buttons for loading more data
}

function EnableTasksScreen()
{
    tasksScreen.style.display = "inline";
    EnableStreamingVirtualList();
}

function DisableLoadingScreen()
{
    loadingScreen.style.display = "none";
    spinner.state = "disabled";
}

function DisableTaskFolderScreen()
{
    taskFolderScreen.style.display = "none";
}

function DisableTasksScreen()
{
    tasksScreen.style.display = "none";
    disableStreamingVirtualList();
}
*/

