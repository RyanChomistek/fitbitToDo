import { CLIENT_ID, SCOPES, AUTHORIZE_URL } from "../common/constants";

function mySettings(props) {
	return (
		<Page>
			<Section
				title={<Text bold align="center">Fitbit Account</Text>}>
				<Oauth
					settingsKey="oauth"
					title="OAuth Login"
					label="OAuth"
					status="Login"
					authorizeUrl={AUTHORIZE_URL}
					clientId={ CLIENT_ID }
					scope={SCOPES}
					//scope="openid profile User.Read Mail.Read"
					onReturn={ async (data) => { 
						console.log(JSON.stringify(data));
						props.settingsStorage.setItem("excode", data.code) 
					}}
				/>

			<Button
				label="Button"
				onClick={() => props.settingsStorage.setItem("refresh_token", 'true')}
			/>
			</Section>
		</Page>
	);
}


registerSettingsPage(mySettings);
