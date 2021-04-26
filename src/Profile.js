import React, { Component } from 'react';

class Profile extends Component {
  // declare state values
  state = {
    profile: null,
    error: '',
  };
  // load state when component mounts
  componentDidMount() {
    this.loadUserProfile();
  }
  // get profile info and set state
  loadUserProfile() {
    this.props.auth.getProfile((profile, error) =>
      this.setState({ profile, error })
    );
  }
  // render profile info
  render() {
    const { profile } = this.state;
    if (!profile) return null;
    return (
      <>
        <h2>Profile</h2>
        <p>{profile.nickname}</p>
        <img
          style={{ maxWidth: 60, maxHeight: 60 }}
          src={profile.picture}
          alt="profile"
        />
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </>
    );
  }
}

export default Profile;
