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

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      dataSource: ds.cloneWithRows([]),
      currentPlaylist: {
        name: '',
        owner: '',
        total: '',
        image: '',
        playlist: [],
      }
    }
  }

  _processAlbums(tracks){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    var mydata = []
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



    this.setState({
      dataSource: ds.cloneWithRows(mydata),
    })

  

    // this.setState({
    //   currentPlaylist: {
    //     name: playlists[0].name,
    //     owner: playlists[0].owner.id,
    //     total: 1,
    //     image: playlistImage,
    //     playlist: playlists[0]
    //   }
    // })

  }

  // Get all the users Playlists
  _fetchAlbums(bearer){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
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
      //console.log(responseJson.items)

      var tracks = responseJson.items

      AsyncStorage.setItem( '@GmixrStore:tracks', JSON.stringify(tracks) )

      this._processAlbums(tracks)
      
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


  render() {

    var vidHeight = (this.props.layoutProps.orientation == 'landscape') ? this.props.layoutProps.height : this.props.layoutProps.width*3/4

    return (
      <View>
    		<ListView
          style={[styles.listView, {top: 0, height: height - vidHeight - 94 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <AlbumRow key={rowID} data={rowData} chooseAlbum={(albums) => this._chooseAlbum(albums)} />} 
          enableEmptySections={true}  />
      </View>
    )
  }

  componentWillReceiveProps(nextProps) {
    // if(nextProps.userAquired){
    //   //this._getUsersPlaylists()
    // }
  }
  componentDidMount() {


    this.props.events.addListener('userAquired', this._getUsersAlbums, this)

    if(this.props.userAquired){
      this._getUsersAlbums()
    }
    
  }

}
