import auth0 from 'auth0-js';

const REDIRECT_ON_LOGIN = 'redirect_on_login';

// private variables stored outside auth scope

let _idToken = null;
let _accessToken = null;
let _scopes = null;
let _expiresAt = null;

// class to handle authentication
export default class Auth {
  // parse in React Router's history so Auth can perform redirects
  constructor(history) {
    // reference history inside constructor
    this.history = history;
    // initialize userProfile as null
    this.userProfile = null;
    // initialize requested scopes here to reference later
    this.requestedScopes = 'openid profile email read:courses';
    // instantiate auth0 webAuth
    this.auth0 = new auth0.WebAuth({
      domain: process.env.REACT_APP_AUTH0_DOMAIN,
      clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
      redirectUri: process.env.REACT_APP_AUTH0_CALLBACK_URL,
      audience: process.env.REACT_APP_AUTH0_AUDIENCE,
      responseType: 'token id_token',
      scope: this.requestedScopes,
      // responseType - id_token gives us a JWT token to authenticate a user when they login and - token gives us access token so the user can make API calls
      // scope is for permissions - openid sends back a standard JWT with openid claims - profile gives us access to user data like name, nickname, picture deepending on how the user signs up - email gives us access to user email addresses
    });
  }
  // login method using auth0.authorize method that's within the auth0.WebAuth object. the method redirects users to the auth0 login page
  login = () => {
    // store current location in localStorage by stringifying this.history.location
    localStorage.setItem(
      REDIRECT_ON_LOGIN,
      JSON.stringify(this.history.location)
    );
    this.auth0.authorize();
  };

  handleAuthentication = () => {
    // the parseHash function parses the hash from the URL like err and authResult
    this.auth0.parseHash((err, authResult) => {
      // check that you have received what you expect from the hash
      if (authResult && authResult.accessToken && authResult.idToken) {
        // parse authResult data into local storage session
        this.setSession(authResult);
        // look within localStorage to get redirect location
        const redirectLocation =
          localStorage.getItem(REDIRECT_ON_LOGIN) === 'undefined'
            ? '/'
            : JSON.parse(localStorage.getItem(REDIRECT_ON_LOGIN));
        // call this.history.push to redirect to last page before login
        this.history.push(redirectLocation);
      } else if (err) {
        // handle error and alert error
        this.history.push('/');
        alert(`Error: ${err.error}. Check the console for more details.`);
        console.log(err);
      }
      localStorage.removeItem(REDIRECT_ON_LOGIN);
    });
  };

  // create setSession method to save authResult data to memory
  setSession = (authResult) => {
    // set the time that the access token will expire
    // calculate the Unix epoch time(number of milliseconds since jan 1, 1970) when the token will expire
    _expiresAt = authResult.expiresIn * 1000 + new Date().getTime();

    // If there is a value on the "scope" param from authResult, use it to set scopes in the session for the user,
    // Otherwise use the scopes as requested. If no scopes were requested, set to nothing.
    _scopes = authResult.scope || this.requestedScopes || '';

    // set localStorage items
    _accessToken = authResult.accessToken;
    // eslint-disable-next-line no-unused-vars
    _idToken = authResult.idToken;
    this.scheduleTokenRenewal();
  };

  isAuthenticated() {
    // return a boolean based on when the current time is less than the expiresAt time in memory
    return new Date().getTime() < _expiresAt;
  }

  logout = () => {
    // redirect back to homepage using auth0's logout method
    this.auth0.logout({
      clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
      returnTo: 'http://localhost:3000',
    });
  };

  getAccessToken = () => {
    // throw an error is no accessToken is found
    if (!_accessToken) {
      throw new Error('No access token found');
    }
    return _accessToken;
  };

  //
  getProfile = (cb) => {
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
    const grantedScopes = (_scopes || '').split(' ');
    // iterate over "every" scope and return true if every one of the scopes parsed into this function are found within the list of scopes in localstorage
    return scopes.every((scope) => grantedScopes.includes(scope));
  }

  // silent token renewal function via auth0's checkSession function
  // checkSession accepts 3 parameters and a callback function
  // {} - allows us to specify the audience and scope *defaults to audience and scope declared in the auth0 webauth object above
  renewToken(cb) {
    this.auth0.checkSession({}, (err, result) => {
      if (err) {
        console.log(`Error: ${err.error} - ${err.error_description}.`);
      } else {
        // call setSession with result received if there's no error
        this.setSession(result);
      }
      // cb - optional callback function that's called after the response has been received
      if (cb) cb(err, result);
    });
  }
  // function to renew token everytime it expires
  scheduleTokenRenewal() {
    const delay = _expiresAt - Date.now();
    if (delay > 0) setTimeout(() => this.renewToken(), delay);
  }
}
