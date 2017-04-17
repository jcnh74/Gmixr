/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'

import {
  AsyncStorage,
  NativeModules,
  ListView,
  Image,
  View,
  Text,
  TouchableHighlight,
  Dimensions,
  Linking
} from 'react-native'

// Components


// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth

import IOIcon from 'react-native-vector-icons/Ionicons'

var styles = require('../style');

const {height, width} = Dimensions.get('window')


export default class SettingsView extends Component {
  constructor(props) {
    super(props)

    this.state = {
    }
  }


  render() {

    // AsyncStorage.removeItem('@GmixrStore:tracks')
    // AsyncStorage.removeItem('@GmixrStore:tracksTotal')

    return (
      <View style={{
        flex: 1,
        flexDirection: 'column',
      }}>
        <View style={{marginTop: 10, marginBottom: 40}}>
          <Text style={[styles.listTitleText, {width: width, textAlign: 'center'}]} numberOfLines={1}>
            Settings
          </Text>
        </View>
        <View style={{height:48, width: width, flex:-1}}>
          <TouchableHighlight style={[styles.row]} onPress={() => Linking.openURL('https://www.spotify.com/us/account/apps/')} activeOpacity={1} underlayColor="transparent">

            <View style={styles.flexRow}>
              <View>
                <View style={{width: 48, height:48, borderRadius: 24, overflow: 'hidden'}}>
                  <Image style={styles.playlistThumbnail} source={{ uri: this.props.avatar}} /> 
                </View>
              </View>
              <View style={{marginLeft:8}}>
                <Text style={[styles.listTitleText, {width: width - (56 + 8) - 90 }]} numberOfLines={1}>
                  {this.props.currentUser.display_name}
                </Text>
                <Text style={[styles.listDescText, {width: width - (56 + 8) - 90 }]} numberOfLines={1}>
                  {this.props.currentUser.id}
                </Text>
              </View>
              <View style={{width: 90, height:48, justifyContent: 'center', alignItems: 'center'}}>
                <IOIcon name="ios-log-out-outline"  backgroundColor="transparent" color="white" size={30} />
                <Text style={styles.listDescText} numberOfLines={1}>
                  Spotify Logout
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    )
  }

  componentDidMount() {

    console.log(this.props.currentUser)

    // var avatar = 'https://facebook.github.io/react/img/logo_og.png'
    // if(typeof(this.props.currentUser.images) !== 'undefined' && this.state.currentUser.images.length){
    //   avatar = this.props.currentUser.images[0].url
    // }

  }

}
