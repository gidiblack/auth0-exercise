import auth0 from 'auth0-js';

// class to handle authentication 
export default class Auth {
	// parse in React Router's history so Auth can perform redirects
	constructor(history){
		// reference history inside constructor
		this.history = history;
		// initialize userProfile as null
		this.userProfile = null;
		// initialize requested scopes here to reference later
		this.requestedScopes = "openid profile email read:courses";
		// instantiate auth0 webAuth
		this.auth0 = new auth0.WebAuth({
			domain: process.env.REACT_APP_AUTH0_DOMAIN,
			clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
			redirectUri: process.env.REACT_APP_AUTH0_CALLBACK_URL,
			audience: process.env.REACT_APP_AUTH0_AUDIENCE,
			responseType: "token id_token",
			scope: this.requestedScopes
			// responseType - id_token gives us a JWT token to authenticate a user when they login and - token gives us access token so the user can make API calls
			// scope is for permissions - openid sends back a standard JWT with openid claims - profile gives us access to user data like name, nickname, picture deepending on how the user signs up - email gives us access to user email addresses
		});
	}
	// login method using auth0.authorize method that's within the auth0.WebAuth object. the method redirects users to the auth0 login page 
	login = () => {
		this.auth0.authorize();
	};

	handleAuthentication = () => {
		// the parseHash function parses the hash from the URL like err and authResult	
		this.auth0.parseHash((err, authResult) => {
			// check that you have received what you expect from the hash
			if (authResult && authResult.accessToken && authResult.idToken) {
				// parse authResult data into local storage session
				this.setSession(authResult);
				// call this.history.push to redirect to a new URL (home page)
				this.history.push("/");
			} else if (err) {
				// handle error and alert error
				this.history.push("/");
				alert(`Error: ${err.error}. Check the console for more details.`);
				console.log(err);
			}
		});
	};

	// create setSession method to save authResult data to local storage
	setSession = authResult => {
		// set the time that the access token will expire
		const expiresAt = JSON.stringify(
			// calculate the Unix epoch time(number of milliseconds since jan 1, 1970) when the token will expire
			authResult.expiresIn * 1000 + new Date().getTime()
		);

		// If there is a value on the "scope" param from authResult, use it to set scopes in the session for the user,
		// Otherwise use the scopes as requested. If no scopes were requested, set to nothing.
		const scopes = authResult.scope || this.requestedScopes || "";

		// set localStorage items
		localStorage.setItem("access_token", authResult.accessToken);
		localStorage.setItem("id_token", authResult.idToken);
		localStorage.setItem("expires_at", expiresAt);
		localStorage.setItem("scopes", JSON.stringify(scopes));
	};

	isAuthenticated() {
		// declare expiresAt varaible using the data in local storage
		const expiresAt = JSON.parse(localStorage.getItem("expires_at"));
		// return a boolean based on when the current time is less than the expiresAt time in local storage 
		return new Date().getTime() < expiresAt;

	}

	logout = () => {
		// remove localStorage items
		localStorage.removeItem("access_token");
		localStorage.removeItem("id_token");
		localStorage.removeItem("expires_at");
		localStorage.removeItem("scopes");
		// clear user Profile
		this.userProfile = null;
		// redirect back to homepage using auth0's logout method
		this.auth0.logout({
			clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
			returnTo: "http://localhost:3000"
		});
	};

	getAccessToken = () => {
		// get accessToken from localStorage
		const accessToken = localStorage.getItem("access_token");
		// throw an error is no accessToken is found
		if (!accessToken) {
			throw new Error("No access token found");
		}
		return accessToken;
	};

	// 
	getProfile = cb => {
		// if userProfile is available, return userProfile on the cb(callback)
		if (this.userProfile) return cb(this.userProfile);
		// if no userProfile is found we call userInfo endpoint on auth0 and parse it the access token, the second param returns an err and a profile from the endpoint 
		this.auth0.client.userInfo(this.getAccessToken(), (err, profile) => {
			// if we get a profile from the endpoint we set this.userProfile to profile
			if (profile) this.userProfile = profile;
			// call the cb and parse it the profile and any err
			cb(profile, err);
		});
	};

	// check if user has scopes that accepts an array of scopes
	userHasScopes(scopes) {
		// check in localstorage for list of scopes then split the scopes in localstorage
		const grantedScopes = (
			JSON.parse(localStorage.getItem("scopes")) || ""
		).split(" ");
		// iterate over "every" scope and return true if every one of the scopes parsed into this function are found within the list of scopes in localstorage
		return scopes.every(scope => grantedScopes.includes(scope));
	}
}