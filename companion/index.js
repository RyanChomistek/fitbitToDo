// companion/index.js
import { settingsStorage } from "settings";
import { Login, GetUser } from "../companion/TaskApi";

settingsStorage.onchange = function(evt) 
{
	// Login
	if (evt.key === "excode") 
	{
		Login(evt);
	} 
	else if (evt.key === "refresh_token")
	{
		console.log('asdasdasd');
		//props.settingsStorage.setItem("refresh_token", false)
		GetUser();
	}
}



