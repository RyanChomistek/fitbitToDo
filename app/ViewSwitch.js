import document from "document";

let loadingScreen = document.getElementById("loadingScreen");
let taskFolderScreen = document.getElementById("TaskFolderScreen");
let spinner = document.getElementById("spinner");

EnableLoadingScreen();

export function EnableLoadingScreen()
{
    DisableTaskFolderScreen()
    loadingScreen.style.display = "inline";
    spinner.state = "enabled";
}

export function EnableTaskFolderScreen()
{
    DisableLoadingScreen()
    taskFolderScreen.style.display = "inline";
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