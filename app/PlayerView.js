/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */

// Dependencies
import React, { Component } from 'react'
import update from 'immutability-helper'
import {
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
  LayoutAnimation
} from 'react-native'

import EventEmitter from 'EventEmitter'

import { Actions } from 'react-native-router-flux'
import moment from 'moment'
import RNFetchBlob from 'react-native-fetch-blob'

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
import MusicSelectView from './components/MusicSelectView'

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
// var CustomLayoutLinear = {
//     duration: 200,
//     create: {
//       type: LayoutAnimation.Types.linear,
//       property: LayoutAnimation.Properties.opacity,
//     },
//     update: {
//       type: LayoutAnimation.Types.curveEaseInEaseOut,
//     },
//   }


// Player View
export default class PlayerView extends Component {

  constructor(props) {
    super(props)

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    // Actions
    this._orientationDidChange = this._orientationDidChange.bind(this)
    this._launchSelector = this._launchSelector.bind(this)
    this._choosePlaylist = this._choosePlaylist.bind(this)

    this.eventEmitter = new EventEmitter()

    // State
    this.state = {
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
      currentPlaylist: {
        name: '',
        owner: '',
        total: 0,
        image: '',
        playlist: [],
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

    //console.log(this.state.bpm)
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
          currentPlaylistGif: image
        })
      }
    }
  }

  // Download and store Gifs Locally for easy access
  // NOTE: When this operation is running we disallow UI in some areas.
  // TODO: When UI is interactied with we need to Kill this operation.
  // Can be done: https://github.com/wkh237/react-native-fetch-blob#user-content-cancel-request
  _getData(imagearr){

    // if(typeof(imagearr) !== 'undefined' && imagearr.length){

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
          // console.log('_getData')
          // console.log(err)
        })
      }
    // }
  }

  _cancelGetData(){
    // console.log('_cancelGetData')
    // console.log(imagearr)

    var imagearr = this.state.tasks

    this.setState({
      localImages: []
    })

    if(typeof(imagearr) !== 'undefined' && imagearr.length){

      for(i = 0; i < imagearr.length; i++){
        this.state.tasks[i].cancel((err) => {
          // console.log('_cancelGetData')
          // console.log(err)
        })
      }
    }


  }

  // Get track info from current playlist
  _fetchPlaylistsTracks(bearer, playlistURL){

    fetch(playlistURL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+bearer
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {



      var tracks = responseJson.items
      var tracksURIs = []

      tracks.map( (item) => {
        tracksURIs.push(item.track.uri)
      })


      this.setState({
        tracksURIs: tracksURIs,
        tracks: tracks,
      })

      this._getMusic()
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // Get all the users Playlists
  _fetchPlaylists(bearer){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    fetch('https://api.spotify.com/v1/users/'+this.state.currentUser.id+'/playlists?limit=50', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+bearer
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if(responseJson.error){
        return
      }
      var playlists = responseJson.items
      

      var mydata = []
      for(i = 0; i < playlists.length; i++){
        var imgArr = playlists[i].images
        var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

        if(typeof(imgArr) !== 'undefined' && imgArr.length){
          if(imgArr[0].url){
            playlistImage = imgArr[0].url
          }
        }

        mydata.push({name:playlists[i].name, uri:playlists[i].uri, image:playlistImage, total:playlists[i].tracks.total, owner: playlists[i].owner.id})
      }

      this.setState({
        userPlaylists: playlists,
        dataSource: ds.cloneWithRows(mydata),
      })

      var imgArr = playlists[0].images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(imgArr.length){
        playlistImage = imgArr[0].url
      }else if(typeof(this.state.currentUser.images) !== 'undefined' && this.state.currentUser.images.length){
        playlistImage = this.state.currentUser.images[0].url
      }

      this.setState({
        currentPlaylist: {
          name: playlists[0].name,
          owner: playlists[0].owner.id,
          total: playlists[0].tracks.total,
          image: playlistImage,
          playlist: playlists[0]
        }
      })
      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getUsersPlaylists(){

    SpotifyAuth.getToken((result)=>{

      if(result){

        this._fetchPlaylists(result)

      }else{
        AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
          this._fetchPlaylists(res)
        })
      }
    })
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
      //console.log(responseJson)
      if(responseJson.product == "premium"){
        this.setState({
          currentUser: responseJson,
          userAquired:true
        })
        this._getUsersPlaylists()
      }else{
        Actions.notice()
        //this.props.navigator.replace({component: NeedPrimium})
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

    var currentPlaylist = this.state.currentPlaylist.playlist

    SpotifyAuth.playSpotifyURI(currentPlaylist.uri, 0, 0, (error)=>{
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

  // Search Spotify for Stuff
  // TODO: Not currently being user.
  _searchMusic(terms,context){
    SpotifyAuth.performSearchWithQuery(terms,context,0,'US',(err, result)=>{
      var tracks = []
      var tracksURIs = []
      if(result){

        result.map( (item) => {
          tracks.push(item)
        })

        tracks.sort(() => {
          return .5 - Math.random()
        })

        tracks.map( (item) => {
          tracksURIs.push(item.uri)
        })

        this.setState({
          tracks: tracks
        })
      
        SpotifyAuth.playURIs(tracksURIs, {trackIndex :0, startTime:0},(error)=>{
          this.setState({
            isPlaying: true
          })

          this._stop()
          
          SpotifyAuth.currentTrackURI((result)=>{

        
            var track = tracks.filter((item) => {
              return item.uri == result
            })

            SpotifyAuth.currentTrackDuration((result)=>{
              this.setState({
                currentTrack: {
                  duration: result
                }
              })
            })

            AsyncStorage.getItem('@GmixrStore:token', (err, result) => {
              this._getAudioFeatures(track[0].id, result)
              this._getGifs([track[0].artists[0].name, track[0].name])
            })

            this.setState({
              currentTrack: {
                name: track[0].name,
                artistName: track[0].artists[0].name,
                albumName: track[0].album.name,

              }
            })
              
          })
        })
      }
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

      // this.setState({
      //   currentTrack: {
      //     analysis: responseJson
      //   }
      // })

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

      // this.setState({
      //   currentTrack: {
      //     saved: responseJson[0]
      //   }
      // })
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
        var termArray = JSON.parse(res)
        var termString = ''
        for(i = 0; i < termArray.length; i++){
          var space = ''
          if(i > 0){
            space = ', '
          }
          termString += space + termArray[i]

        }
        this.setState({loadingGifs: true, textTerms: termString})
        term = encodeURIComponent(termString)
        var gifUrls = []

      }else{

        var termString = ''
        for(i = 0; i < terms.length; i++){
          var space = ''
          if(i > 0){
            space = ', '
          }
          termString += space + terms[i]
        }

        this.setState({loadingGifs: true, textTerms: termString})
        term = encodeURIComponent(termString)
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
    AsyncStorage.setItem('@GmixrStore:'+trackID, JSON.stringify(terms))
  }

  _newGifRequest(terms){

    gifTerms = terms.split(',');
    //console.log(gifTerms)

    this._cancelGetData()
    this._clearGifs()
    //console.log(terms)
    this._setAsyncTrackTerms(this.state.currentTrack.trackID, gifTerms)
    this._getGifs(gifTerms)
  }

  // A selected Playlist From the Playlist ListView
  // TODO: need to add more functionality to choosing music from Spotify
  _choosePlaylist(playlist){

    this._cancelGetData()

    // if(!this.state.loadingGifs){

    var playlists = this.state.userPlaylists

    var playlist = playlists.filter((item) => {
      return item.uri == playlist.uri
    })



    var imgArr = playlist[0].images
    var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

    if(imgArr.length){
      playlistImage = imgArr[0].url
    }else if(typeof(this.state.currentUser.images) !== 'undefined' && this.state.currentUser.images.length){
      playlistImage = this.state.currentUser.images[0].url
    }

    this.setState({
      showListView: false,
      currentPlaylist: {
        name: playlist[0].name,
        owner: playlist[0].owner.id,
        total: playlist[0].tracks.total,
        image: playlistImage,
        playlist: playlist[0]
      }
    }, function() {
      this._clearTimers()

      this._getMusic()
    })
      
    //}
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

  _launchSelector(){
    LayoutAnimation.easeInEaseOut()
    this.setState({
      showListView: (this.state.showListView) ? false : true
    })
  }

  _setState(state){
    this.setState(state)
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

    var vidHeight = (this.state.layoutProps.orientation == 'landscape') ? this.state.layoutProps.height : this.state.layoutProps.width*3/4
    var bottomBarbottom = (this.state.layoutProps.orientation == 'landscape') ? -48 : 0

    var repeatColor = (this.state.isRepeating) ? '#84bd00' : '#FFF'
    var shuffleColor = (this.state.isShuffling) ? '#84bd00' : '#FFF'

    var listTextWidth = this.state.layoutProps.width - (56 + 8)

    var playlistInfo = ''
    if(this.state.currentPlaylist.owner != ''){
      playlistInfo = 'by ' + this.state.currentPlaylist.owner + ' · ' + this.state.currentPlaylist.total + ' songs'
    }

    var textTerms = ''
    for(i = 0; i < this.state.currentGiphyTerms.length; i++){
      textTerms += this.state.currentGiphyTerms[i] + ' '
    }

    //console.log(this.state.currentTrack)


    return (
      <View style={styles.container}>
        <View style={styles.flex}>
          <MediaView 
            layoutProps={this.state.layoutProps}
            source={(this.state.isPlaying && this.state.currentPlaylistGif != '') ? { uri: this.state.currentPlaylistGif } : defaultImage}
            loaderWidth={loaderWidth}
            loaderOpacity={loaderOpacity} />
          <View style={[styles.controlWrap, {width: this.state.layoutProps.width, position: (this.state.layoutProps.orientation == 'landscape') ? 'absolute' : 'relative', opacity: (this.state.layoutProps.orientation == 'landscape') ? 0 : 1}]}>
            <BlurImage 
              style={styles.backgroundImage}
              source={{uri: backgroundImage}}
              blurRadius={30}
            />
            <View style={styles.actionView}>
              {(this.state.showListView) ? (
                <MusicSelectView
                  ref="musicSelectView"
                  userAquired={this.state.userAquired}
                  currentUser={this.state.currentUser}
                  layoutProps={this.state.layoutProps}
                  choosePlaylist={(playlist) => this._choosePlaylist(playlist)} />
              ) : (
                <ControlView
                  ref="controlView"
                  styles={[styles.controlView, {top: (this.state.showListView) ? height - vidHeight - 64 : 0, height: height - vidHeight - 64}]}
                  textTerms={this.state.textTerms}
                  currentTrack={this.state.currentTrack}
                  previousTrack={this.state.previousTrack}
                  nextTrack={this.state.nextTrack}
                  isShuffling={this.state.isShuffling}
                  isPlaying={this.state.isPlaying}
                  isRepeating={this.state.isRepeating}
                  _startTimers={this._startTimers.bind(this)}
                  _clearTimers={this._clearTimers.bind(this)}
                  _setState={(state) => this._setState(state)}
                  _newGifRequest={(event) => this._newGifRequest(event)}
                  _cancelGetData={this._cancelGetData.bind(this)}
                  events={this.eventEmitter} />
              )}
             </View>
          </View>
        </View>
        <View style={[styles.bottomBar, {bottom: bottomBarbottom, opacity: (this.state.layoutProps.orientation == 'landscape') ? 0 : 1}]}>
          <TouchableHighlight style={styles.row} onPress={this._launchSelector} activeOpacity={1} underlayColor="transparent">
            <View style={styles.flexRow}>
              <Image style={styles.playlistThumbnail} source={{ uri: this.state.currentPlaylist.image}} />
              <View>
                <Text style={[styles.listTitleText, {width: listTextWidth }]} numberOfLines={1}>
                  {this.state.currentPlaylist.name}
                </Text>
                <Text style={[styles.listDescText, {width: listTextWidth }]} numberOfLines={1}>
                  {playlistInfo}
                </Text>
              </View>
              <IOIcon name="ios-search-outline" backgroundColor="transparent" color="white" size={20} />
            </View>
          </TouchableHighlight>
        </View>
      </View>
      
      )

  }

  componentWillUpdate() {
    //LayoutAnimation.easeInEaseOut()
    LayoutAnimation.configureNext(CustomLayoutSpring)
    //LayoutAnimation.configureNext(CustomLayoutLinear)

  }

  componentWillMount() {
    // Animate creation

    LayoutAnimation.easeInEaseOut()
  }


  componentDidMount() {
    this._getUser()

    // console.log('componentDidMount')
    // console.log(this.props)


    // Add Listeners from IOS
    Orientation.addOrientationListener(this._orientationDidChange)

    myModuleEvt.addListener('EventReminder', (data) => {

      var message = data.object[0]
      console.log(data)
      if(message.includes("didStartPlayingTrack")){

        this._cancelGetData()
        
        var trackURI = message.replace("didStartPlayingTrack: ", "")
        this._setTrack(trackURI)
        this._play()


        // Not sure if I can pass the Native Emiiter?
        this.eventEmitter.emit('notPlaying')
        this.eventEmitter.emit('playing')

      }else if(message.includes("didStopPlayingTrack")){
        this.eventEmitter.emit('notPlaying')
        this._stop()

      }else if(message.includes("didChangeMetadata")){
        
        var trackURI = message.replace("didChangeMetadata: ", "")

      }else if(data.object == "didChangePlaybackStatus"){

      }
    })
  }

  componentWillReceiveProps(nextProps) {
    // console.log('componentWillReceiveProps')
    // console.log(nextProps)
  }

  componentWillUnmount() {

    // Cleanup and Timers and Listeners
    this._clearTimers()

    myModuleEvt.removeAllListeners('EventReminder')

    Orientation.getOrientation((err,orientation)=> { })
    Orientation.removeOrientationListener(this._orientationDidChange)
    
  }
}



