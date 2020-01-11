import document from "document";

let loadingScreen = document.getElementById("loadingScreen");
let taskFolderScreen = document.getElementById("TaskFolderScreen");
let tasksScreen = document.getElementById("TasksScreen");
let spinner = document.getElementById("spinner");

EnableLoadingScreen();

export function EnableLoadingScreen()
{
    DisableTaskFolderScreen();
    DisableTasksScreen();
    loadingScreen.style.display = "inline";
    spinner.state = "enabled";
}

export function EnableTaskFolderScreen()
{
    DisableLoadingScreen();
    DisableTasksScreen();
    taskFolderScreen.style.display = "inline";
}

export function EnableTasksScreen()
{
    DisableLoadingScreen()
    DisableTaskFolderScreen()
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