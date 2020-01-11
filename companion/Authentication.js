import { CLIENT_ID, CLIENT_SECRET, TOKEN_URL, AUTHORIZE_URL, REDIRECT_URI, SCOPES} from "../common/constants";
import { settingsStorage } from "settings";
import {KJUR, b64utoutf8} from '../companion/KJUR'

export async function EnsureTokenState()
{
    var timeNow = new Date();
    var experationTime = settingsStorage.getItem('TokenExpirationDate');
    var expiresIn = settingsStorage.getItem('TokenExpiresIn');
    var percentOfTimeLeft = (experationTime - timeNow) / expiresIn;

    if(percentOfTimeLeft < .1)
    {
        // refresh
        console.log("refreshing")
        var accessToken = settingsStorage.getItem('AccessToken');
        return await RefreshToken().then(function(foundUser) {
            console.log('found user:'+ foundUser);
        });
    }
}

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
		})
	};

	return await fetch(TOKEN_URL, Token_Body)
		.then(function(data) {
            return data.json();
		}).then(function(result) {
            ExtractTokenResposeInfo(result);
        }).catch(function(err) {
                console.log('Error on token gen: '+ err);
        });
}

//RefreshToken().then(function(result){console.log('refres res' + result)});
async function RefreshToken()
{
    var refreshToken = settingsStorage.getItem('RefreshToken');

    var authBody = {
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        scope: SCOPES,
        refresh_token: refreshToken,
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
    
    return await fetch(TOKEN_URL, requestBody)
        .then(function(data) {
            return data.json();
        }).then(function(result) {
            ExtractTokenResposeInfo(result);
            return true;
        }).catch(function(err) {
            console.log('Error on refresh token gen: '+ err);
            return false;
        });
}

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

function ExtractTokenResposeInfo(tokenResponse)
{
    //console.log('R Result headers:\n'+ JSON.stringify(Object.keys(result)));
    //console.log('R Result body:\n'+ JSON.stringify(result));
    // Validate id token
    var id = validateIdToken(tokenResponse.id_token);
    //console.log(JSON.stringify(id));

    settingsStorage.setItem('IdInformation', id);
    settingsStorage.setItem('AccessToken', tokenResponse.access_token);
    settingsStorage.setItem('RefreshToken', tokenResponse.refresh_token);
    settingsStorage.setItem('TokenExpiresIn', parseInt(tokenResponse.expires_in) * 1000);

    var timeNow = new Date();
    var expirationDate = new Date(timeNow.getTime() + parseInt(tokenResponse.expires_in) * 1000);
    settingsStorage.setItem('TokenExpirationDate', expirationDate.getTime());
    settingsStorage.setItem('TokenGenerationDate', timeNow.toISOString());
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
        //console.log(payload.aud)
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