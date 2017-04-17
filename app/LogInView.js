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


// Default View on Launch
export default class LogInView extends Component {
  constructor(props) {
    super(props)

    this._loginToSpotify = this._loginToSpotify.bind(this)

    this.state = {
      loggedIn: false
    }
  }

  _loginToSpotify(){

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
        {(this.state.loggedIn) ? (
          <Image 
              source={defaultImage}
              style={{width: width}}
              resizeMode='contain'
            />
          ) : (
          <FAIcon.Button name="spotify" backgroundColor="#1ED760" size={32} onPress={this._loginToSpotify}>
            <Text style={{fontSize:18, color:'white'}}>Login with Spotify</Text>
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

    SpotifyAuth.getStatus((result)=>{
      console.log('getStatus')
      console.log(result)
      if(result == 'NoSession'){


        // SpotifyAuth.startAuth((accessToken)=>{
        //   console.log('getToken')
        //   console.log(accessToken)
        //   this._setAsyncToken(accessToken)
        //   if(!accessToken){
        //     console.log('nothing')
        //   }
        // })

        return
      }
      if(result == 'Token expired'){
        SpotifyAuth.renewToken((token)=>{
          console.log('renewToken')
          console.log(token)
          this._setAsyncToken(token)
          this.setState({loggedIn:true}, 
          function(){
            this.forceUpdate()
          })

          //Actions.player()
        })
      }
    })
  }
  componentDidMount() {

    SpotifyAuth.setNotifications()


    // Clear Storage
    // AsyncStorage.removeItem('@GmixrStore:token')
    // AsyncStorage.removeItem('@GmixrStore:timestamp')


    myModuleEvt.addListener('EventReminder', (data) => {
      console.log('EventReminder')
      console.log(data)
      var message = data.object[0]
      if(data.object == "showPlayer"){
        this.setState({loggedIn:true}, 
        function(){
          this.forceUpdate()
        })

        Actions.player()
      }else if(data.object == "audioStreamingDidLogin"){
        this.setState({loggedIn:true}, 
        function(){
          this.forceUpdate()
        })

        Actions.player()
      }else if(message == "didReceiveError: Wrong username or password"){
        console.log("didReceiveError: Wrong username or password")
        SpotifyAuth.logout()
        this.setState({loggedIn:false}, 
        function(){
          this.forceUpdate()
        })
      }
    })

  }
}