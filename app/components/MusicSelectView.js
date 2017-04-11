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
import PlaylistRow from './PlaylistRow'

// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth

var styles = require('../style');

const {height, width} = Dimensions.get('window')


export default class MusicListView extends Component {
  constructor(props) {
    super(props)

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      userPlaylists: [],
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

  _processPlaylists(playlists){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    var mydata = []
    for(i = 0; i < playlists.length; i++){
      var imgArr = playlists[i].images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[0].url){
          playlistImage = imgArr[0].url
        }
      }
      console.log(playlists)
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
    }else if(typeof(this.props.currentUser.images) !== 'undefined' && this.props.currentUser.images.length){
      playlistImage = this.props.currentUser.images[0].url
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

  }

  // Get all the users Playlists
  _fetchPlaylists(bearer){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    fetch('https://api.spotify.com/v1/users/'+this.props.currentUser.id+'/playlists?limit=50', {
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
      AsyncStorage.setItem('@GmixrStore:playlists', JSON.stringify(playlists))

      this._processPlaylists(playlists)
      

      // var mydata = []
      // for(i = 0; i < playlists.length; i++){
      //   var imgArr = playlists[i].images
      //   var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      //   if(typeof(imgArr) !== 'undefined' && imgArr.length){
      //     if(imgArr[0].url){
      //       playlistImage = imgArr[0].url
      //     }
      //   }

      //   mydata.push({name:playlists[i].name, uri:playlists[i].uri, image:playlistImage, total:playlists[i].tracks.total, owner: playlists[i].owner.id})
      // }

      // this.setState({
      //   userPlaylists: playlists,
      //   dataSource: ds.cloneWithRows(mydata),
      // })

      // AsyncStorage.setItem('@GmixrStore:playlists', JSON.stringify(playlists))

      // var imgArr = playlists[0].images
      // var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      // if(imgArr.length){
      //   playlistImage = imgArr[0].url
      // }else if(typeof(this.props.currentUser.images) !== 'undefined' && this.props.currentUser.images.length){
      //   playlistImage = this.props.currentUser.images[0].url
      // }

      // this.setState({
      //   currentPlaylist: {
      //     name: playlists[0].name,
      //     owner: playlists[0].owner.id,
      //     total: playlists[0].tracks.total,
      //     image: playlistImage,
      //     playlist: playlists[0]
      //   }
      // })
      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getUsersPlaylists(){

    AsyncStorage.getItem('@GmixrStore:playlists', (err, res) => {
      if(res){
        this._processPlaylists(JSON.parse(res))
      }else{
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
    })

    
  }

  _choosePlaylist(playlist){
    this.props.choosePlaylist(playlist)
  }


  render() {

    var vidHeight = (this.props.layoutProps.orientation == 'landscape') ? this.props.layoutProps.height : this.props.layoutProps.width*3/4

    return (
      <View>
    		<ListView
          style={[styles.listView, {top: 0, height: height - vidHeight - 64 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <PlaylistRow key={rowID} data={rowData} choosePlaylist={(playlist) => this._choosePlaylist(playlist)} />} 
          enableEmptySections={true}  />
      </View>
    )
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.userAquired){
      this._getUsersPlaylists()
    }
  }
  componentDidMount() {
    console.log(this.state.userPlaylists)
    if(this.props.userAquired){
      this._getUsersPlaylists()
    }
    
  }

}
