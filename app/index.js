/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */

// Dependencies
import React, { Component } from 'react'
import { Router, Scene } from 'react-native-router-flux';

// Views
import LogInView from './LogInView';
import NeedPrimium from './NeedPrimium';
import PlayerView from './PlayerView';


//Used to navigate between other components
export default class App extends Component {
  render(){
    return (
      <Router>
        <Scene key="root">
          <Scene 
            key="login"
            component={LogInView}
            initial={true}
            hideNavBar={true}
          />
          <Scene 
            key="player"
            component={PlayerView}
            hideNavBar={true}
          />
          <Scene 
            key="notice"
            component={NeedPrimium}
            hideNavBar={true}
          />
        </Scene>
      </Router>

    )
  }
}

