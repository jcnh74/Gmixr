/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */

// Dependencies
import React, { Component } from 'react'
import update from 'immutability-helper'
import {
  StatusBar,
  AsyncStorage,
  Image,
  NativeModules,
  NativeEventEmitter,
  Text,
  TextInput,
  Keyboard,
  TouchableHighlight,
  View,
  ListView,
  Dimensions,
  LayoutAnimation,
  Linking
} from 'react-native'

import EventEmitter from 'EventEmitter'

import { Actions } from 'react-native-router-flux'
import moment from 'moment'
import RNFetchBlob from 'react-native-fetch-blob'

import FAIcon from 'react-native-vector-icons/FontAwesome'
import SLIcon from 'react-native-vector-icons/SimpleLineIcons'
import IOIcon from 'react-native-vector-icons/Ionicons'

import Orientation from 'react-native-orientation'
import BlurImage from 'react-native-blur-image'
import BackgroundTimer from 'react-native-background-timer'

import ImagePicker from 'react-native-image-crop-picker'

// Styles
var styles = require('./style')

// Components
import PlaylistRow from './components/PlaylistRow'
import MediaView from './components/MediaView'
import ControlView from './components/ControlView'
import PlaylistSelectView from './components/PlaylistSelectView'
import SongSelectView from './components/SongSelectView'
import SearchSelectView from './components/SearchSelectView'
import AlbumSelectView from './components/AlbumSelectView'
import ArtistSelectView from './components/ArtistSelectView'
import SettingsView from './components/SettingsView'

// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth
const myModuleEvt = new NativeEventEmitter(NativeModules.EventManager)

// Settings
const {height, width} = Dimensions.get('window')
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

var CustomLayoutSpring = {
    duration: 300,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 0.8,
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.8,
    },
  }


// Player View
export default class PlayerView extends Component {

  constructor(props) {
    super(props)

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    // Actions
    this._orientationDidChange = this._orientationDidChange.bind(this)
    this._launchSelector = this._launchSelector.bind(this)
    this._handleOpenURL = this._handleOpenURL.bind(this)

    this.eventEmitter = new EventEmitter()

    // State
    this.state = {
      isLoggedIn: false,
      layoutProps: {
        orientation: 'portrait',
        width: width,
        height: height
      },
      currentUser: [],
      userAquired: false,
      userPlaylists: [],
      tracks: [],
      tracksURIs: [],
      isPlaying: false,
      isShuffling: false,
      isRepeating: false,
      bpm: 1020,
      tempo: 120,
      currentTrack: {
        name:'',
        artistName: '',
        albumName: '',
        uri: '',
        art: '',
        trackID: '',
        analisys: '',
        features: '',
        saved: '',
        duration: 0
      },
      previousTrack: {
        uri: '',
      },
      nextTrack: {
        uri: '',
      },
      currentPlayItem: {
        name: '',
        owner: '',
        total: 0,
        image: '',
        playitem: [],
        gifsURLS: [],
        gifsLocal: [],
        gif: '/Users/johnhanusek/Development/Gmixr/GmixrReact/assets/gmixr-logo2.gif',
      },
      currentGiphyTerms: [],
      textTerms: '',
      loadingGifs: false,
      remoteImages: [],
      localImages: [],
      currenttrackAnalisys: [],
      currenttrackFeatures: [],
      currenttrackSaved: false,
      amountLoaded: 0,
      showListView: true,
      currentListView: 'playlists',
      savedListView: 'playlists',
      dataSource: ds.cloneWithRows([]),
      tasks: []
    }
  }




  // Hard Stop
  _stop(){

    this._clearTimers()

    this.setState({
      localImages: ['/Users/johnhanusek/Development/Gmixr/GmixrReact/assets/gmixr-logo2.gif'],
      isPlaying: false
    })

    SpotifyAuth.setIsPlaying(false, (error)=>{
        this._clearTimers()
    })
  }

  // Hard Play
  _play(){


    this._clearTimers()

    this.setState({
      isPlaying: true,
      loadingGifs: false
    })
    SpotifyAuth.setIsPlaying(true, (error)=>{
      this._startTimers()
    })
  }


  _clearTimers(){
    if(this.intervalId){
      BackgroundTimer.clearInterval(this.intervalId)

    }
  }

  _startTimers(){

    this._clearTimers()

    if(this.state.bpm){

      this.intervalId = BackgroundTimer.setInterval(() => {
        this._updateGif(this.state.localImages)
      }, this.state.bpm)
    }
  }


  // Swap Visable Image on tempo update
  _updateGif(gifsLocal){

    if(typeof(gifsLocal) !== 'undefined' && gifsLocal.length){
      if(gifsLocal.length){
        var image = gifsLocal[Math.floor(Math.random() * gifsLocal.length)]
        this.setState({
          currentPlayItemGif: image
        })
      }
    }
  }

  // Download and store Gifs Locally for easy access
  // NOTE: When this operation is running we disallow UI in some areas.
  // TODO: When UI is interactied with we need to Kill this operation.
  // Can be done: https://github.com/wkh237/react-native-fetch-blob#user-content-cancel-request
  _getData(imagearr){

    this.setState({
      localImages: []
    })
    var j = 1

    var local = []
    for(i = 0; i < imagearr.length; i++){

      this.state.tasks[i] = RNFetchBlob.config({
        fileCache : true,
        appendExt : 'gif'
      }).fetch('GET', imagearr[i])

      this.state.tasks[i].then((result) => {

        var percent = Math.round((j/imagearr.length)*100)


        this.setState({
          localImages: this.state.localImages.concat(result.path()),
          amountLoaded: percent
        })

        if(j == imagearr.length){

          this._play()

        }
        j++
      }).catch((err) => {
         console.log(err)
      })
    }
  }

  _cancelGetData(){

    var imagearr = this.state.tasks

    this.setState({
      localImages: []
    })

    if(typeof(imagearr) !== 'undefined' && imagearr.length){

      for(i = 0; i < imagearr.length; i++){
        this.state.tasks[i].cancel((err) => {
          console.log(err)
        })
      }
    }
  }




  // User is logged in, lets get some info.
  _fetchUser(bearer){
    //console.log('_fetchUser')
    //console.log(bearer)
    fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+bearer
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {

      console.log(responseJson)
      
      if(responseJson.product == "open"){
        
        let keys = ['@GmixrStore:token', '@GmixrStore:firstVisit'];
        AsyncStorage.multiRemove(keys, (err) => {
          SpotifyAuth.logout()
          // Actions.login()
        })

      }else if(responseJson.product == "premium"){
        this.setState({
          currentUser: responseJson,
          userAquired:true
        })
        this.eventEmitter.emit('userAquired')
      }

    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, fetch User info
  // TODO: May be able to bypass this function
  _getUser() {
    
    SpotifyAuth.getToken((result)=>{
      
      if(result){

        this._fetchUser(result)

      }else{
        AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
          this._fetchUser(res)
        })
      }
    })
  }

  // Start the timer, set the playlist and update some states
  _getMusic() {

    var currentPlayItem = this.state.currentPlayItem.playitem

    SpotifyAuth.playSpotifyURI(currentPlayItem.uri, 0, 0, (error)=>{
      if(error){
        console.log(error)
      }
      SpotifyAuth.isRepeating((response)=>{
        this.setState({
          isRepeating: response
        })
      })
      SpotifyAuth.isShuffling((response)=>{
        this.setState({
          isShuffling: response
        })
      })
      this.setState({
        isPlaying: true
      })
      
    })
  }


  // Update state of current track, clear Gifs and request new ones.
  _setTrack(currentURI){
    
    this._clearGifs()

    var tracks = this.state.tracks

    var currentTrackID = currentURI.replace("spotify:track:", "")

    AsyncStorage.getItem('@GmixrStore:token', (err, result) => {

      SpotifyAuth.nextTrackURI((response)=>{
        if(response){
          var nextTrackID = response.replace("spotify:track:", "")
          fetch('https://api.spotify.com/v1/tracks/'+nextTrackID, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer '+result
            }
          })
          .then((response) => response.json())
          .then((responseJson) => {
            var newState = update(this.state, {
              nextTrack: {$set : responseJson}
            });
            this.setState(newState);
          })
        }
      })
      SpotifyAuth.previousTrackURI((response)=>{
        if(response){
          var previousTrackID = response.replace("spotify:track:", "")
          fetch('https://api.spotify.com/v1/tracks/'+previousTrackID, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer '+result
            }
          })
          .then((response) => response.json())
          .then((responseJson) => {
            var newState = update(this.state, {
              previousTrack: {$set : responseJson}
            });
            this.setState(newState);
          })
        }
      })


      fetch('https://api.spotify.com/v1/tracks/'+currentTrackID, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer '+result
        }
      })
      .then((response) => response.json())
      .then((responseJson) => {

        //console.log(responseJson)
        
        this.setState({
          currentTrack: {
            name: responseJson.name,
            artistName: responseJson.artists[0].name,
            albumName: responseJson.album.name,
            art: responseJson.album.images[0].url,
            uri: responseJson.uri,
            trackID: responseJson.id,
            duration: responseJson.duration_ms
          }
        })

        var currentTerms = []
        currentTerms[0] = responseJson.artists[0].name
        currentTerms[1] = responseJson.name

        this._getAudioFeatures(responseJson.id, result)

        this._getGifs([responseJson.artists[0].name, responseJson.name])
        
      })
      .catch((err) => {
        console.error(err)
      })

    })
  }

  // Get from Spotify audio features of Track
  _getAudioFeatures(trackID, token) {

    fetch('https://api.spotify.com/v1/audio-features?ids='+trackID, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+token
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {

      if(responseJson){

        var currenttrackFeatures = responseJson.audio_features[0]
        var tempo = 120

        if(currenttrackFeatures.tempo){
          tempo = currenttrackFeatures.tempo
        }

        var ms_per_beat = +(((1000 * 60 / tempo)*2).toFixed(2))

        this.setState({
          currenttrackFeatures: currenttrackFeatures,
          bpm: ms_per_beat,
          tempo: tempo
        })
        //console.log(this.state.bpm)
        this._getTrackAnalisys(trackID, token)
      }


    })
    .catch((error) => {
      console.error(error)
    })
  }

  // Get from Spotify Track Analysis: Beats, Measures, Etc
  _getTrackAnalisys(trackID, token) {

    fetch('https://api.spotify.com/v1/audio-analysis/'+trackID, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+token
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {

      var newState = update(this.state, {
        currentTrack: {
          analysis: { $set : responseJson }
        }
      });
      this.setState(newState);

      this._getSavedTrack(trackID, token)
    })
    .catch((err) => {
      console.error(err)
    })
  }

  _getSavedTrack(trackID, token){

    //https://api.spotify.com/v1/me/tracks/contains?ids=
    fetch('https://api.spotify.com/v1/me/tracks/contains?ids='+trackID, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+token
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {

      var newState = update(this.state, {
        currentTrack: {
          saved: { $set : responseJson[0] }
        }
      });
      this.setState(newState);

    })
    .catch((err) => {
      console.error(err)
    })
  }


  // Future Release
  _getLocalImages(){

    ImagePicker.openPicker({
      multiple: true,
      maxFiles: 50,
      mediaType: 'photo',
    }).then(images => {


      var newArr = []
      for(i = 0; i < images.length; i++){

        // console.log(images[i].path);
        // newArr.push(images[i].path)

      }

      this.setState({
        localImages: newArr
      })

      this._play()

    });
  }


  // Get from Giphy some dank Gifs
  _getGifs(terms){

    this.setState({
      currentGiphyTerms: terms
    })


    AsyncStorage.getItem('@GmixrStore:'+this.state.currentTrack.trackID, (err, res) => {
      if(res){
        // var termArray = res
        // var termString = ''
        // for(i = 0; i < termArray.length; i++){
        //   var space = ''
        //   if(i > 0){
        //     space = ', '
        //   }
        //   termString += space + termArray[i]

        // }
        this.setState({loadingGifs: true, textTerms: res})
        term = encodeURIComponent(res)
        var gifUrls = []

      }else{

        // var termString = ''
        // for(i = 0; i < terms.length; i++){
        //   var space = ''
        //   if(i > 0){
        //     space = ', '
        //   }
        //   termString += space + terms[i]
        // }

        this.setState({loadingGifs: true, textTerms: terms})
        term = encodeURIComponent(terms)
        var gifUrls = []

      }

      var randomnumber = (Math.floor(Math.random() * 3)*40);

      fetch('https://api.giphy.com/v1/gifs/search?q='+term+'&limit=40&offset='+randomnumber+'&api_key=dc6zaTOxFJmzC', {
        method: 'GET',
      })
      .then((response) => response.json())
      .then((responseJson) => {

        for(j = 0; j < responseJson.data.length; j++){
          gifUrls.push(responseJson.data[j].images.downsized_medium.url)
        }

        this.setState({
          remoteImages: gifUrls
        },
        function(){
          this.forceUpdate();
        })

        this._getData(gifUrls)
        
      })
      .catch((err) => {
        console.error(err)
      })
    })
  
  }

  // Remove any Gifs from the current state
  _clearGifs(){
    this.setState({
      remoteImages: [],
      localImages: []
    })
  }

  _setAsyncTrackTerms(trackID, terms){
    AsyncStorage.setItem('@GmixrStore:'+trackID, terms)
  }

  _newGifRequest(terms){

    

    this._cancelGetData()
    this._clearGifs()
    this._setAsyncTrackTerms(this.state.currentTrack.trackID, terms)
    this._getGifs(terms)
  }

  _choosePlaylist(playlist){

    this._cancelGetData()

    this.setState({
      showListView: false,
      currentListView: 'remove',
      currentPlayItem: {
        name: playlist.name,
        owner: playlist.owner,
        total: playlist.total,
        image: playlist.image,
        playitem: playlist,
      }
    }, function() {
      this._clearTimers()

      this._getMusic()
    })
  }

  _chooseTrack(track){

   this._cancelGetData()

    this.setState({
      showListView: false,
      currentListView: 'remove',
      currentPlayItem: {
        name: track.name,
        owner: track.artist,
        total: 1,
        image: '',
        playitem: track,
      }
    }, function() {
      this._clearTimers()

      this._getMusic()
    })
  }

  _chooseArtist(artist){

    this._cancelGetData()

    this.setState({
      showListView: false,
      currentListView: 'remove',
      currentPlayItem: {
        name: artist.name,
        owner: '',
        total: 1,
        image: artist.image,
        playitem: artist,
      }
    }, function() {
      this._clearTimers()

      this._getMusic()
    })
  }

  _chooseAlbum(album){

    this._cancelGetData()

    this.setState({
      showListView: false,
      currentListView: 'remove',
      currentPlayItem: {
        name: album.name,
        owner: album.artist,
        total: 1,
        image: album.image,
        playitem: album,
      }
    }, function() {
      this._clearTimers()

      this._getMusic()
    })
  }

    // If from IOS orientation was updated
  _orientationDidChange(orientation) {
    if (orientation == 'LANDSCAPE') {

      const {height, width} = Dimensions.get('window')

      const newLayout = {
        orientation: 'landscape',
        height: height,
        width: width
      }
      this.setState({ layoutProps: newLayout })

    } else {
      
      //do something with portrait layout
      const {height, width} = Dimensions.get('window')

      const newLayout = {
        orientation: 'portrait',
        height: height,
        width: width
      }
      this.setState({ layoutProps: newLayout })
    }
  }

  _launchSelector(type){
    LayoutAnimation.easeInEaseOut()
    this.setState({
      currentListView: type,
      savedListView: type,
      showListView: true
    })
  }

  _setState(state){
    this.setState(state)
  }

  _setView(bool){
    this.setState({
      showListView: bool,
      currentListView: (bool) ? this.state.savedListView : 'remove'
    })
  }

  render() {
    
    var avatar = 'https://facebook.github.io/react/img/logo_og.png'
    if(typeof(this.state.currentUser.images) !== 'undefined' && this.state.currentUser.images.length){
      avatar = this.state.currentUser.images[0].url
    }

    var backgroundImage = avatar
    if(this.state.currentTrack.art){
      backgroundImage = this.state.currentTrack.art
    }

    var loaderWidth = (this.state.amountLoaded/100)*this.state.layoutProps.width
    loaderOpacity = 1
    if(this.state.amountLoaded >= 100){
      loaderOpacity = 0
    }

    var vidHeight = (this.state.layoutProps.orientation == 'landscape') ? this.state.layoutProps.height : this.state.layoutProps.width*(this.state.layoutProps.width/this.state.layoutProps.height)
    var bottomBarbottom = (this.state.layoutProps.orientation == 'landscape') ? -48 : 0

    var repeatColor = (this.state.isRepeating) ? '#84bd00' : '#FFF'
    var shuffleColor = (this.state.isShuffling) ? '#84bd00' : '#FFF'

    var listTextWidth = this.state.layoutProps.width - (56 + 8)

    var playlistInfo = ''
    if(this.state.currentPlayItem.owner != ''){
      playlistInfo = 'by ' + this.state.currentPlayItem.owner + ' · ' + this.state.currentPlayItem.total + ' songs'
    }

    var textTerms = ''
    for(i = 0; i < this.state.currentGiphyTerms.length; i++){
      textTerms += this.state.currentGiphyTerms[i] + ' '
    }

    return (
      <View style={styles.container}>
      <StatusBar hidden={true} />
        <View style={styles.flex}>
          <MediaView 
            layoutProps={this.state.layoutProps}
            source={(this.state.isPlaying && this.state.currentPlayItemGif != '') ? { uri: this.state.currentPlayItemGif } : defaultImage}
            loaderWidth={loaderWidth}
            loaderOpacity={loaderOpacity}
            vidHeight={vidHeight} />
          <View style={[styles.controlWrap, {width: this.state.layoutProps.width, position: (this.state.layoutProps.orientation == 'landscape') ? 'absolute' : 'relative', opacity: (this.state.layoutProps.orientation == 'landscape') ? 0 : 1}]}>
            <BlurImage 
              style={styles.backgroundImage}
              source={{uri: backgroundImage}}
              blurRadius={30}
            />
            <View style={styles.actionView}>
              {(() => {
                switch (this.state.currentListView) {
                  case 'playlists':
                    return (
                      <PlaylistSelectView
                        ref="playlistSelectView"
                        userAquired={this.state.userAquired}
                        currentUser={this.state.currentUser}
                        layoutProps={this.state.layoutProps}
                        choosePlaylist={(playlist) => this._choosePlaylist(playlist)}
                        events={this.eventEmitter}
                        vidHeight={vidHeight} />
                    )
                  case 'songs':
                    return (
                      <SongSelectView
                        ref="songSelectView"
                        userAquired={this.state.userAquired}
                        currentUser={this.state.currentUser}
                        layoutProps={this.state.layoutProps}
                        chooseTrack={(track) => this._chooseTrack(track)}
                        events={this.eventEmitter}
                        vidHeight={vidHeight} />
                    )
                  case 'search':
                    return (
                      <SearchSelectView
                        ref="searchelectView"
                        userAquired={this.state.userAquired}
                        currentUser={this.state.currentUser}
                        layoutProps={this.state.layoutProps}
                        chooseTrack={(track) => this._chooseTrack(track)}
                        chooseArtist={(artist) => this._chooseArtist(artist)}
                        chooseAlbum={(album) => this._chooseAlbum(album)}
                        choosePlaylist={(playlist) => this._choosePlaylist(playlist)}
                        events={this.eventEmitter}
                        vidHeight={vidHeight} />
                    )
                  case 'albums':
                    return (
                      <AlbumSelectView
                        ref="albumSelectView"
                        userAquired={this.state.userAquired}
                        currentUser={this.state.currentUser}
                        layoutProps={this.state.layoutProps}
                        chooseAlbum={(album) => this._chooseAlbum(album)}
                        events={this.eventEmitter}
                        vidHeight={vidHeight} />
                    )
                  case 'artists':
                    return (
                      <ArtistSelectView
                        ref="artistSelectView"
                        userAquired={this.state.userAquired}
                        currentUser={this.state.currentUser}
                        layoutProps={this.state.layoutProps}
                        chooseArtist={(artist) => this._chooseArtist(artist)}
                        events={this.eventEmitter}
                        vidHeight={vidHeight} />
                    )
                  case 'settings':
                    return (
                      <SettingsView
                        ref="settingsView"
                        currentUser={this.state.currentUser}
                        avatar={avatar}
                        layoutProps={this.state.layoutProps}
                        events={this.eventEmitter}
                        vidHeight={vidHeight}
                        />
                    )
                  case 'remove':
                    null
                  default :
                    null
                }
              })()}
              <ControlView
                ref="controlView"
                styles={[styles.controlView, {top: (this.state.showListView) ? height - vidHeight - 94 : 0, height: (this.state.showListView) ? 44 : height - vidHeight - 50}]}
                mini={this.state.showListView}
                textTerms={this.state.textTerms}
                currentTrack={this.state.currentTrack}
                previousTrack={this.state.previousTrack}
                nextTrack={this.state.nextTrack}
                isShuffling={this.state.isShuffling}
                isPlaying={this.state.isPlaying}
                isRepeating={this.state.isRepeating}
                _startTimers={this._startTimers.bind(this)}
                _clearTimers={this._clearTimers.bind(this)}
                _setView={(bool) => this._setView(bool)}
                _setState={(state) => this._setState(state)}
                _newGifRequest={(event) => this._newGifRequest(event)}
                _cancelGetData={this._cancelGetData.bind(this)}
                _launchSelector={(selection) => this._launchSelector(selection)}
                avatar={avatar}
                currentUser={this.state.currentUser}
                events={this.eventEmitter}
                vidHeight={vidHeight} />
             </View>
          </View>
        </View>
        <View style={[styles.bottomBar, {bottom: bottomBarbottom, opacity: (this.state.layoutProps.orientation == 'landscape') ? 0 : 1}]}>
          <TouchableHighlight style={[styles.tabItem, {opacity: (this.state.currentListView == 'playlists') ? 1 : 0.5}]} onPress={() => this._launchSelector('playlists')} activeOpacity={1} underlayColor="transparent">
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <IOIcon name="ios-musical-notes-outline" backgroundColor="transparent" color="white" size={24} />
              <Text style={styles.tabText} numberOfLines={1}>
                Playlists
              </Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={[styles.tabItem, {opacity: (this.state.currentListView == 'songs') ? 1 : 0.5}]} onPress={() => this._launchSelector('songs')} activeOpacity={1} underlayColor="transparent">
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <IOIcon name="ios-musical-note-outline" backgroundColor="transparent" color="white" size={24} />
              <Text style={styles.tabText} numberOfLines={1}>
                Songs
              </Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={[styles.tabItem, {opacity: (this.state.currentListView == 'search') ? 1 : 0.5}]} onPress={() => this._launchSelector('search')} activeOpacity={1} underlayColor="transparent">
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <IOIcon name="ios-search-outline" backgroundColor="transparent" color="white" size={24} />
              <Text style={styles.tabText} numberOfLines={1}>
                Search
              </Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={[styles.tabItem, {opacity: (this.state.currentListView == 'albums') ? 1 : 0.5}]} onPress={() => this._launchSelector('albums')} activeOpacity={1} underlayColor="transparent">
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <IOIcon name="ios-disc-outline" backgroundColor="transparent" color="white" size={24} />
              <Text style={styles.tabText} numberOfLines={1}>
                Albums
              </Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={[styles.tabItem, {opacity: (this.state.currentListView == 'artists') ? 1 : 0.5}]} onPress={() => this._launchSelector('artists')} activeOpacity={1} underlayColor="transparent">
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <IOIcon name="ios-person-outline" backgroundColor="transparent" color="white" size={24} />
              <Text style={styles.tabText} numberOfLines={1}>
                Artists
              </Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    )
  }

  componentWillUpdate() {

    //LayoutAnimation.easeInEaseOut()
    LayoutAnimation.configureNext(CustomLayoutSpring)

  }

  componentWillMount() {

    // Animate creation
    LayoutAnimation.easeInEaseOut()
  }

  componentDidMount() {
    this._getUser()

    Linking.addEventListener('url', this._handleOpenURL);


    var url = Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial url is: ' + url);
        var event = {url: url}
        this.eventEmitter.addListener('loggedIn', () => this._handleOpenURL(event), this)
      }
    }).catch(err => console.error('An error occurred', err));


    // Add Listeners from IOS
    Orientation.addOrientationListener(this._orientationDidChange)

    myModuleEvt.addListener('EventReminder', (data) => {

      var message = data.object[0]
      console.log(data.object)
      if(message.includes("didStartPlayingTrack")){

        this._cancelGetData()
        
        var trackURI = message.replace("didStartPlayingTrack: ", "")
        this._setTrack(trackURI, false)
        this._play()


        // Not sure if I can pass the Native Emiiter?
        this.eventEmitter.emit('notPlaying')
        this.eventEmitter.emit('playing')

      }else if(message.includes("didStopPlayingTrack")){
        this.eventEmitter.emit('notPlaying')
        this._stop()

      }else if(message.includes("didChangeMetadata")){
        
        var trackURI = message.replace("didChangeMetadata: ", "")

      }else if(message == "didReceiveError: Spotify Premium Required"){


      }else if(data.object == "didChangePlaybackStatus"){

      }else if(data.object == "audioStreamingDidLogin"){

        this.setState({isLoggedIn:true})
        this.eventEmitter.emit('loggedIn')
      }
    })
  }

  componentWillUnmount() {

    // Cleanup and Timers and Listeners
    this._clearTimers()

    myModuleEvt.removeAllListeners('EventReminder')

    Orientation.getOrientation((err,orientation)=> { })
    Orientation.removeOrientationListener(this._orientationDidChange)

    Linking.removeEventListener('url', this._handleOpenURL);
    
  }
  
  _handleOpenURL(event) {
    var url = event.url
    url = url.replace('gmixr://gmixr.com/?uri=','')
    url = url.split('&terms=')

    var itemURI = url[0]
    var currentTrackID = itemURI.replace("spotify:track:", "")


    
    var terms = decodeURIComponent(url[1])

    console.log(terms)

    this.setState({
      showListView: false,
      currentListView: 'remove'
    })

    this._setAsyncTrackTerms(currentTrackID, terms)

    this._newGifRequest(terms)

    if(this.state.isLoggedIn == true){
      SpotifyAuth.playSpotifyURI(itemURI, 0, 0, (error)=>{
        if(error){
          console.log(error)
        }
        SpotifyAuth.isRepeating((response)=>{
          this.setState({
            isRepeating: response
          })
        })
        SpotifyAuth.isShuffling((response)=>{
          this.setState({
            isShuffling: response
          })
        })
        this.setState({
          isPlaying: true,
          textTerms: terms
        })
        
      })
    }



    //gmixr://gmixr.com/?uri=spotify:track:3SfPxUOoqIyXZrZou9R1WG&terms=80s%20movies
    console.log(event.url);
  }
}



