// Dependencies
import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux';
import {
  AsyncStorage,
  Image,
  NativeModules,
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

    SpotifyAuth.checkSession((error)=>{
      if(!error){

        SpotifyAuth.getToken((token)=>{
          this._setAsyncToken(token)
        })

        Actions.player()
        //this.props.navigator.replace({component: PlayerView})

      } else {
        this._setAsyncToken(error)
        
        Actions.player()
        //this.props.navigator.replace({component: PlayerView})
      }
    })
  }

  _setAsyncToken(token){
    AsyncStorage.setItem('@GmixrStore:token', token)
  }

  render() {

    return (
      <View style={styles.container}>
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
  componentDidMount() {

    // Clear Storage
    // AsyncStorage.removeItem('@GmixrStore:token')
    // AsyncStorage.removeItem('@GmixrStore:timestamp')

    // Get Token or Renew

    SpotifyAuth.loggedIn((result)=>{
      if(result){
        SpotifyAuth.getToken((token)=>{
          this._setAsyncToken(token)
          Actions.player()
          //this.props.navigator.replace({component: PlayerView})
        })
      }else{
        
          SpotifyAuth.renewToken((token)=>{
            console.log(token)
            if(!token){
              this.setState({loggedIn:false}, 
              function(){
                this.forceUpdate()
              })
            }else{
              this.setState({loggedIn:true}, 
              function(){
                this.forceUpdate()
              })
              this._setAsyncToken(token)
              Actions.player()
              //this.props.navigator.replace({component: PlayerView})
            }

          })
        
        // AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
        //   if(!res){
        //     this.setState({loggedIn:false}, 
        //     function(){
        //         this.forceUpdate()
        //     })
        //   }else{
        //     this.setState({loggedIn:true}, 
        //     function(){
        //       this.forceUpdate()
        //     })
        //   }
        // })
      }
    })
  }
}