import document from "document";
import { me } from "appbit";

export let loadingScreen = document.getElementById("loadingScreen");
let spinner = document.getElementById("spinner");
loadingScreen.Enable = () => {EnableLoadingScreen()}

export let taskFolderScreen = document.getElementById("TaskFolderScreen");
taskFolderScreen.Enable = () => {EnableTaskFolderScreen()}

export let tasksScreen = document.getElementById("TasksScreen");
tasksScreen.Enable = () => {EnableTasksScreen()}

loadingScreen.Enable();

var ScreenStack = [];

export function PushScreen(screen)
{
    DisableLoadingScreen();
    DisableTaskFolderScreen();
    DisableTasksScreen();

    screen.Enable();
    ScreenStack.push(screen);
}

export function PopScreen()
{
    DisableLoadingScreen();
    DisableTaskFolderScreen();
    DisableTasksScreen();
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
}