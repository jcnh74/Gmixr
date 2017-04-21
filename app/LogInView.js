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
import DeviceInfo from 'react-native-device-info'



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
var textSize = 18
var buttonSize = 32

console.log(width)
if (!__DEV__) {
  if(DeviceInfo.getModel() == 'iPhone 5'){
    textSize = 14
    buttonSize = 22
  }
}
if(width == 320){
  textSize = 14
  buttonSize = 22
}

// Default View on Launch
export default class LogInView extends Component {
  constructor(props) {
    super(props)

    this._loginToSpotify = this._loginToSpotify.bind(this)

    this.state = {
      loggedIn: true,
      needpremium: false,
      firstVisit: true,
    }
  }

  _loginToSpotify(){

    this.setState({loggedIn:true}, function(){
      SpotifyAuth.startAuth((accessToken)=>{
        // console.log('startAuth')
        // console.log(accessToken)
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
      <View style={[styles.container, {backgroundColor: 'black'}]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.mediumText}>{this.props.notice}</Text>
        {(this.state.loggedIn) ? (
          <View>
          <Text style={styles.largeText}>Loading Spotify Library</Text>
          <Image 
              source={defaultImage}
              style={{width: width}}
              resizeMode='contain'
            />
          </View>
          ) : (
          <View>
            <View>
              <Text style={styles.largeText}>Welcome To Gmixr</Text>
              <Image 
                  source={defaultImage}
                  style={{flex:-1, width: width - 40}}
                  resizeMode='contain'
                />
            </View>
            <FAIcon.Button name="spotify" backgroundColor="#1ED760" size={buttonSize} onPress={this._loginToSpotify}>
              <Text style={{fontSize:textSize, color:'white'}}>Connect Premium Spotify Account</Text>
            </FAIcon.Button>
          </View>
          )}
      </View>
    )
  }
  componentWillMount() {


    if(this.props.showLogin){
      this.setState({loggedIn:false}, () => {
        this.forceUpdate()
      })
    }else{

      AsyncStorage.getItem('@GmixrStore:firstVisit', (err, res) => {
        if(res){
          this.setState({firstVisit:false}, () => {
            this.forceUpdate()
          })
        }else{
          AsyncStorage.setItem('@GmixrStore:firstVisit', 'YES')
          this.setState({firstVisit:true}, () => {
            this.forceUpdate()
          })
        }
      })

      if(this.props.userProduct == 'premium'){
        SpotifyAuth.getStatus((result)=>{
          // console.log('getStatus')
          // console.log(result)
          if(result == 'NoSession'){
            this.setState({loggedIn:false}, () => {
              this.forceUpdate()
            })
            return
          }
          if(result == 'Token expired'){

          }
        })
      }

    }



  }
  componentDidMount() {

    SpotifyAuth.setNotifications()

    // console.log(this.props)
    // Clear Storage
    // AsyncStorage.removeItem('@GmixrStore:token')
    // AsyncStorage.removeItem('@GmixrStore:timestamp')


    eventReminder = myModuleEvt.addListener('EventReminder', (data) => {
      // console.log('EventReminder')
      // console.log(data)
      var message = data.object[0]
      var obj = data.object
      if(message.includes("showPlayer")){

        var tokenObject = message.split(':')
        this._setAsyncToken(tokenObject[1])

        this.setState({loggedIn:true}, () => {
          this.forceUpdate()
        })

        
      }else if(obj.includes("audioStreamingDidLogin")){

        var tokenObject = obj.split(':')
        this._setAsyncToken(tokenObject[1])

        this.setState({loggedIn:true}, () => {
          this.forceUpdate()
        })

        Actions.player({firstVisit:this.state.firstVisit})

      }else if(message == "didReceiveError: Wrong username or password"){
        //console.log("didReceiveError: Wrong username or password")
        SpotifyAuth.logout()
        this.setState({loggedIn:false}, () => {
          this.forceUpdate()
        })
      }else if(data.object == "loginFailed"){
        this.setState({loggedIn:false}, () => {
          this.forceUpdate()
        })
      }else if(data.object == "closedLoginPage"){
        this.setState({loggedIn:false}, () => {
          this.forceUpdate()
        })
      }else if(data.object == "audioStreamingDidLogout"){
        //console.log("audioStreamingDidLogout")
        this.setState({loggedIn:false}, () => {
          this.forceUpdate()
        })
      }
    })

  }
  componentWillUnmount() {
    eventReminder.remove()
    //myModuleEvt.removeAllListeners('EventReminder')
    //myModuleEvt.removeAllListeners('EventReminder')

  }
}