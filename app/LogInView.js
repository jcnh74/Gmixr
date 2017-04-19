// Dependencies
import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux';
import {
  StatusBar,
  AsyncStorage,
  Image,
  NativeModules,
  NativeEventEmitter,
  Text,
  TouchableHighlight,
  View,
  Dimensions,
  LayoutAnimation
} from 'react-native'

import FAIcon from 'react-native-vector-icons/FontAwesome'

var styles = require('./style');

const defaultImages = [
  require('../assets/gmixr-logo.gif'), 
  require('../assets/gmixr-logo2.gif'), 
  require('../assets/gmixr-logo3.gif'),
  require('../assets/gmixr-logo4.gif'),
]
defaultImages.sort(() => {
  return .5 - Math.random()
})
var defaultImage = defaultImages[0]

const {height, width} = Dimensions.get('window')


// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth
const myModuleEvt = new NativeEventEmitter(NativeModules.EventManager)
const eventReminder = null

// Default View on Launch
export default class LogInView extends Component {
  constructor(props) {
    super(props)

    this._loginToSpotify = this._loginToSpotify.bind(this)

    this.state = {
      loggedIn: false,
      needpremium: false
    }
  }

  _loginToSpotify(){

    this.setState({loggedIn:true}, function(){
      SpotifyAuth.startAuth((accessToken)=>{
        console.log('startAuth')
        console.log(accessToken)
        if(!accessToken){

          SpotifyAuth.getToken((token)=>{
            this._setAsyncToken(token)
          })

          //Actions.player()
          //this.props.navigator.replace({component: PlayerView})

        } else {
          this._setAsyncToken(accessToken)
          
          //Actions.player()
          //this.props.navigator.replace({component: PlayerView})
        }
      })
    })     
  }

  _setAsyncToken(token){
    AsyncStorage.setItem('@GmixrStore:token', token)
  }
  _setAsyncLoggedIn(bool){
    AsyncStorage.setItem('@GmixrStore:loggedIn', bool)
  }

  render() {

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.mediumText}>{this.props.notice}</Text>
        {(this.state.loggedIn) ? (
          <View>
          <Text style={styles.mediumText}>Loading Spotify Library</Text>
          <Image 
              source={defaultImage}
              style={{width: width}}
              resizeMode='contain'
            />
          </View>
          ) : (
          <FAIcon.Button name="spotify" backgroundColor="#1ED760" size={32} onPress={this._loginToSpotify}>
            <Text style={{fontSize:18, color:'white'}}>Connect Premium Spotify Account</Text>
          </FAIcon.Button>

          )}
      </View>
    )
  }
  componentWillMount() {

    AsyncStorage.getItem('@GmixrStore:firstVisit', (err, res) => {
      if(res){
        console.log('firstVisit')
        AsyncStorage.setItem('@GmixrStore:firstVisit', true)
      }
    })

    // let keys = ['@GmixrStore:token', '@GmixrStore:playlists', '@GmixrStore:playlistsTotal'];
    // AsyncStorage.multiRemove(keys, (err) => {
    if(this.props.userProduct == 'premium'){
      SpotifyAuth.getStatus((result)=>{
        console.log('getStatus')
        console.log(result)
        if(result == 'NoSession'){

          return
        }
        if(result == 'Token expired'){

        // AsyncStorage.removeItem('@GmixrStore:playlists')
        // AsyncStorage.removeItem('@GmixrStore:playlistsTotal')

          SpotifyAuth.renewToken((token)=>{

            this._setAsyncToken(token)

            this.setState({loggedIn:true}, function(){
              this.forceUpdate()
            })

            //Actions.player()
          })
        }
      })
    }
    // });
  }
  componentDidMount() {

    SpotifyAuth.setNotifications()

    console.log(this.props)
    // Clear Storage
    // AsyncStorage.removeItem('@GmixrStore:token')
    // AsyncStorage.removeItem('@GmixrStore:timestamp')


    eventReminder = myModuleEvt.addListener('EventReminder', (data) => {
      // console.log('EventReminder')
      // console.log(data)
      var message = data.object[0]
      if(data.object == "showPlayer"){
        this.setState({loggedIn:true}, function(){
          this.forceUpdate()
        })

        Actions.player()
      }else if(data.object == "audioStreamingDidLogin"){
        this.setState({loggedIn:true}, function(){
          this.forceUpdate()
        })

        Actions.player()
      }else if(message == "didReceiveError: Wrong username or password"){
        //console.log("didReceiveError: Wrong username or password")
        SpotifyAuth.logout()
        this.setState({loggedIn:false}, function(){
          this.forceUpdate()
        })
      }else if(data.object == "loginFailed"){
        this.setState({loggedIn:false}, function(){
          this.forceUpdate()
        })
      }else if(data.object == "closedLoginPage"){
        this.setState({loggedIn:false}, function(){
          this.forceUpdate()
        })
      }else if(data.object == "audioStreamingDidLogout"){
        //console.log("audioStreamingDidLogout")
        this.setState({loggedIn:false}, function(){
          this.forceUpdate()
        })
      }
    })

  }
  componentWillUnmount() {
    eventReminder.remove()
    myModuleEvt.removeAllListeners('EventReminder')
    //myModuleEvt.removeAllListeners('EventReminder')

  }
}