import document from "document";
import { me } from "appbit";
import { dumpObject } from './util';
import { readFileSync, writeFileSync, existsSync } from "fs";
import { encode, decode } from 'cbor';
import { TextColorFileName } from '../common/constants'
import {EnableStreamingVirtualList, disableStreamingVirtualList} from './StreamingVirtualTable'

// Setup screens
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

// This is the stack that gets used for remembering the order of the screens
var ScreenStack = [];

export function GetCurrentScreen()
{
    return ScreenStack[ScreenStack.length - 1];
}

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

// Handle changing colors
if(existsSync(TextColorFileName))
{
    let previouslySetColor = readFileSync(TextColorFileName, 'json');
    ChangeColor(previouslySetColor.color)
}

export function ChangeColor(color)
{
    document.getElementById("spinner").style.fill = color;
    SetColorsOverArray(document.getElementsByClassName("tile-divider-bottom"), color);
    SetColorsOverArray(document.getElementsByClassName("text"), color);
    SetColorsOverArray(document.getElementsByClassName("checkbox-unselected-color"), color);

    writeFileSync(TextColorFileName, {color:color}, 'json');
}

function SetColorsOverArray(array, color)
{
    for(let i = 0; i < array.length; i++)
    {
        array[i].style.fill = color
    }
}