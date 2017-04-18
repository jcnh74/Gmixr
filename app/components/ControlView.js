



/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'
import update from 'immutability-helper'
import {
  AsyncStorage,
  NativeModules,
  Image,
  Text,
  TextInput,
  View,
  TouchableHighlight,
  Slider,
  Dimensions,
  AlertIOS
} from 'react-native'

import Share, {ShareSheet, Button} from 'react-native-share'
import EventEmitter from 'EventEmitter'

import moment from 'moment'

const SpotifyAuth = NativeModules.SpotifyAuth

import Marquee from '@remobile/react-native-marquee'
import MarqueeLabel from '@remobile/react-native-marquee-label'

import FAIcon from 'react-native-vector-icons/FontAwesome'
import SLIcon from 'react-native-vector-icons/SimpleLineIcons'
import IOIcon from 'react-native-vector-icons/Ionicons'

var styles = require('../style');


// Settings
const {height, width} = Dimensions.get('window')
const black = 'black'
const darkgray = 'rgb(20,20,20)'
const midgray = 'rgb(60,60,60)'
const blue = 'rgb(0,113,188)'
const green = '#84bd00'


export default class ControlView extends Component {

  constructor(props) {
    super(props)

    // Actions
    this._playPause = this._playPause.bind(this)
    this._playNext = this._playNext.bind(this)
    this._playPrevious = this._playPrevious.bind(this)
    this._seekTo = this._seekTo.bind(this)
    this._seeking = this._seeking.bind(this)
    this._setShuffle = this._setShuffle.bind(this)
    this._setRepeat = this._setRepeat.bind(this)
    this._newGifRequest = this._newGifRequest.bind(this)
    this._setSaved = this._setSaved.bind(this)
    //this._setView = this._setView.bind(this)

    this._tick = this._tick.bind(this)

    // State
    this.state = {
      currentTrack: this.props.currentTrack,
      inputActive: false,
      secondsElapsed: 0,
      percentElapsed: 0,
      widthElapsed: 0,
      isPlaying: this.props.isPlaying,
      isRepeating: false,
      duration: 0,
      visible: false,
    }
  }

  // Update UI based on Timers
  _tick(){

    SpotifyAuth.currentPlaybackPosition((result)=>{

      var time = moment.duration(result, 'seconds')

      var seconds = (time._data.seconds <= 9) ? '0'+time._data.seconds : time._data.seconds
      var minutes = (time._data.minutes <= 9) ? '0'+time._data.minutes : time._data.minutes
      var hours = (time._data.hours <= 9) ? '0'+time._data.hours : time._data.hours
      //var duration = (currentTrackDuration/1000) % 60;
      var elapse = this.props.currentTrack.duration/1000
      var trackDuration = result/elapse 


      this.setState({
        secondsElapsed: hours + ':' + minutes + ':' + seconds,
        percentElapsed: trackDuration,
        widthElapsed: width*trackDuration
      })

    })
  }

  _setState(state){
    this.props._setState(state)
  }

  _launchSelector(selection){
    this.props._launchSelector(selection)
  }

  _startTimers(){
    this.playTime = setInterval(this._tick, 1000)
    this.props._startTimers()
  }

  _clearTimers(){
    clearInterval(this.playTime)
    this.props._clearTimers()
  }


  // Helpers
  _minTommss(minutes){
    var sign = minutes < 0 ? "-" : ""
    var min = Math.floor(Math.abs(minutes))
    var sec = Math.floor((Math.abs(minutes) * 60) % 60)
    return sign + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec
  }


  _setInput(active){
    if(this.props.currentTrack.name != ''){
      if(active){
        this.refs.Search.focus()
      }else{ 
        this.refs.Search.blur()
      }
    }
    this.setState({
      inputActive: active
    })

  }

  _newGifRequest(event){
    this.props._newGifRequest(event)
  }

  _setSaved(saved){
    this.setState({
      currentTrack: {
        saved: saved
      }
    })
    AsyncStorage.getItem('@GmixrStore:token', (err, result) => {

      var method = (saved) ? 'PUT' : 'DELETE'
      fetch('https://api.spotify.com/v1/me/tracks?ids='+this.props.currentTrack.trackID, {
        method: method,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer '+result
        }
      })
      .then((response) => {

        if(response){

        }
      })
      .catch((err) => {
        console.error(err)
      })

    })
  }

  _setView(){
    this.props._setView(!this.props.mini)
  }

  _seekTo(value){
    //console.log(this.props.currentTrack.duration)
    this._clearTimers()


    var seekTo = (this.props.currentTrack.duration) ? (this.props.currentTrack.duration/1000)*value : 0
    //console.log(seekTo)

    SpotifyAuth.seekTo(seekTo, (error)=>{
      this.setState({
        percentElapsed: value,
      })

      this._startTimers()
      //this.props._startTimers()


    })

  }

  _seeking(){

    this._clearTimers()

  }

  _setShuffle(){
    var value = (this.props.isShuffling) ? false : true
    SpotifyAuth.setShuffle(value, (error)=>{
      if(error){
        console.log('error:',error)
      }
      this._setState({
        isShuffling: value,
      })

    })
  }

  _playPrevious(){

    this.props._cancelGetData()

    //this._clearTimers()

    this.setState({
      secondsElapsed: 0
    })

    SpotifyAuth.skipPrevious((error)=>{
      if(error){
        console.log('error:',error)
      }

      if(this.props.isPlaying){
        this._clearTimers()
      }else{
        this._startTimers()
        //this.props._startTimers()
      }


      //this.props._clearTimers()

    })

  }
  _playPause(){

    
    // this._clearTimers()
    
    SpotifyAuth.setIsPlaying(!this.props.isPlaying, (error)=>{
      
      if(error){
        console.log('error:',error)
      }

      if(this.props.isPlaying){
        this._clearTimers()
      }else{
        this._startTimers()
      }
      
      this._setState({
        isPlaying: !this.props.isPlaying
      })

    })    
  }

  _playNext(){


    this.props._cancelGetData()

    //this._clearTimers()

    this.setState({
      secondsElapsed: 0
    })
      
    SpotifyAuth.skipNext((error)=>{
      if(error){
        console.log('error:',error)
      }

      if(this.props.isPlaying){
        this._clearTimers()
      }else{
        this._startTimers()
      }


    })
  
  }

  _setRepeat(){
    var mode = (this.state.isRepeating) ? false : true
    SpotifyAuth.setRepeat(mode, (error)=>{
      if(error){
        console.log('error:',error)
      }
      this.setState({
        isRepeating: mode,
      })

    })
  }

  _getEvent(event){
    this._startTimers()
  }

  onCancel() {
    console.log("CANCEL")
    this.setState({visible:false});
  }
  onOpen() {
    console.log("OPEN")
    this.setState({visible:true});
  }


  render() {

    var trackName = (this.props.currentTrack.name) ? this.props.currentTrack.name : ''

    var jsonTerms = encodeURIComponent(this.props.textTerms)
    var url = 'gmixr://gmixr.com/?uri='+this.props.currentTrack.uri+'&terms='+jsonTerms

    let shareOptions = {
      title: 'Shared Gmixr Mixup',
      message: trackName + ' by ' + this.props.currentTrack.artistName +' using "' + this.props.textTerms +'" on #Gmixr',
      url: url,
      subject: this.props.currentUser.display_name + " Shared a Gmixr Mixup" //  for email 
    }


    return (
      <View style={[styles.backgroundView, this.props.styles]}>
      {(this.props.mini) ? (
        <View style={{height:44, width: width, position: 'absolute', top:0, left:0, right:0}}>
          <View style={styles.miniPlayerTrack}>
            <View style={[styles.miniPlayerTrackProgress, {width: this.state.widthElapsed}]}></View>
          </View>
          <View style={{height:42, width: width, position: 'absolute', top:2, left:0, right:0, bottom:0}}>
            <View style={styles.flexRow}>
              <TouchableHighlight style={[styles.miniButton, {marginLeft: 6}]} onPress={() => this._setView()} activeOpacity={1} underlayColor="transparent">
                <IOIcon name="ios-arrow-up" backgroundColor="transparent" color="white" size={26} />
              </TouchableHighlight> 
              <View style={styles.flexColumn}>
                <View style={styles.marqueeViewMini}>
                  {(trackName.length > 30) ? (
                    <MarqueeLabel style={styles.marqueeLabelMini} scrollDuration={20} fadeLength={30} leadingBuffer={0} trailingBuffer={0} fontSize={14}>
                      {trackName}
                    </MarqueeLabel>
                  ) : (
                    <Text style={styles.marqueeTextMini}>
                      {trackName}
                    </Text>
                  )}
                </View>
                <Text style={styles.mediumTextMini} numberOfLines={1}>
                    {this.props.currentTrack.artistName}
                </Text>
              </View>
              <TouchableHighlight style={[styles.miniButton, {marginRight: 6}]} onPress={this._playPause} activeOpacity={1} underlayColor="transparent">
                <FAIcon name={(this.props.isPlaying) ? 'pause' : 'play'} style={(this.props.isPlaying) ? {marginLeft:0} : {marginLeft:7}} backgroundColor="transparent" color="white" size={16} />
              </TouchableHighlight>
            </View>
          </View>
        </View>
      ) : (
        <View>
          <TextInput
              ref='Search'
              spellCheck={false}
              style={[styles.termInput, {height: (this.state.inputActive) ? 40 : 0, padding:(this.state.inputActive) ? 4 : 0, width: width }]}
              onFocus={() => this._setInput(true)}
              onBlur={() => this._setInput(false)}
              blurOnSubmit={true}
              keyboardType={'ascii-capable'}
              onChangeText={(text) => this._setState({textTerms: text})}
              onSubmitEditing={(event) => this._newGifRequest(event.nativeEvent.text)}
              value={this.props.textTerms}
              removeClippedSubviews={true}
            />
          <View style={styles.flexRow}>


            <TouchableHighlight style={styles.smallerButton} onPress={() => this._setView()} activeOpacity={1} underlayColor="transparent">
              <IOIcon name="ios-arrow-down" backgroundColor="transparent" color="white" size={30} />
            </TouchableHighlight> 

            <View style={styles.flexColumn}>
              <View style={styles.marqueeView}>
                {(trackName.length > 30) ? (
                  <MarqueeLabel style={styles.marqueeLabel} scrollDuration={20} fadeLength={30} leadingBuffer={0} trailingBuffer={0} fontSize={20}>
                    {trackName}
                  </MarqueeLabel>
                ) : (
                  <Text style={styles.marqueeText}>
                    {trackName}
                  </Text>
                )}
              </View>
              <Text style={styles.mediumText} numberOfLines={1}>
                  {this.props.currentTrack.artistName}
              </Text>
            </View>
            <TouchableHighlight style={styles.smallerButton} onPress={() => this._setInput((this.state.inputActive) ? false : true)} activeOpacity={1} underlayColor="transparent">
              {(this.state.inputActive) ? (
                 <IOIcon name="md-add" backgroundColor="transparent" color={green} size={30} />
              ) : (
                 <IOIcon name="md-add" backgroundColor="transparent" color="white" size={30} />
              )}
            </TouchableHighlight> 
          </View>
          <View style={{flex:1, alignItems: 'center', justifyContent:'center'}}>
            <Slider
              thumbImage={require('../../track_head.png')}
              maximumTrackTintColor={darkgray}
              minimumTrackTintColor={blue}
              style={{width: (width-32)}}
              value={this.state.percentElapsed}
              onValueChange={this._seeking}
              onSlidingComplete={(value) => this._seekTo(value)} 
            />
          </View>
          <Text style={styles.monoText}>
            {(this.state.secondsElapsed == 0) ? '' : this.state.secondsElapsed}
          </Text>
          <View style={styles.controls}>
            <TouchableHighlight style={styles.smallerButton} onPress={this._setShuffle} activeOpacity={1} underlayColor="transparent">
              {(this.props.isShuffling) ? (
                 <SLIcon name="shuffle" backgroundColor="transparent" color={green} size={15} />
              ) : (
                 <SLIcon name="shuffle" backgroundColor="transparent" color="white" size={15} />
              )}
            </TouchableHighlight>          
            <TouchableHighlight style={styles.smallButton} onPress={this._playPrevious} activeOpacity={1} underlayColor="transparent">
              <FAIcon name="step-backward" backgroundColor="transparent" color="white" size={30} />
            </TouchableHighlight>
            <TouchableHighlight style={styles.largeButton} onPress={this._playPause} activeOpacity={1} underlayColor="transparent">
              <FAIcon name={(this.props.isPlaying) ? 'pause' : 'play'} style={(this.props.isPlaying) ? {marginLeft:0} : {marginLeft:7}} backgroundColor="transparent" color="white" size={40} />
            </TouchableHighlight>
            <TouchableHighlight style={styles.smallButton} onPress={this._playNext} activeOpacity={1} underlayColor="transparent">
              <FAIcon name="step-forward" backgroundColor="transparent" color="white" size={30} />
            </TouchableHighlight>
            <TouchableHighlight style={styles.smallerButton} onPress={this._setRepeat} activeOpacity={1} underlayColor="transparent">
                {(this.props.isRepeating) ? (
                   <SLIcon name="loop" backgroundColor="transparent" color={green} size={15} />
                ) : (
                   <SLIcon name="loop" backgroundColor="transparent" color="white" size={15} />
                )}
            </TouchableHighlight> 
          </View>          
          <View style={[styles.flexRow, {flex:1, justifyContent: 'space-between'}]}>
            <TouchableHighlight style={styles.smallerButton} onPress={()=>{Share.open(shareOptions)}} activeOpacity={1} underlayColor="transparent">
              <IOIcon name="ios-share-outline" backgroundColor="transparent" color="white" size={30} />
            </TouchableHighlight> 
            <TouchableHighlight style={styles.smallerButton} onPress={() => this._launchSelector('settings')} activeOpacity={1} underlayColor="transparent">
              <IOIcon name="ios-settings-outline" backgroundColor="transparent" color="white" size={30} />
            </TouchableHighlight>
          </View>
        </View>
      )}
      </View>
    )

//              <Image style={styles.avatar} source={{ uri: this.props.avatar}} /> 


            // <TouchableHighlight style={styles.smallerButton} onPress={() => this._setSaved((this.state.currentTrack.saved) ? false : true)} activeOpacity={1} underlayColor="transparent">
            //   {(this.state.currentTrack.saved) ? (
            //      <IOIcon name="md-checkmark" backgroundColor="transparent" color={green} size={20} />
            //   ) : (
            //      <IOIcon name="md-checkmark" backgroundColor="transparent" color="white" size={20} />
            //   )}
            // </TouchableHighlight> 

    // <TouchableHighlight style={styles.row} onPress={this._launchSelector} activeOpacity={1} underlayColor="transparent">
    //         <View style={styles.flexRow}>
    //           <Image style={styles.playlistThumbnail} source={{ uri: this.state.currentPlaylist.image}} />
    //           <View>
    //             <Text style={[styles.listTitleText, {width: listTextWidth }]} numberOfLines={1}>
    //               {this.state.currentPlaylist.name}
    //             </Text>
    //             <Text style={[styles.listDescText, {width: listTextWidth }]} numberOfLines={1}>
    //               {playlistInfo}
    //             </Text>
    //           </View>
    //           <IOIcon name="ios-search-outline" backgroundColor="transparent" color="white" size={20} />
    //         </View>
    //       </TouchableHighlight>

  }
  componentDidMount() {

    //this.addListenerOn(this.props.events, 'playing', this._startTimers);

    //this._startTimers()

    this.props.events.addListener('playing', this._startTimers, this)
    this.props.events.addListener('notPlaying', this._clearTimers, this)

    //myLocalEvt.addListener('didStopPlaying', this._clearTimers())
  }

  componentWillReceiveProps(nextProps) {


  }

  componentWillUnmount() {

    // Cleanup and Timers and Listeners
    this._clearTimers()

    
  }

}
