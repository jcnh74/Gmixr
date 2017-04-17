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
import ArtistRow from './ArtistRow'

// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth

var styles = require('../style');

const {height, width} = Dimensions.get('window')


export default class ArtistSelectView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      userArtists: [],
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      artistData: [],
      page: 0,
      total: 0,
      next: ''
    }
  }

  _processArtists(artists){

    var mydata = this.state.artistData

    for(i = 0; i < artists.length; i++){
      var imgArr = artists[i].images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[imgArr.length - 1].url){
          playlistImage = imgArr[imgArr.length - 1].url
        }
      }

      //console.log(artists)
      mydata.push({name:artists[i].name, uri:artists[i].uri, id: artists[i].id, image:playlistImage, genres:artists[i].genres, popularity: artists[i].popularity})
    }

    var page = this.state.page

    this.setState({
      albumsData: mydata,
      dataSource: this.state.dataSource.cloneWithRows(mydata),
      page: page + 1
    })
 

  }

  // Get all the users Playlists
  _fetchArtists(bearer){

    var offset = this.state.page * 50
    var userArtists = this.state.userArtists
    var url = ''
    if(this.state.page == 0){
      url = 'https://api.spotify.com/v1/me/following?type=artist&limit=50'
    }else{
      url = this.state.next
    }

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+bearer
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {


      var artists = responseJson.artists.items
      var merge = userArtists.concat(artists)

      if(responseJson.error){
        return
      }

      console.log(responseJson)

      this.setState({
        userArtists: merge,
        total: responseJson.artists.total,
        next: responseJson.artists.next
      }, function(){
        if(responseJson.artists.next !== null){
          
          AsyncStorage.setItem( '@GmixrStore:artistNext', responseJson.artists.next )
          AsyncStorage.setItem( '@GmixrStore:artist', JSON.stringify(merge) )

          this._processArtists(merge)
        }
      })
      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getUsersArtists(){

    AsyncStorage.getItem('@GmixrStore:artist', (err, res) => {
      if(res){
        AsyncStorage.getItem('@GmixrStore:artistNext', (error, next) => {
          this.setState({
            next: next
          }, function(){
            this._processArtists(JSON.parse(res))
          })
        })
      }else{

        if(this.state.next !== null){

          SpotifyAuth.getToken((result)=>{

            if(result){

              this._fetchArtists(result)

            }else{
              AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
                this._fetchArtists(res)
              })
            }
          })
        }
      }
    })

  }

  _chooseArtist(playlist){
    this.props.chooseArtist(playlist)
  }

  _onEndReached(){

    if(this.state.next !== null){

      SpotifyAuth.getToken((result)=>{

        if(result){

          this._fetchArtists(result)

        }else{
          AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
            this._fetchArtists(res)
          })
        }
      })
    }
  }

  render() {

    // AsyncStorage.removeItem('@GmixrStore:artist')
    // AsyncStorage.removeItem('@GmixrStore:artistNext')

    return (
      <View>
    		<ListView
          ref="listview"
          style={[styles.listView, {top: 0, height: height - this.props.vidHeight - 94 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <ArtistRow key={rowID} data={rowData} chooseArtist={(playlist) => this._chooseArtist(playlist)} />} 
          enableEmptySections={true}
          onEndReached={() => this._onEndReached()}
          onEndReachedThreshold={2000} />
      </View>
    )
  }

  componentDidMount() {

    // IMPORTANT: HIDE IN RELEASE
    // AsyncStorage.removeItem('@GmixrStore:artist')
    // AsyncStorage.removeItem('@GmixrStore:artistNext')

    this.props.events.addListener('userAquired', this._getUsersArtists, this)

    if(this.props.userAquired){
      this._getUsersArtists()
    }
  }
}
