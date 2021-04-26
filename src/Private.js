import React, { Component } from 'react';

class Private extends Component {
  state = {
    message: '',
  };
  // lifecycle method to call fetch to call our API
  componentDidMount() {
    // fetch the private endpoint declared in server.js, parse authorization header then handle the response with an arrow func.
    fetch('/private', {
      // send content of access token as authorization header in server.js fetch call
      headers: { Authorization: `Bearer ${this.props.auth.getAccessToken()}` },
    })
      .then((response) => {
        // check if response is ok then return response as a json object
        if (response.ok) return response.json();
        // throw error if otherwise
        throw new Error('Network response was not ok');
      })
      // then set the json response message to the state
      .then((response) => this.setState({ message: response.message }))
      .catch((error) => this.setState({ message: error.message }));
  }
  // render message received
  render() {
    return <p>{this.state.message}</p>;
  }
}

export default Private;
