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
  View,
  Dimensions
} from 'react-native'

// Components
import AlbumRow from './AlbumRow'

// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth

var styles = require('../style');

const {height, width} = Dimensions.get('window')


export default class AlbumSelectView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      userAlbums: [],
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      albumsData: [],
      page: 0,
      total: 0,
      contentOffsetY:0
    }
  }

  _processAlbums(tracks, callback){

    var mydata = this.state.albumsData

    for(i = 0; i < tracks.length; i++){

      var album = tracks[i].track.album
      var artist = tracks[i].track.artists
      var artistName = 'following';

      if(typeof(artist) !== 'undefined' && artist.length){
        if(artist[0].name){
          artistName = artist[0].name
        }
      }


      var imgArr = album.images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[imgArr.length - 1].url){
          playlistImage = imgArr[imgArr.length - 1].url
        }
      }

      var found = mydata.some(function (el) {
        return el.artist === artistName;
      })

      if (!found) {
        mydata.push({name:album.name, uri:album.uri, image:playlistImage, artist: artistName})
      }      
    }

    var page = this.state.page

    this.setState({
      albumsData: mydata,
      dataSource: this.state.dataSource.cloneWithRows(mydata),
      page: page + 1
    }, () => {
      if (typeof callback === "function") {
          callback(true)
      }
    })
 

  }

  // Get all the users Playlists
  _fetchAlbums(bearer){

    var offset = this.state.page * 50
    var userAlbums = this.state.userAlbums

    fetch('https://api.spotify.com/v1/me/tracks?offset='+offset+'&limit=50', {
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
      
      if( ( this.state.page * 50 )  >= responseJson.total ){
        return
      }

      var tracks = responseJson.items
      var merge = userAlbums.concat(tracks)

      this.setState({
        userAlbums: merge,
        total: responseJson.total
      }, function(){

        AsyncStorage.setItem( '@GmixrStore:tracksTotal', JSON.stringify(responseJson.total) )
        AsyncStorage.setItem( '@GmixrStore:tracks', JSON.stringify(merge) )

        this._processAlbums(merge, () => {
          this._fetchAlbums(bearer)
        })
        
      })


      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getUsersAlbums(){

    // Clear Storage
    // AsyncStorage.removeItem('@GmixrStore:albums')

    AsyncStorage.getItem('@GmixrStore:tracks', (err, res) => {

      if(err){
        return
      }

      if(res){
        this._processAlbums(JSON.parse(res))
      }else{


        SpotifyAuth.getToken((result)=>{

          if(result){

            this._fetchAlbums(result)

          }else{
            AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
              this._fetchAlbums(res)
            })
          }
        })

      }
    })

  }

  _chooseAlbum(albums){
    this.props.chooseAlbum(albums)
  }

  _handleScroll(event: Object) {
    AsyncStorage.setItem( '@GmixrStore:albumsOffsetY', JSON.stringify(event.nativeEvent.contentOffset.y) )
  }

  render() {

    // AsyncStorage.removeItem('@GmixrStore:tracks')
    // AsyncStorage.removeItem('@GmixrStore:tracksTotal')

    return (
      <View>
    		<ListView
          ref="listview"
          style={[styles.listView, {top: 0, height: height - this.props.vidHeight - 94 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <AlbumRow key={rowID} data={rowData} chooseAlbum={(albums) => this._chooseAlbum(albums)} />} 
          enableEmptySections={true}
          onScroll={this._handleScroll}
          contentOffset={{y:this.state.contentOffsetY}}
          scrollEventThrottle={16} />
      </View>
    )
  }

  componentWillMount() {
    AsyncStorage.getItem('@GmixrStore:albumsOffsetY', (err, res) => {
      if(res){
        this.setState({
          contentOffsetY: parseInt(res)
        })
      }else{
        this.setState({
          contentOffsetY: 0
        })
      }
    })
  }

  componentDidMount() {

    // IMPORTANT: HIDE IN RELEASE
    // AsyncStorage.removeItem('@GmixrStore:tracks')
    // AsyncStorage.removeItem('@GmixrStore:tracksTotal')

    this.props.events.addListener('userAquired', this._getUsersAlbums, this)

    if(this.props.userAquired){
      this._getUsersAlbums()
    }
    
  }

}
