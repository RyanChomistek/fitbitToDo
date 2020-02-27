// @ts-nocheck

import { CLIENT_ID, CLIENT_SECRET, SCOPES, AUTHORIZE_URL } from "../common/constants";

function HasValidTokenState(props)
{
	var timeNow = new Date();
    var experationTime = props.settingsStorage.getItem('TokenExpirationDate');
	var expiresIn = props.settingsStorage.getItem('TokenExpiresIn');
	
	var percentOfTimeLeft = (experationTime - timeNow) / expiresIn;
	//console.log(`${experationTime} ${expiresIn} ${percentOfTimeLeft < .1}`)
	return percentOfTimeLeft > .1;
}

function Logout(props)
{
	console.log('LOGGING OUT ++++++++++++++ ' + props.settingsStorage.getItem('IsLoggedIn'));
	props.settingsStorage.setItem('IsLoggedIn', 'false');
	props.settingsStorage.setItem('IdInformation', "");
    props.settingsStorage.setItem('AccessToken', "");
    props.settingsStorage.setItem('RefreshToken', "");
	props.settingsStorage.setItem('TokenExpiresIn', "");
	props.settingsStorage.setItem('TokenExpirationDate', "");
	props.settingsStorage.setItem('TokenGenerationDate', "");
}

function GetLoginSection(props)
{
	return (
	<Section
		description= {<Text> {`Click the above to log in`} </Text>}
		title={<Text bold align="center">Microsoft Account</Text>}>
		<Oauth
			settingsKey="oauth"
			title="Microsoft Login"
			label="Microsoft Login"
			status={'Login'}
			authorizeUrl={AUTHORIZE_URL}
			clientId={CLIENT_ID}
			clientSecret={CLIENT_SECRET}
			scope={SCOPES}
			onReturn={ async (data) => { 
				if(data.error)
				{
					console.log('settings ' + JSON.stringify(data));
					props.settingsStorage.setItem("error", data.error);
				}
				else
				{
					props.settingsStorage.setItem("excode", data.code);
				}
				
			}}
		/>
	</Section>
	);
}

function GetLogoutSection(props)
{
	let idInfo = JSON.parse(props.settingsStorage.getItem("IdInformation"));

	return (
		<Section
			description= {<Text> {`Logged in as ${idInfo.userSigninName}`} </Text>}
			title={<Text bold align="center">Microsoft Account</Text>}>
			<Button
				label={`Logout`}
				onClick={ () => {Logout(props)}}
		  	/>
		</Section>
		);
}

function ClearAllInformation(props)
{
	Logout(props);
	props.settingsStorage.clear();
	props.settingsStorage.setItem('ClearAllInfo', 'true');
}

function mySettings(props) 
{
	// if this is the first time we boot the app
	if(!props.settingsStorage.getItem('firstLoginCompleted'))
	{
		console.log('first log in')
		props.settingsStorage.setItem('firstLoginCompleted', JSON.stringify(true));
		props.settingsStorage.setItem('ShowCompletedTasks', JSON.stringify(true));
	}

	let hasValidToken = HasValidTokenState(props);

	let microsoftAccountSection;

	if(hasValidToken)
	{
		microsoftAccountSection = GetLogoutSection(props);
	}
	else
	{
		microsoftAccountSection = GetLoginSection(props)
	}

	return (
		<Page>
			{microsoftAccountSection}
			<Section
				title={<Text bold align="center"> Color Options </Text>}>
				<Text align="left"> Text Color </Text>
				<ColorSelect
					settingsKey="NormalColorChanged"
					label="Normal Text Color"
					colors={[
						{color: 'tomato'},
						{color: 'sandybrown'},
						{color: 'gold'},
						{color: 'aquamarine'},
						{color: 'deepskyblue'},
						{color: 'plum'},
						{color: 'azure'},
						{color: 'firebrick'},
						{color: 'lightsteelblue'},
						{color: 'palevioletred'},
						{color: 'olivedrab'},
						{color: 'mediumturquoise'},
					]}
				/>
			</Section>
			<Toggle
				value={true}
				settingsKey="ShowCompletedTasks"
				label="show completed tasks"
			/>
			<Section description='Use this to clear all information from this companion and any attached devices, this will log you out.'>
				<Button
					label={`Clear All Local Info`}
					onClick={ () => {ClearAllInformation(props)}}
				/>
			</Section>
			
		</Page>
	);
}


registerSettingsPage(mySettings);
