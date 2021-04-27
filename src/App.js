import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import Home from './Home';
import Profile from './Profile';
import Nav from './Nav';
import Auth from './auth/Auth';
import Callback from './Callback';
import Public from './Public';
import Private from './Private';
import Courses from './Courses';
import PrivateRoute from './PrivateRoute';
import AuthContext from './AuthContext';

class App extends Component {
  constructor(props) {
    super(props);
    // instantiate new Auth object parsing in the props.history so that Auth can interact with React router and have access to the history
    this.state = {
      auth: new Auth(this.props.history),
      tokenRenewalComplete: false,
    };
  }

  // call renewToken inside componentDidMount function then set tokenRenewalComplete to true when renewToken is complete
  // componentDidMount surpresses rendering until function called inside is complete
  componentDidMount() {
    this.state.auth.renewToken(() =>
      this.setState({ tokenRenewalComplete: true })
    );
  }

  render() {
    const { auth } = this.state;
    // show loading message until the token renewal check is completed.
    if (!this.state.tokenRenewalComplete) return 'Loading...';
    return (
      // Wrap routes in AuthContext.Provider to fulfill the second step to configure context.
      // this way all the components within the provider can authomatically access the {auth} object parsed as value prop by importing AuthContext.Consumer
      <AuthContext.Provider value={auth}>
        <Nav auth={auth} />
        <div className="body">
          <Route
            path="/"
            exact
            render={(props) => <Home auth={auth} {...props} />}
          />

          <Route
            path="/callback"
            render={(props) => <Callback auth={auth} {...props} />}
          />
          {/* Use private route to handle profile page redirects */}
          <PrivateRoute path="/profile" component={Profile} />
          {/* render={(props) =>
              auth.isAuthenticated() ? (
                <Profile auth={auth} {...props} />
              ) : (
                <Redirect to="/" />
              )
            } */}

          <Route path="/public" component={Public} />

          <PrivateRoute path="/private" component={Private} />
          {/* render={(props) =>
              auth.isAuthenticated() ? (
                <Private auth={auth} {...props} />
              ) : (
                auth.login()
              )
            } */}

          <PrivateRoute
            path="/course"
            component={Courses}
            scopes={['read:courses']}
          />
          {/* render={(props) =>
              auth.isAuthenticated() &&
              auth.userHasScopes(['read:courses']) ? (
                <Courses auth={auth} {...props} />
              ) : (
                auth.login()
              )
            } */}
        </div>
      </AuthContext.Provider>
    );
  }
}

export default App;
