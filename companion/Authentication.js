import { CLIENT_ID, CLIENT_SECRET, TOKEN_URL, AUTHORIZE_URL, REDIRECT_URI, SCOPES} from "../common/constants";
import { settingsStorage } from "settings";
import {KJUR, b64utoutf8} from '../companion/KJUR'
function urlEncodeObject(object) 
{
	let fBody = [];
	for (let prop in object) {
		let key = encodeURIComponent(prop);
		let value = encodeURIComponent(object[prop]);
		fBody.push(key + "=" + value);
		}
		
	fBody = fBody.join("&");
	return fBody;
};

export async function GetToken(exchangeCode) 
{
	const Token_Body = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Host': 'login.microsoftonline.com'
		},
		body: urlEncodeObject({
			grant_type: "authorization_code",
			code: exchangeCode,
			redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
			//client_secret: CLIENT_SECRET,
		})
	};

	return await fetch(TOKEN_URL, Token_Body)
		.then(function(data) {
            return data.json();
		}).then(function(result) {
            console.log('Result:\n'+ JSON.stringify(Object.keys(result)));
            console.log('Result:\n'+ JSON.stringify(result));

            // Validate id token
            var id = validateIdToken(result.id_token);
            console.log(JSON.stringify(id));

            settingsStorage.setItem('IdInformation', id);
            settingsStorage.setItem('AccessToken', result.access_token);
            settingsStorage.setItem('TokenExpiresIn', parseInt(result.expires_in) * 1000);
            var timeNow = new Date();
            var expirationDate = new Date(timeNow.getTime() + parseInt(result.expires_in) * 1000);
            settingsStorage.setItem('TokenExpirationDate', expirationDate.getTime());
            settingsStorage.setItem('TokenGenerationDate', timeNow.toISOString());

            
        }).catch(function(err) {
				console.log('Error on token gen: '+ err);
			});
}

//RefreshToken().then(function(result){console.log('refres res' + result)});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

function buildAuthUrl() {
    // Generate random values for state and nonce
    var authState = uuidv4();
    var authNonce = uuidv4();
  
    var authParams = {
      response_type: 'id_token token',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state: authState,
      nonce: authNonce,
      response_mode: 'fragment'
    };
  
    return AUTHORIZE_URL + urlEncodeObject(authParams);
}

function buildAuthBody()
{
    // Generate random values for state and nonce
    var authState = uuidv4();
    var authNonce = uuidv4();
    
    var authParams = {
        response_type: 'id_token token',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state: authState,
        nonce: authNonce,
        response_mode: 'fragment'
    };

    return authParams;
}

export async function RefreshToken()
{
    
    var id = settingsStorage.getItem('IdInformation');
    //var authBody = buildAuthBody();
    //authBody.grant_type = "client_credentials";
    //authBody.prompt = "none";
    //authBody.domain_hint = id.userDomainType;
    //authBody.login_hint = id.userSigninName;
    var authBody = {
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        prompt: "none",
        domain_hint: id.userDomainType,
        login_hint: id.userSigninName,
        scope: SCOPES,
    }
    const requestBody = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic YWUzYzdjZGEtZmJjZC00ZTY2LTgzZGYtNWFkNmQ2ODJjZDM5Og==',
            'Host': 'login.microsoftonline.com'
        },
        body: urlEncodeObject(authBody)
    };
    console.log(requestBody);
    return await fetch(AUTHORIZE_URL, requestBody)
    .then(function(data) {
        return data.text();
    }).catch(function(err) {
            console.log('Error on refresh token gen: '+ err);
        });
        
    /*
    var id = settingsStorage.getItem('IdInformation');
    var authUrl = buildAuthUrl();
    console.log(authUrl)
    return await fetch(authUrl)
        .then(function(data) {
            return data.text();
        }).catch(function(err) {
                console.log('Error on refresh token gen: '+ err);
            });
    */
    
    
}

// from https://docs.microsoft.com/en-us/outlook/rest/javascript-tutorial
function validateIdToken(idToken) {
		// Per Azure docs (and OpenID spec), we MUST validate
		// the ID token before using it. However, full validation
		// of the signature currently requires a server-side component
		// to fetch the public signing keys from Azure. This sample will
		// skip that part (technically violating the OpenID spec) and do
		// minimal validation
	
		if (null == idToken || idToken.length <= 0) {
			return null;
		}
	
		// JWT is in three parts separated by '.'
		var tokenParts = idToken.split('.');
		if (tokenParts.length != 3){
			return null;
		}
	
		// Parse the token parts
		var header = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(tokenParts[0]));
		var payload = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(tokenParts[1]));
        
        /*
        we didnt use a nonce probably should in the future though
		// Check the nonce
		if (payload.nonce != sessionStorage.authNonce) {
			sessionStorage.authNonce = '';
			return null;
		}
	
		sessionStorage.authNonce = '';
        */

        // Check the audience
        console.log(payload.aud)
		if (payload.aud != CLIENT_ID) {
			return null;
		}
	
		// Check the issuer
		// Should be https://login.microsoftonline.com/{tenantid}/v2.0
		if (payload.iss !== 'https://login.microsoftonline.com/' + payload.tid + '/v2.0') {
			return null;
		}
	
		// Check the valid dates
		var now = new Date();
		// To allow for slight inconsistencies in system clocks, adjust by 5 minutes
		var notBefore = new Date((payload.nbf - 300) * 1000);
		var expires = new Date((payload.exp + 300) * 1000);
		if (now < notBefore || now > expires) {
			return null;
		}
	
		// Now that we've passed our checks, save the bits of data
		// we need from the token.
		var sessionStorage = new Object();
		sessionStorage.userDisplayName = payload.name;
		sessionStorage.userSigninName = payload.preferred_username;
	
		// Per the docs at:
		// https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-implicit-grant-flow#send-the-sign-in-request
		// Check if this is a consumer account so we can set domain_hint properly
		sessionStorage.userDomainType =
			payload.tid === '9188040d-6c67-4c5b-b112-36a304b66dad' ? 'consumers' : 'organizations';
	
        return sessionStorage;
	}