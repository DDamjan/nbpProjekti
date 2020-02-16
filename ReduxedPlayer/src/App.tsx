import React, { Component } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import Cookies from 'universal-cookie';
import HomeComponent from './components/HomeComponent';
import LoginComponent from './components/LoginComponent';
import RegisterComponent from './components/RegisterComponent';
import PlaylistDetailsComponent from './components/PlaylistDetailsComponent';
import NavComponent from './components/NavComponent';
import { Container } from 'react-bootstrap';
import FriendDetailsComponent from './components/FriendDetailsComponent';
import FriendHomeComponent from './components/FriendHomeComponent';
import FriendPlaylistDetailComponent from './components/FriendPlaylistDetailComponent';

const App: React.FC = () => {

  let loggedIn = () => {
    const cookies = new Cookies();
    let cookie = cookies.get('logedIn');
    return cookie != null;
  }
  return (
    <Router>
      <Route exact path="/" render={() => (
        loggedIn() ? (
              <HomeComponent />

        ) : (
            <Redirect to="/login" />
          )
      )}>
      </Route>
      <Route path="/login" component={LoginComponent}></Route>
      <Route path="/register" component={RegisterComponent}></Route>
      <Route path="/playlist/:id" component={PlaylistDetailsComponent}></Route>
      <Route path="/friends" component={FriendDetailsComponent}></Route>
      <Route path="/friend/:id" component={FriendHomeComponent}></Route>
      <Route path="/friendplaylist/:id" component={FriendPlaylistDetailComponent}></Route>
    </Router>
  );
}

export default App;
