import React, { Component } from 'react';

class Courses extends Component {
  state = {
    courses: [],
  };
  // lifecycle method to call fetch to call our API
  componentDidMount() {
    // fetch the course endpoint declared in server.js, parse authorization header then handle the response with an arrow func.
    fetch('/course', {
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
      .then((response) => this.setState({ courses: response.courses }))
      .catch((error) => this.setState({ message: error.message }));

    fetch('/admin', {
      // send content of access token as authorization header in server.js fetch call
      headers: { Authorization: `Bearer ${this.props.auth.getAccessToken()}` },
    })
      .then((response) => {
        // check if response is ok then return response as a json object
        if (response.ok) return response.json();
        // throw error if otherwise
        throw new Error('Network response was not ok');
      })
      .then((response) => console.log(response))
      .catch((error) => this.setState({ message: error.message }));
  }
  // render message received
  render() {
    return (
      <ul>
        {this.state.courses.map((course) => {
          return <li key={course.id}> {course.title} </li>;
        })}
      </ul>
    );
  }
}

export default Courses;
