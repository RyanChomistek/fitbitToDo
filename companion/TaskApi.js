import { GetToken, RefreshToken } from "../companion/Authentication.js";
import { settingsStorage } from "settings";

export async function GetUser()
{
    var timeNow = new Date();
    var experationTime = settingsStorage.getItem('TokenExpirationDate');
    var expiresIn = settingsStorage.getItem('TokenExpiresIn');
    var percentOfTimeLeft = (experationTime - timeNow) / expiresIn;
    if(percentOfTimeLeft < 1)
    {
        // refresh
        console.log("refreshing")
        var accessToken = settingsStorage.getItem('AccessToken');
        return await RefreshToken().then(function(result) {
            console.log('Result:\n'+ JSON.stringify(Object.keys(result)));
            console.log('Result:\n'+ JSON.stringify(result));
        });
    }
}

export async function Login(evt)
{
    console.log(evt)
    return await GetToken(evt.newValue).then(function(result) {
        //GetApi(result.access_token).then(function(testResult){
            //console.log('Result:\n'+ JSON.stringify(testResult.value));
            //console.log('Result:\n'+ JSON.stringify(testResult.error));
        //});
    }).catch(function(err){
        console.log('Err: '+ err);
    });
}

function SaveAccessTokenToSettings(tokenResponse)
{

}

export async function GetApi(accessToken)
{
	console.log("starting test " + accessToken);

	const getRequest = {
		method: 'GET',
		headers: {
			'Authorization': "Bearer " + accessToken,
			'Host': 'graph.microsoft.com',
			}
		};
	
	var tasksEndpoint = 'https://graph.microsoft.com/beta/me/outlook/taskfolders';
	
	return await fetch(tasksEndpoint, getRequest).then(function(data){
		return data.json();
	})
}