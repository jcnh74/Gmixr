/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */

// Dependencies
import React, { Component } from 'react'
import {
  AppRegistry,
  AsyncStorage,
  StatusBar,
  Image,
  StyleSheet,
  NativeModules,
  NativeEventEmitter,
  NavigatorIOS,
  Text,
  TextInput,
  Keyboard,
  TouchableHighlight,
  View,
  ListView,
  Dimensions,
  LayoutAnimation
} from 'react-native'
import moment from 'moment'
import RNFetchBlob from 'react-native-fetch-blob'
import Marquee from '@remobile/react-native-marquee'
import MarqueeLabel from '@remobile/react-native-marquee-label'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import SLIcon from 'react-native-vector-icons/SimpleLineIcons'
import IOIcon from 'react-native-vector-icons/Ionicons'
import Orientation from 'react-native-orientation'
import BlurImage from 'react-native-blur-image'
import BackgroundTimer from 'react-native-background-timer'

// NAtive Modules
const SpotifyAuth = NativeModules.SpotifyAuth
const myModuleEvt = new NativeEventEmitter(NativeModules.EventManager)

// Settings
const {height, width} = Dimensions.get('window')
const black = 'black'
const darkgray = 'rgb(20,20,20)'
const midgray = 'rgb(60,60,60)'
const blue = 'rgb(0,113,188)'
const green = '#84bd00'

const defaultImages = [
  require('./assets/gmixr-logo.gif'), 
  require('./assets/gmixr-logo2.gif'), 
  require('./assets/gmixr-logo3.gif'),
  require('./assets/gmixr-logo4.gif'),
]
defaultImages.sort(() => {
  return .5 - Math.random()
})
var defaultImage = defaultImages[0]


// Default View on Launch
class logIn extends Component {
  constructor(props) {
    super(props)

    this._loginToSpotify = this._loginToSpotify.bind(this)

    this.state = {
      loggedIn: true
    }
  }

  _loginToSpotify(){

    SpotifyAuth.checkSession((error)=>{
      if(!error){

        SpotifyAuth.getToken((token)=>{
          this._setAsyncToken(token)
        })
        this.props.navigator.replace({component: PlayerView})
      } else {
        this._setAsyncToken(error)
        this.props.navigator.replace({component: PlayerView})
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
          this.props.navigator.replace({component: PlayerView})
        })
      }else{
        SpotifyAuth.renewToken((token)=>{
          if(!token){
            this.setState({loggedIn:false}, 
            function(){
              this.forceUpdate()
            })
          }else{
            console.log('token true')
            this.setState({loggedIn:true}, 
            function(){
              this.forceUpdate()
            })
            this._setAsyncToken(token)
            this.props.navigator.replace({component: PlayerView})
          }

        })
        AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
          if(!res){
            this.setState({loggedIn:false}, 
            function(){
                this.forceUpdate()
            })
          }else{
            this.setState({loggedIn:true}, 
            function(){
              this.forceUpdate()
            })
          }
        })
      }
    })
  }
}

// Player View
class PlayerView extends Component {

  constructor(props) {
    super(props)

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    // Actions
    this._playPause = this._playPause.bind(this)
    this._playNext = this._playNext.bind(this)
    this._playPrevious = this._playPrevious.bind(this)
    this._orientationDidChange = this._orientationDidChange.bind(this)
    this._launchSelector = this._launchSelector.bind(this)
    this._setShuffle = this._setShuffle.bind(this)
    this._setRepeat = this._setRepeat.bind(this)
    this._choosePlaylist = this._choosePlaylist.bind(this)
    this._newGifRequest = this._newGifRequest.bind(this)
    this._setSaved = this._setSaved.bind(this)
    this._tick = this._tick.bind(this)

    // State
    this.state = {
      layoutProps: {
        orientation: 'portrait',
        width: width,
        height: height
      },
      currentUser: [],
      userPlaylists: [],
      tracks: [],
      tracksURIs: [],
      isPlaying: false,
      isShuffling: false,
      isRepeating: false,
      secondsElapsed: 0,
      currentTrackDuration: 0,
      bpm: 400,
      tempo: 120,
      currentPlaylistName: '',
      currentPlaylistOwner: '',
      currentPlaylistTotal: 0,
      currentPlaylistImage: '',
      currentPlaylist: [],
      currentTrackName: '',
      currentArtistName: '',
      currentAlbumName: '',
      currentTrackURI: '',
      currentTrackArt: '',
      currentTrackID: '',
      currentGiphyTerms: [],
      textTerms: '',
      inputActive: false,
      currentPlaylistGif: '',
      loadingGifs: false,
      currentPlaylistGifsURLS: [],
      currentPlaylistGifsLocal: [],
      currenttrackAnalisys: [],
      currenttrackFeatures: [],
      currenttrackSaved: false,
      amountLoaded: 0,
      showListView: true,
      dataSource: ds.cloneWithRows([]),
      tasks: []

    }
  }

  // Helpers
  _minTommss(minutes){
    var sign = minutes < 0 ? "-" : ""
    var min = Math.floor(Math.abs(minutes))
    var sec = Math.floor((Math.abs(minutes) * 60) % 60)
    return sign + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec
  }

  _setInput(active){
    if(this.state.currentTrackName != ''){
      if(active){
        //this._stop()
        this.refs.Search.focus()
      }else{ 
        //this._play()
        this.refs.Search.blur()
      }
    }
    this.setState({
      inputActive: active
    })

  }

  // Hard Stop
  _stop(){

    this.setState({
      currentPlaylistGifsLocal: ['/Users/johnhanusek/Development/Gmixr/GmixrReact/assets/gmixr-logo2.gif'],
      isPlaying: false
    })

    SpotifyAuth.setIsPlaying(false, (error)=>{
        clearInterval(this.playTime)
        BackgroundTimer.clearInterval(this.intervalId)
    })
  }

  // Hard Play
  _play(){


    clearInterval(this.playTime)
    BackgroundTimer.clearInterval(this.intervalId)

    this.setState({
      isPlaying: true,
      loadingGifs: false
    })
    SpotifyAuth.setIsPlaying(true, (error)=>{
      this.playTime = setInterval(this._tick, 1000)

      this.intervalId = BackgroundTimer.setInterval(() => {
            this._updateGif(this.state.currentPlaylistGifsLocal)
        }, this.state.bpm)
    })
  }

  // Actions from UI
  _playPause(){
    
    SpotifyAuth.setIsPlaying(!this.state.isPlaying, (error)=>{
      
      if(error){
        console.log('error:',error)
      }

      if(this.state.isPlaying){
        clearInterval(this.playTime)
        BackgroundTimer.clearInterval(this.intervalId)
      }else{
        this.playTime = setInterval(this._tick, 1000)

        this.intervalId = BackgroundTimer.setInterval(() => {
              this._updateGif(this.state.currentPlaylistGifsLocal)
          }, this.state.bpm)
      }
      
      this.setState({
        isPlaying: !this.state.isPlaying
      })

    })    
  }

  _playPrevious(){

    this._cancelGetData(this.state.currentPlaylistGifsURLS)



    SpotifyAuth.skipPrevious((error)=>{
      if(error){
        console.log('error:',error)
      }

      this.setState({
        secondsElapsed: 0
      })

      //this._stop()
      clearInterval(this.playTime)
      BackgroundTimer.clearInterval(this.intervalId)

    })

  }

  _playNext(){


    this._cancelGetData(this.state.currentPlaylistGifsURLS)
      
    SpotifyAuth.skipNext((error)=>{
      if(error){
        console.log('error:',error)
      }

      
      this.setState({
        secondsElapsed: 0
      })

      //this._stop()
      clearInterval(this.playTime)
      BackgroundTimer.clearInterval(this.intervalId)

    })
  
  }

  _setShuffle(){
    var value = (this.state.isShuffling) ? false : true
    SpotifyAuth.setShuffle(value, (error)=>{
      if(error){
        console.log('error:',error)
      }
      console.log('setShuffle')
      console.log(value)
      this.setState({
        isShuffling: value,
      })

    })
  }

  _setRepeat(){
    var mode = (this.state.isRepeating) ? false : true
    SpotifyAuth.setRepeat(mode, (error)=>{
      if(error){
        console.log('error:',error)
      }
      console.log('setRepeat')
      console.log(mode)
      this.setState({
        isRepeating: mode,
      })

    })
  }

  // Update UI based on Timers
  _tick(){
    SpotifyAuth.currentPlaybackPosition((result)=>{

      var time = moment.duration(result, 'seconds')

      var seconds = (time._data.seconds <= 9) ? '0'+time._data.seconds : time._data.seconds
      var minutes = (time._data.minutes <= 9) ? '0'+time._data.minutes : time._data.minutes
      var hours = (time._data.hours <= 9) ? '0'+time._data.hours : time._data.hours
      this.setState({
        secondsElapsed: hours + ':' + minutes + ':' + seconds
      })
    })
  }

  // Swap Visable Image on tempo update
  _updateGif(currentPlaylistGifsLocal){
    if(currentPlaylistGifsLocal.length){
      var image = currentPlaylistGifsLocal[Math.floor(Math.random() * currentPlaylistGifsLocal.length)]
      this.setState({
        currentPlaylistGif: image
      })
    }
  }

  // Download and store Gifs Locally for easy access
  // NOTE: When this operation is running we disallow UI in some areas.
  // TODO: When UI is interactied with we need to Kill this operation.
  // Can be done: https://github.com/wkh237/react-native-fetch-blob#user-content-cancel-request
  _getData(imagearr){


    this.setState({
      currentPlaylistGifsLocal: []
    })

    var j = 1


    for(i = 0; i < imagearr.length; i++){

      this.state.tasks[i] = RNFetchBlob.config({
        fileCache : true,
        appendExt : 'gif'
      }).fetch('GET', imagearr[i])

      this.state.tasks[i].then((result) => {

        var percent = Math.round((j/imagearr.length)*100)

        this.setState({
          currentPlaylistGifsLocal: this.state.currentPlaylistGifsLocal.concat(result.path()),
          amountLoaded:percent
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

  _cancelGetData(imagearr){

    this.setState({
      currentPlaylistGifsLocal: []
    })

    for(i = 0; i < imagearr.length; i++){
      this.state.tasks[i].cancel()
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
      console.log(responseJson)
      if(responseJson.error){
        return
      }
      var playlists = responseJson.items
      

      var mydata = []
      for(i = 0; i < playlists.length; i++){
        //console.log(playlists[i])
        var imgArr = playlists[i].images
        var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

        if(imgArr.length){
          playlistImage = imgArr[0].url
        }else if(this.state.currentUser.images){
          playlistImage = this.state.currentUser.images[0].url
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
      }else if(this.state.currentUser.images){
        playlistImage = this.state.currentUser.images[0].url
      }

      this.setState({
        currentPlaylistName: playlists[0].name,
        currentPlaylist: playlists[0],
        currentPlaylistOwner: playlists[0].owner.id,
        currentPlaylistTotal: playlists[0].tracks.total,
        currentPlaylistImage: playlistImage,
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
      this.setState({
        currentUser: responseJson
      })
      this._getUsersPlaylists()
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, fetch User info
  // TODO: May be able to bypass this function
  _getUser() {
    
    SpotifyAuth.getToken((result)=>{
      //console.log(result)
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

    this.playTime = setInterval(this._tick, 1000)

    var currentPlaylist = this.state.currentPlaylist

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
                currentTrackDuration: result
              })
            })

            AsyncStorage.getItem('@GmixrStore:token', (err, result) => {
              this._getAudioFeatures(track[0].id, result)
              this._getGifs(track[0].artists[0].name + ' ' + track[0].name)
            })

            this.setState({
              currentArtistName: track[0].artists[0].name,
              currentTrackName: track[0].name,
              currentAlbumName: track[0].album.name,
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


    var trackID = currentURI.replace("spotify:track:", "")

    AsyncStorage.getItem('@GmixrStore:token', (err, result) => {

      fetch('https://api.spotify.com/v1/tracks/'+trackID, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer '+result
        }
      })
      .then((response) => response.json())
      .then((responseJson) => {


        console.log('_setTrack')
        console.log(responseJson)

        

        this.setState({
          currentArtistName: responseJson.artists[0].name,
          currentTrackName: responseJson.name,
          currentAlbumName: responseJson.album.name,
          currentTrackArt: responseJson.album.images[0].url,
          currentTrackURI: responseJson.uri,
          currentTrackID: responseJson.id
        })

        var currentTerms = []
        currentTerms[0] = responseJson.artists[0].name
        currentTerms[1] = responseJson.name

        this._getAudioFeatures(responseJson.id, result)
        this._getGifs(responseJson.artists[0].name + ' ' + responseJson.name)

        
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
      //console.log(responseJson)

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

      this.setState({
        currenttrackAnalisys: responseJson
      })

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
      console.log('currenttrackSaved')
      console.log(responseJson[0])

      this.setState({
        currenttrackSaved: responseJson[0]
      })
    })
    .catch((err) => {
      console.error(err)
    })
  }

  _setSaved(saved){
    AsyncStorage.getItem('@GmixrStore:token', (err, result) => {

      var method = (saved) ? 'PUT' : 'DELETE'
      fetch('https://api.spotify.com/v1/me/tracks?ids='+this.state.currentTrackID, {
        method: method,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer '+result
        }
      })
      .then((response) => {
        console.log('currenttrackSaved')
        console.log(response)

        if(response){
          // var isSaved = (saved) ? false : true
          this.setState({
            currenttrackSaved: saved
          })
        }
      })
      .catch((err) => {
        console.error(err)
      })

    })
  }


  // Get from Giphy some dank Gifs
  _getGifs(terms){

    this.setState({
      currentGiphyTerms: terms
    })

    this.setState({loadingGifs: true, textTerms: terms})

    terms = encodeURIComponent(terms)
    fetch('https://api.giphy.com/v1/gifs/search?q='+terms+'&limit=50&api_key=dc6zaTOxFJmzC', {
      method: 'GET',
    })
    .then((response) => response.json())
    .then((responseJson) => {
      //console.log(responseJson)
      var gifUrls = []
      for(i = 0; i < responseJson.data.length; i++){
        gifUrls.push(responseJson.data[i].images.downsized_medium.url)
      }
      this.setState({currentPlaylistGifsURLS: gifUrls})
      this._getData(this.state.currentPlaylistGifsURLS)
    })
    .catch((err) => {
      console.error(err)
    })
    
  }

  // Remove any Gifs from the current state
  _clearGifs(){
    this.setState({
      currentPlaylistGifsURLS: [],
      currentPlaylistGifsLocal: []
    })
  }

  _newGifRequest(terms){
    this._cancelGetData(this.state.currentPlaylistGifsURLS)
    this._clearGifs()
    this._getGifs(terms)
  }

  // A selected Playlist From the Playlist ListView
  // TODO: need to add more functionality to choosing music from Spotify
  _choosePlaylist(playlistURI){

    this._cancelGetData(this.state.currentPlaylistGifsURLS)

    // if(!this.state.loadingGifs){

    var playlists = this.state.userPlaylists

    var playlist = playlists.filter((item) => {
      return item.uri == playlistURI
    })



    var imgArr = playlist[0].images
    var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

    if(imgArr.length){
      playlistImage = imgArr[0].url
    }else if(this.state.currentUser.images){
      playlistImage = this.state.currentUser.images[0].url
    }

    console.log(playlist[0])

    this.setState({
      showListView: false,
      currentPlaylistName: playlist[0].name,
      currentPlaylist: playlist[0],
      currentPlaylistOwner: playlist[0].owner.id,
      currentPlaylistTotal: playlist[0].tracks.total,
      currentPlaylistImage: playlistImage
    }, function() {
      clearInterval(this.playTime)
      BackgroundTimer.clearInterval(this.intervalId)

      this._getMusic()
    })
      
    //}
  }

    // If from IOS orientation was updated
  _orientationDidChange(orientation) {
    if (orientation == 'LANDSCAPE') {

      const {height, width} = Dimensions.get('window')

      //console.log('landscape')
      const newLayout = {
        orientation: 'landscape',
        height: height,
        width: width
      }
      //console.log(newLayout)
      this.setState({ layoutProps: newLayout })

    } else {
      
      //do something with portrait layout
      const {height, width} = Dimensions.get('window')

      //console.log('portrait')
      const newLayout = {
        orientation: 'portrait',
        height: height,
        width: width
      }
      //console.log(newLayout)
      this.setState({ layoutProps: newLayout })
    }
  }

  _launchSelector(){
    LayoutAnimation.easeInEaseOut()
    this.setState({
      showListView: (this.state.showListView) ? false : true
    })
  }

  render() {
    
    var avatar = 'https://facebook.github.io/react/img/logo_og.png'
    if(this.state.currentUser.images){
      avatar = this.state.currentUser.images[0].url
    }

    var backgroundImage = avatar
    if(this.state.currentTrackArt){
      backgroundImage = this.state.currentTrackArt
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
    if(this.state.currentPlaylistOwner != ''){
      playlistInfo = 'by ' + this.state.currentPlaylistOwner + ' · ' + this.state.currentPlaylistTotal + ' songs'
    }

    var textTerms = ''
    for(i = 0; i < this.state.currentGiphyTerms.length; i++){
      textTerms += this.state.currentGiphyTerms[i] + ' '
    }

    const Row = (props) => (
      <TouchableHighlight style={styles.row} onPress={() => this._choosePlaylist(props.data.uri)} activeOpacity={1} underlayColor="transparent">
        <View style={styles.flexRow}>
          <Image style={styles.playlistThumbnail} source={{ uri: props.data.image}} />
          <View>
            <Text style={[styles.listTitleText, {width: listTextWidth }]} numberOfLines={1}>
              {props.data.name}
            </Text>
            <Text style={[styles.listDescText, {width: listTextWidth }]} numberOfLines={1}>
              {'by ' + props.data.owner + ' · ' + props.data.total + ' songs'}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    )



    return (
      <View style={styles.container}>
        <View style={styles.flex}>
          <View style={styles.video}>
            <Image 
              style={{width: this.state.layoutProps.width, height: vidHeight}}
              source={(this.state.isPlaying && this.state.currentPlaylistGif != '') ? { uri: this.state.currentPlaylistGif } : defaultImage}
              resizeMode='contain'
            />
            <View style={[styles.loader, {width:loaderWidth, opacity: loaderOpacity}]}></View>
          </View>
          <View style={[styles.controlWrap, {width: this.state.layoutProps.width, position: (this.state.layoutProps.orientation == 'landscape') ? 'absolute' : 'relative', opacity: (this.state.layoutProps.orientation == 'landscape') ? 0 : 1}]}>
            <BlurImage 
              style={styles.backgroundImage}
              source={{uri: backgroundImage}}
              blurRadius={30}
            />
            {(this.state.showListView) ? (
            <ListView
              style={styles.listView}
              dataSource={this.state.dataSource}
              renderRow={(rowData, sectionID, rowID) => <Row key={rowID} data={rowData} />}  />
            ) : (
            <View style={styles.backgroundView}>
              <TextInput
                  ref='Search'
                  spellCheck={false}
                  style={[styles.termInput, {height: (this.state.inputActive) ? 40 : 0, padding:(this.state.inputActive) ? 4 : 0  }]}
                  onFocus={() => this._setInput(true)}
                  onBlur={() => this._setInput(false)}
                  blurOnSubmit={true}
                  keyboardType={'ascii-capable'}
                  onChangeText={(text) => this.setState({textTerms: text})}
                  onSubmitEditing={(event) => this._newGifRequest(event.nativeEvent.text)}
                  value={this.state.textTerms}
                  removeClippedSubviews={true}
                />
              <View style={styles.flexRow}>

                <TouchableHighlight style={styles.smallerButton} onPress={() => this._setSaved((this.state.currenttrackSaved) ? false : true)} activeOpacity={1} underlayColor="transparent">
                  {(this.state.currenttrackSaved) ? (
                     <IOIcon name="md-checkmark" backgroundColor="transparent" color={green} size={17} />
                  ) : (
                     <IOIcon name="md-checkmark" backgroundColor="transparent" color="white" size={17} />
                  )}
                </TouchableHighlight> 

                <View style={styles.flexColumn}>
                  <View style={styles.marqueeView}>
                    {(this.state.currentTrackName.length > 30) ? (
                      <MarqueeLabel style={styles.marqueeLabel} scrollDuration={20} fadeLength={30} leadingBuffer={0} trailingBuffer={0} fontSize={20}>
                        {this.state.currentTrackName}
                      </MarqueeLabel>
                    ) : (
                      <Text style={styles.marqueeText}>
                        {this.state.currentTrackName}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.mediumText} numberOfLines={1}>
                      {this.state.currentArtistName}
                  </Text>
                </View>
                <TouchableHighlight style={styles.smallerButton} onPress={() => this._setInput((this.state.inputActive) ? false : true)} activeOpacity={1} underlayColor="transparent">
                  {(this.state.inputActive) ? (
                     <IOIcon name="md-add" backgroundColor="transparent" color={green} size={17} />
                  ) : (
                     <IOIcon name="md-add" backgroundColor="transparent" color="white" size={17} />
                  )}
                </TouchableHighlight> 
              </View>
              <Text style={styles.monoText}>
                {(this.state.secondsElapsed == 0) ? '' : this.state.secondsElapsed}
              </Text>
              <View style={styles.controls}>
                <TouchableHighlight style={styles.smallerButton} onPress={this._setShuffle} activeOpacity={1} underlayColor="transparent">
                  {(this.state.isShuffling) ? (
                     <SLIcon name="shuffle" backgroundColor="transparent" color={green} size={15} />
                  ) : (
                     <SLIcon name="shuffle" backgroundColor="transparent" color="white" size={15} />
                  )}
                </TouchableHighlight>          
                <TouchableHighlight style={styles.smallButton} onPress={this._playPrevious} activeOpacity={1} underlayColor="transparent">
                  <FAIcon name="step-backward" backgroundColor="transparent" color="white" size={30} />
                </TouchableHighlight>
                <TouchableHighlight style={styles.largeButton} onPress={this._playPause} activeOpacity={1} underlayColor="transparent">
                  <FAIcon name={(this.state.isPlaying) ? 'pause' : 'play'} style={(this.state.isPlaying) ? {marginLeft:0} : {marginLeft:7}} backgroundColor="transparent" color="white" size={40} />
                </TouchableHighlight>
                <TouchableHighlight style={styles.smallButton} onPress={this._playNext} activeOpacity={1} underlayColor="transparent">
                  <FAIcon name="step-forward" backgroundColor="transparent" color="white" size={30} />
                </TouchableHighlight>
                <TouchableHighlight style={styles.smallerButton} onPress={this._setRepeat} activeOpacity={1} underlayColor="transparent">
                    {(this.state.isRepeating) ? (
                       <SLIcon name="loop" backgroundColor="transparent" color={green} size={15} />
                    ) : (
                       <SLIcon name="loop" backgroundColor="transparent" color="white" size={15} />
                    )}
                </TouchableHighlight> 
              </View>
            </View>
            )}
          </View>
        </View>
        <View style={[styles.bottomBar, {bottom: bottomBarbottom, opacity: (this.state.layoutProps.orientation == 'landscape') ? 0 : 1}]}>
          <TouchableHighlight style={styles.row} onPress={this._launchSelector} activeOpacity={1} underlayColor="transparent">
            <View style={styles.flexRow}>
              <Image style={styles.playlistThumbnail} source={{ uri: this.state.currentPlaylistImage}} />
              <View>
                <Text style={[styles.listTitleText, {width: listTextWidth }]} numberOfLines={1}>
                  {this.state.currentPlaylistName}
                </Text>
                <Text style={[styles.listDescText, {width: listTextWidth }]} numberOfLines={1}>
                  {playlistInfo}
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
      </View>
      
      )

  }

  componentWillUpdate() {
    LayoutAnimation.easeInEaseOut()
  }

  componentWillMount() {
    // Animate creation
    LayoutAnimation.easeInEaseOut()
  }


  componentDidMount() {
    this._getUser()


    // Add Listeners from IOS
    Orientation.addOrientationListener(this._orientationDidChange)

    myModuleEvt.addListener('EventReminder', (data) => {

      var message = data.object[0]
      if(message.includes("didStartPlayingTrack")){
        
        var trackURI = message.replace("didStartPlayingTrack: ", "")
        this._setTrack(trackURI)
        this._play()

      }else if(message.includes("didStopPlayingTrack")){
        
        this._stop()

      }else if(message.includes("didChangeMetadata")){
        
        var trackURI = message.replace("didChangeMetadata: ", "")

      }else if(data.object == "didChangePlaybackStatus"){


      }
    })
  }

  componentWillUnmount() {

    // Cleanup and Timers and Listeners
    clearInterval(this.playTime)
    BackgroundTimer.clearInterval(this.intervalId)
    myModuleEvt.remove()

    Orientation.getOrientation((err,orientation)=> { })
    Orientation.removeOrientationListener(this._orientationDidChange)
    
  }
}

//Used to navigate between other components
class Gmixr extends Component {
  render(){
    return (
      <View style={{flexGrow: 1}}>
       <StatusBar 
        hidden={true}
        backgroundColor="blue"
        barStyle="light-content"
      />
      <NavigatorIOS
        initialRoute={{
          component: logIn,
          title: 'Log In ',
        }}
        style={{flexGrow: 1, backgroundColor:'black'}}
        navigationBarHidden={true}
      />
      </View>
    )
  }
}

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: darkgray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0,
    opacity:0.2,
  },
  flex: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  backgroundView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topPlayerView: {

  },
  video: {
    backgroundColor: black,
  },
  loader: {
    position: 'absolute',
    bottom:0,
    left:0,
    width:0,
    height:6,
    alignSelf:'flex-start',
    backgroundColor: blue
  },
  flexColumn: {
    flex: 1
  },
  flexRow: {
    flex: 1,
    flexDirection:'row',
  },
  termInput: {
    padding:0,
    color:'white',
    height: 0, 
    overflow: 'hidden',
    backgroundColor:'rgba(0,0,0,0.3)'

  },
  controls: {
    flex: 1,
    flexDirection:'row',
    paddingTop:40,
    paddingBottom:40,
  },
  smallButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width:48,
    height:48,
    marginTop:12,
    marginBottom:12,
    marginLeft:20,
    marginRight:20,
  },
  smallerButton:{
    justifyContent: 'center',
    alignItems: 'center',
    width:48,
    height:48,
    marginTop:12,
    marginBottom:12,
    marginLeft:0,
    marginRight:0,
  },
  largeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width:72,
    height:72,
    margin:0,
    borderRadius:36,
    borderWidth:1,
    borderColor:'white'
  },
  image: {
    width: 250,
    height: 50
  },
  mediumText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 10,
    color: 'white',
    backgroundColor: 'transparent',
  },
  monoText: {
    fontSize: 14,
    textAlign: 'center',
    margin: 10,
    color: 'white',
    fontFamily: 'Courier New',
    backgroundColor: 'transparent',

  },
  marqueeView: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    height:30,
    marginTop: 10,
    marginBottom: 0,
  },
  marqueeLabel: {
    flexGrow: 1,
    height:30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width:width - 100,
    color:'#FFF',
  },
  marqueeText: {
    flexGrow: 1,
    lineHeight:30,
    height:30,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: 'transparent',
    width:width - 100,
    fontSize:20,
    fontWeight:'500',
    color:'#FFF',
  },
  bottomBar: {
    flex: 1,
    flexDirection:'row',
    position: 'absolute',
    width: width,
    height: 64,
    paddingBottom:4,
    paddingTop: 4,
    bottom: 0,
    left: 0,
    backgroundColor:'rgba(0,0,0,0.3)'
  },
  avatar: {
    width:36, 
    height: 36, 
    borderRadius: 18,
    marginLeft: 10,
    marginRight: 0,
  },
  listView: {
    position:'absolute', 
    bottom:72,
    top:8,
    left:0,
    right:0,
    backgroundColor: 'transparent',
  },
  row: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    height:56,
  },
  playlistThumbnail: {
    width:48, 
    height: 48, 
    marginRight: 8,
  },
  listTitleText: {
    fontSize:15,
    fontWeight:'500',
    color:'#FFF',
    marginTop: 4,
    marginBottom: 0,
  },
  listDescText: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    color: 'white',
  },

})

AppRegistry.registerComponent('GmixrReact', () => Gmixr)

