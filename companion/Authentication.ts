import { CLIENT_ID, CLIENT_SECRET, TOKEN_URL, AUTHORIZE_URL, REDIRECT_URI, SCOPES} from "../common/Constants";
import { settingsStorage } from "settings";

import {KJUR, b64utoutf8} from './KJUR'
import {urlEncodeObject} from "../common/HTTPUtil"

export function HasValidTokenState()
{
	let timeNow: number = new Date().getTime();
    let experationTime: number = parseInt(settingsStorage.getItem('TokenExpirationDate'));
    let expiresIn: number = parseInt(settingsStorage.getItem('TokenExpiresIn'));
	let percentOfTimeLeft: number = (experationTime - timeNow) / expiresIn;
	console.log(`time Left before token expires ${percentOfTimeLeft}`)
	return percentOfTimeLeft > .1;
}

export async function EnsureTokenState()
{
	//console.log(`access token ${settingsStorage.getItem('AccessToken')} ++++++++++++++++++++++++++++++++++++++')`)
	//console.log(`access token ${settingsStorage.getItem('AccessToken') == 'undefined'} ++++++++++++++++++++++++++++++++++++++')`)
	//do we even have a token
	if(settingsStorage.getItem('AccessToken') == undefined || settingsStorage.getItem('AccessToken') == 'undefined')
	{
		console.log('asdasdasdasdasd++++++++++++++++++++++++++++++++++++++')
		throw 'no AccessToken, user has not logged in yet';
	}

    if(!HasValidTokenState())
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
	const body = urlEncodeObject({
		grant_type: "authorization_code",
		code: exchangeCode,
		redirect_uri: REDIRECT_URI,
		client_id: CLIENT_ID,
	});

	const headers = new Headers({
		'Content-Type': 'application/x-www-form-urlencoded',
		'Host': 'login.microsoftonline.com'
	});

	const method = 'POST';

	const Token_Body = {
		body: body, 
		headers: headers, 
		method: method
	} as RequestInit;

	
	
	console.log(`token request ${exchangeCode}`)
	console.trace();
	return await fetch(TOKEN_URL, Token_Body)
		.then(async function(data) {
            return await data.json();
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

class IdInfo
{
	constructor(
		public userDisplayName,
		public userSigninName,
		public userDomainType
	)
	{

	}
}

function ExtractTokenResposeInfo(tokenResponse)
{
    console.log('R Result headers:\n'+ JSON.stringify(Object.keys(tokenResponse)));
    console.log('R Result body:\n'+ JSON.stringify(tokenResponse));
    // Validate id token
    var id = validateIdToken(tokenResponse.id_token);
    //console.log(JSON.stringify(id));

	// IMPORTANT if you add any new settings here make sure to clear them out in login (in ../settings/index.js)
	settingsStorage.setItem('IsLoggedIn', JSON.stringify(true));
    settingsStorage.setItem('IdInformation', JSON.stringify(id));
    settingsStorage.setItem('AccessToken', tokenResponse.access_token);
    settingsStorage.setItem('RefreshToken', tokenResponse.refresh_token);
    settingsStorage.setItem('TokenExpiresIn', JSON.stringify(parseInt(tokenResponse.expires_in) * 1000));

    var timeNow = new Date();
    var expirationDate = new Date(timeNow.getTime() + parseInt(tokenResponse.expires_in) * 1000);
    settingsStorage.setItem('TokenExpirationDate', JSON.stringify(expirationDate.getTime()));
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
		let userDisplayName = payload.name;
		let userSigninName = payload.preferred_username;
	
		// Per the docs at:
		// https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-implicit-grant-flow#send-the-sign-in-request
		// Check if this is a consumer account so we can set domain_hint properly
		let userDomainType =
			payload.tid === '9188040d-6c67-4c5b-b112-36a304b66dad' ? 'consumers' : 'organizations';
	
		var sessionStorage = new IdInfo(userDisplayName, userSigninName, userDomainType);
        return sessionStorage;
	}