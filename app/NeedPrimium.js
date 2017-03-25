
import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux';
import {
  Text,
  TouchableHighlight,
  View
} from 'react-native'


var styles = require('./style');

export default class NeedPrimium extends Component {
  constructor(props) {
    super(props)
    this._backToLogin = this._backToLogin.bind(this)

  }

  _backToLogin(){
    //this.props.navigator.replace({component: LogInView})
    Actions.login()
  }


  render() {

    return (
      <View style={styles.container}>
        <TouchableHighlight onPress={this._backToLogin} activeOpacity={1} underlayColor="transparent">
          <Text style={styles.mediumText}>Please Login with Premium Account</Text>
        </TouchableHighlight>
      </View>
    )
  }
  componentDidMount() {
    reset = true
    SpotifyAuth.logout()
    
  }
}