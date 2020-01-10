import { CLIENT_ID, CLIENT_SECRET } from "../common/constants";

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
          authorizeUrl="https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
          clientId={ CLIENT_ID }
          scope="openid, profile, User.Read, Tasks.Read"
          //scope="openid profile User.Read Mail.Read"
          onReturn={ async (data) => {
            props.settingsStorage.setItem("excode", data.code)
          }}
          
        />
      </Section>
    </Page>
  );
}


registerSettingsPage(mySettings);
