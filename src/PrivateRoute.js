import React from 'react';
import { Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import AuthContext from './AuthContext';

function PrivateRoute({ component: Component, auth, scopes, ...rest }) {
  return (
    // wrap Route with AuthContext.Consumer to fullfil the last step to configure context.
    // Context consumer expects you to declare a render prop and parse in whatever data that was parsed on context.provider value
    <AuthContext.Consumer>
      {(auth) => (
        <Route
          {...rest}
          render={(props) => {
            // Redirect to login if not logged in.
            if (!auth.isAuthenticated()) return auth.login();
            // Display message if user lacks required scope(s)
            if (scopes.length > 0 && !auth.userHasScopes(scopes)) {
              return (
                <h1>
                  Unauthorized - You need the following scope(s) to view this
                  page: {scopes.join(',')}.
                </h1>
              );
            }
            // Render component
            return <Component auth={auth} {...props} />;
          }}
        />
      )}
    </AuthContext.Consumer>
  );
}

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  scopes: PropTypes.array,
};

PrivateRoute.defaultProps = {
  scopes: [],
};

export default PrivateRoute;
