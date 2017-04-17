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


export default class PlaylistSelectView extends Component {
  constructor(props) {
    super(props)

    //const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      userPlaylists: [],
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      playlistData: [],
      page: 0,
      total: 0
    }
  }

  _processPlaylists(playlists){

    var mydata = this.state.playlistData

    for(i = 0; i < playlists.length; i++){
      var imgArr = playlists[i].images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[0].url){
          playlistImage = imgArr[0].url
        }
      }
      //console.log(playlists)
      mydata.push({name:playlists[i].name, uri:playlists[i].uri, image:playlistImage, total:playlists[i].tracks.total, owner: playlists[i].owner.id})
    }

    var page = this.state.page

    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(mydata),
      playlistData: mydata,
      page: page + 1
    })

    var imgArr = playlists[0].images
    var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

    if(imgArr.length){
      playlistImage = imgArr[0].url
    }else if(typeof(this.props.currentUser.images) !== 'undefined' && this.props.currentUser.images.length){
      playlistImage = this.props.currentUser.images[0].url
    }

  }

  // Get all the users Playlists
  _fetchPlaylists(bearer){

    var offset = this.state.page * 50

    var userPlaylists = this.state.userPlaylists

    fetch('https://api.spotify.com/v1/users/'+this.props.currentUser.id+'/playlists?offset='+offset+'&limit=50', {
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
      var merge = userPlaylists.concat(playlists)

      this.setState({
        total: responseJson.total,
        userPlaylists: merge
      })

      AsyncStorage.setItem( '@GmixrStore:playlistsTotal', JSON.stringify(responseJson.total) )
      AsyncStorage.setItem( '@GmixrStore:playlists', JSON.stringify(merge) )

      this._processPlaylists(playlists)
      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getUsersPlaylists(){

    //AsyncStorage.removeItem('@GmixrStore:playlists')
    AsyncStorage.getItem('@GmixrStore:playlists', (err, res) => {
      if(res){
        AsyncStorage.getItem('@GmixrStore:playlistsTotal', (error, total) => {
          this.setState({
            total: parseInt(total)
          }, function(){
            this._processPlaylists(JSON.parse(res))
          })
        })
      }else{
        var downloaded = this.state.page*50

        if(this.state.total >= downloaded){

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
      }
    })
  }

  _choosePlaylist(playlist){
    this.props.choosePlaylist(playlist)
  }

  _onEndReached(){

    var downloaded = this.state.page*50

    if(this.state.total >= downloaded){

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
  }


  render() {

    // AsyncStorage.removeItem('@GmixrStore:playlists')
    // AsyncStorage.removeItem('@GmixrStore:playlistsTotal')

    return (
      <View>
    		<ListView
          ref="listview"
          style={[styles.listView, {top: 0, height: height - this.props.vidHeight - 94 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <PlaylistRow key={rowID} data={rowData} choosePlaylist={(playlist) => this._choosePlaylist(playlist)} />} 
          enableEmptySections={true}
          onEndReached={() => this._onEndReached()}
          onEndReachedThreshold={2000} />
      </View>
    )
  }

  componentDidMount() {

    // IMPORTANT: HIDE IN RELEASE
    AsyncStorage.removeItem('@GmixrStore:playlists')
    AsyncStorage.removeItem('@GmixrStore:playlistsTotal')

    this.props.events.addListener('userAquired', this._getUsersPlaylists, this)

    if(this.props.userAquired){
      this._getUsersPlaylists()
    }
    
  }

}
