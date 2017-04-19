/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux';

import {
  AsyncStorage,
  NativeModules,
  NativeEventEmitter,
  ListView,
  Image,
  View,
  Text,
  TouchableHighlight,
  Dimensions,
  Linking
} from 'react-native'

// Components
import RNFetchBlob from 'react-native-fetch-blob'
import * as Animatable from 'react-native-animatable'

// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth
const myModuleEvt = new NativeEventEmitter(NativeModules.EventManager)
const eventReminder = null

import IOIcon from 'react-native-vector-icons/Ionicons'

var styles = require('../style');

const {height, width} = Dimensions.get('window')
const storeKeys = ['@GmixrStore:playlistsTotal', '@GmixrStore:playlists', '@GmixrStore:playlistsOffsetY', '@GmixrStore:tracksTotal', '@GmixrStore:tracks', '@GmixrStore:tracksOffsetY', '@GmixrStore:artistNext', '@GmixrStore:artist'];
const mainKeys = ['@GmixrStore:playlistsTotal', '@GmixrStore:playlists', '@GmixrStore:playlistsOffsetY', '@GmixrStore:tracksTotal', '@GmixrStore:tracks', '@GmixrStore:tracksOffsetY', '@GmixrStore:artistNext', '@GmixrStore:artist', '@GmixrStore:token'];

export default class SettingsView extends Component {
  constructor(props) {
    super(props)

    this._logout = this._logout.bind(this)
    this._clearData = this._clearData.bind(this)
    this._clearPreferences = this._clearPreferences.bind(this)
    this._clearCache = this._clearCache.bind(this)

    this.state = {
      loggingOut: false,
      clearingData: false,
      clearingPrefs: false,
      clearingCache: false,
      freespace: 0
    }
  }

  _logout(){
    // AsyncStorage.flushGetRequests()
    this.setState({
      loggingOut: true
    }, () => {
      AsyncStorage.multiRemove(storeKeys, (err) => {
        RNFetchBlob.session('Gmixr').dispose().then(() => {
          SpotifyAuth.logout()
        })
      })
    })

  }

  _clearData(){
    // AsyncStorage.flushGetRequests()
    this.setState({
      clearingData: true
    }, () => {
      AsyncStorage.multiRemove(storeKeys, (err) => {
        RNFetchBlob.session('Gmixr').dispose().then(() => {
          SpotifyAuth.getFreeSpace((space)=>{
            this.setState({
              freespace: space,
              clearingData: false
            })
          })
        })
      })
    })
  }

  _clearPreferences(){
    // AsyncStorage.flushGetRequests()
    this.setState({
      clearingPrefs: true
    }, () => {
      AsyncStorage.getAllKeys((err, keys) => {
        for(i = 0; i < keys.length; i++){
          var found = mainKeys.some(function (key) {
            return key === keys[i];
          })
          if(!found){
            console.log(keys[i])
            AsyncStorage.removeItem(keys[i]);
          }
        }
        this.setState({clearingPrefs: false})
      })
    })
  }


  _clearCache(){
    this.setState({
      clearingCache: true
    }, () => {
      AsyncStorage.multiRemove(storeKeys, (err) => {
        this.setState({clearingCache: false})
      })
    })
  }storeKeys

  render() {

    // AsyncStorage.removeItem('@GmixrStore:tracks')
    // AsyncStorage.removeItem('@GmixrStore:tracksTotal')
    // this.props.avatar

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
        <View style={{height:48, width: width, marginBottom:20, flex:-1}}>
          <TouchableHighlight style={[styles.row]} onPress={this._logout} activeOpacity={1} underlayColor="transparent">
            <View style={styles.flexRow}>
              <View style={{marginLeft:8}}>
                <Text style={[styles.listTitleText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  {this.props.currentUser.display_name}
                </Text>
                <Text style={[styles.listDescText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  {'Spotify: ' + this.props.currentUser.id}
                </Text>
              </View>
              <View style={{width: 90, height:48, justifyContent: 'center', alignItems: 'center'}}>
                {(this.state.loggingOut) ? (
                  <Animatable.View animation="rotate" iterationCount="infinite" >
                    <IOIcon name="ios-sync"  backgroundColor="transparent" color="white" size={20} />
                  </Animatable.View>
                ) : (
                    <IOIcon name="ios-log-out-outline"  backgroundColor="transparent" color="white" size={20} />
                )}
                <Text style={styles.listDescText} numberOfLines={1}>
                  {(this.state.loggingOut) ? 'Logging Out...' : 'Logout'}
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
        <View style={{height:48, width: width, marginBottom:20,  flex:-1}}>
          <TouchableHighlight style={[styles.row]} onPress={this._clearData} activeOpacity={1} underlayColor="transparent">

            <View style={styles.flexRow}>
              <View style={{marginLeft:8}}>
                <Text style={[styles.listTitleText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  Clear Downloaded Data
                </Text>
                <Text style={[styles.listDescText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  {'Free Space: ' + this.state.freespace}
                </Text>
              </View>
              <View style={{width: 90, height:48, justifyContent: 'center', alignItems: 'center'}}>
                {(this.state.clearingData) ? (
                  <Animatable.View animation="rotate" iterationCount="infinite" >
                    <IOIcon name="ios-sync"  backgroundColor="transparent" color="white" size={20} />
                  </Animatable.View>
                ) : (
                  <IOIcon name="md-trash"  backgroundColor="transparent" color="white" size={20} />
                )}
                <Text style={styles.listDescText} numberOfLines={1}>
                  {(this.state.clearingData) ? 'Clearing...' : 'Clear'}
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
        <View style={{height:48, width: width, marginBottom:20,  flex:-1}}>
          <TouchableHighlight style={[styles.row]} onPress={this._clearPreferences} activeOpacity={1} underlayColor="transparent">

            <View style={styles.flexRow}>
              <View style={{marginLeft:8}}>
                <Text style={[styles.listTitleText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  Clear Preferences
                </Text>
                <Text style={[styles.listDescText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  {'Saved Searchs'}
                </Text>
              </View>
              <View style={{width: 90, height:48, justifyContent: 'center', alignItems: 'center'}}>
                {(this.state.clearingPrefs) ? (
                  <Animatable.View animation="rotate" iterationCount="infinite" >
                    <IOIcon name="ios-sync"  backgroundColor="transparent" color="white" size={20} />
                  </Animatable.View>
                ) : (
                  <IOIcon name="md-trash"  backgroundColor="transparent" color="white" size={20} />
                )}
                <Text style={styles.listDescText} numberOfLines={1}>
                  {(this.state.clearingPrefs) ? 'Clearing...' : 'Clear'}
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
        <View style={{height:48, width: width, marginBottom:20,  flex:-1}}>
          <TouchableHighlight style={[styles.row]} onPress={this._clearCache} activeOpacity={1} underlayColor="transparent">

            <View style={styles.flexRow}>
              <View style={{marginLeft:8}}>
                <Text style={[styles.listTitleText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  Clear Spotify Cache
                </Text>
                <Text style={[styles.listDescText, {width: width - 16 - 90 }]} numberOfLines={1}>
                  {'Refresh Stored Spotify User Library'}
                </Text>
              </View>
              <View style={{width: 90, height:48, justifyContent: 'center', alignItems: 'center'}}>
                {(this.state.clearingCache) ? (
                  <Animatable.View animation="rotate" iterationCount="infinite" >
                    <IOIcon name="ios-sync"  backgroundColor="transparent" color="white" size={20} />
                  </Animatable.View>
                ) : (
                  <IOIcon name="md-trash"  backgroundColor="transparent" color="white" size={20} />
                )}
                <Text style={styles.listDescText} numberOfLines={1}>
                  {(this.state.clearingCache) ? 'Clearing...' : 'Clear'}
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

    SpotifyAuth.setNotifications()

    SpotifyAuth.getFreeSpace((space)=>{
      this.setState({
        freespace: space
      })
    })

    eventReminder = myModuleEvt.addListener('EventReminder', (data) => {
      console.log('EventReminder')
      console.log(data)
      if(data.object == "audioStreamingDidLogout"){
        Actions.login({userProduct:'open', notice:'Logged Out'})
      }
    })

    RNFetchBlob.fs.lstat()
    .then((stats) => {
      console.log(stats)
    })
    .catch((err) => {
      console.log(err)
    })

    // var avatar = 'https://facebook.github.io/react/img/logo_og.png'
    // if(typeof(this.props.currentUser.images) !== 'undefined' && this.state.currentUser.images.length){
    //   avatar = this.props.currentUser.images[0].url
    // }

  }

  componentWillUnmount() {
    eventReminder.remove()
    //myModuleEvt.removeEventListener('EventReminder')
    //myModuleEvt.removeAllListeners('EventReminder')

  }

}
