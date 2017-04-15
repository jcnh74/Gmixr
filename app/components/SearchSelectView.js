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
  TextInput,
  Dimensions
} from 'react-native'

// Components
import TrackRow from './TrackRow'
import ArtistRow from './ArtistRow'
import AlbumRow from './AlbumRow'
import PlaylistRow from './PlaylistRow'
import TitleRow from './TitleRow'

// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth

var styles = require('../style');

const {height, width} = Dimensions.get('window')


export default class SearchSelectView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      userSearchResult: [],
      searchData: [],
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      textTerms: '',
      inputActive: false
    }
  }

  _processItems(items){

    var searchData = this.state.searchData


    var albums = items.albums.items
    var artists = items.artists.items
    var playlists = items.playlists.items
    var tracks = items.tracks.items


    //Tracks
    searchData.push({name:'Songs', type:'title'})
    for(i = 0; i < tracks.length; i++){
      searchData.push({name:tracks[i].name, uri:tracks[i].uri, artist:tracks[i].artists[0].name, album:tracks[i].album.name, type:'track'})
    }

    // Artists
    searchData.push({name:'Artists', type:'title'})
    for(i = 0; i < artists.length; i++){
      var imgArr = artists[i].images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[imgArr.length - 1].url){
          playlistImage = imgArr[imgArr.length - 1].url
        }
      }

      searchData.push({name:artists[i].name, uri:artists[i].uri, id: artists[i].id, image:playlistImage, genres:artists[i].genres, popularity: artists[i].popularity, type:'artist'})
    }

    // Album
    searchData.push({name:'Albums', type:'title'})
    for(i = 0; i < albums.length; i++){

      var imgArr = albums[i].images
      var albumImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[imgArr.length - 1].url){
          albumImage = imgArr[imgArr.length - 1].url
        }
      }
      searchData.push({name:albums[i].name, uri:albums[i].uri, image:albumImage, artist: albums[i].artists[0].name, type:'album'})     
    }

    // Playlist
    searchData.push({name:'Playlists', type:'title'})
    for(i = 0; i < playlists.length; i++){
      var imgArr = playlists[i].images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[0].url){
          playlistImage = imgArr[0].url
        }
      }
      searchData.push({name:playlists[i].name, uri:playlists[i].uri, image:playlistImage, total:playlists[i].tracks.total, owner: playlists[i].owner.id, type:'playlist'})
    }


    this.setState({
      searchData: searchData,
      dataSource: this.state.dataSource.cloneWithRows(searchData),
    })

  }

  // Get all the users Playlists
  _fetchItems(bearer){

    var textTerms = this.state.textTerms
    var term = encodeURIComponent(textTerms)

    fetch('https://api.spotify.com/v1/search?q='+term+'&type=album,artist,track,playlist&limit=4&offset=0', {
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

      this.setState({
        userSearchResult: responseJson,
      })

      AsyncStorage.setItem( '@GmixrStore:userSearchResult', JSON.stringify(responseJson) )
      AsyncStorage.setItem( '@GmixrStore:userSearchTerm', textTerms )

      this._processItems(responseJson)
      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getLastSearched(){

    AsyncStorage.getItem('@GmixrStore:userSearchResult', (err, res) => {
      if(res){
        this._processItems(JSON.parse(res))
      }else{
        SpotifyAuth.getToken((result)=>{

          if(result){

            this._fetchItems(result)

          }else{
            AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
              this._fetchItems(res)
            })

          }
        })

      }
      AsyncStorage.getItem('@GmixrStore:userSearchTerm', (err, res) => {
        if(res){
          this._setState(res)
        }
      })
    })

  }

  _choosePlaylist(playlist){
    this.props.choosePlaylist(playlist)
  }

  _setInput(active){

    this.setState({
      inputActive: active
    })

  }

  _setState(term){
    this.setState({
      textTerms: term
    })
  }

  _newSpotifyRequest(terms){

    this.setState({
      textTerms: terms,
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      searchData: []
    }, function(){

      SpotifyAuth.getToken((result)=>{

        if(result){

          this._fetchItems(result)

        }else{
          AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
            this._fetchItems(res)
          })
        }
      })

    })

  }

  _chooseTrack(track){
    this.props.chooseTrack(track)
  }

  _chooseArtist(playlist){
    this.props.chooseArtist(playlist)
  }

  _chooseAlbum(albums){
    this.props.chooseAlbum(albums)
  }

  _choosePlaylist(playlist){
    this.props.choosePlaylist(playlist)
  }


  render() {

    var vidHeight = (this.props.layoutProps.orientation == 'landscape') ? this.props.layoutProps.height : this.props.layoutProps.width*3/4

    return (
      <View style={{flexDirection: 'column'}}>
        <TextInput
          ref='Search'
          spellCheck={false}
          style={[styles.searchInput, {flex:-1}]}
          onFocus={() => this._setInput(true)}
          onBlur={() => this._setInput(false)}
          blurOnSubmit={true}
          keyboardType={'ascii-capable'}
          onChangeText={(text) => this._setState({textTerms: text})}
          onSubmitEditing={(event) => this._newSpotifyRequest(event.nativeEvent.text)}
          value={this.state.textTerms}
          removeClippedSubviews={true}
        />
    		<ListView
          style={[styles.listView, {top: 40, height: height - vidHeight - 94 - 40 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => {
            switch (rowData.type) {
              case 'playlist':
                return (
                  <PlaylistRow key={rowID} data={rowData} choosePlaylist={(playlist) => this._choosePlaylist(playlist)} />
                )
              case 'track':
                return (
                  <TrackRow key={rowID} data={rowData} chooseTrack={(track) => this._chooseTrack(track)} />
                )
              case 'album':
                return (
                  <AlbumRow key={rowID} data={rowData} chooseAlbum={(albums) => this._chooseAlbum(albums)} />
                )
              case 'artist':
                return (
                  <ArtistRow key={rowID} data={rowData} chooseArtist={(playlist) => this._chooseArtist(playlist)} />
                )
              case 'title':
                return (
                  <TitleRow key={rowID} data={rowData} />
                )
              default :
                null
            }
          }}
          enableEmptySections={true}  />
      </View>
    )
  }


  componentDidMount() {

    // IMPORTANT: HIDE IN RELEASE
    //AsyncStorage.removeItem('@GmixrStore:userSearchResult')

    this.props.events.addListener('userAquired', this._getLastSearched, this)

    if(this.props.userAquired){
      this._getLastSearched()
    }

    this.refs.Search.focus()

  }

}
