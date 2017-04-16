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
      total: 0
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
    var after = ''
    if(this.state.page > 0){
      after = '&after='+userArtists[userArtists.length-1].id
    }

    fetch('https://api.spotify.com/v1/me/following?type=artist&limit=50'+after, {
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

      this.setState({
        userArtists: merge,
        total: responseJson.artists.total
      })

      AsyncStorage.setItem( '@GmixrStore:artist', JSON.stringify(merge) )

      this._processArtists(merge)
      
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
        this._processArtists(JSON.parse(res))
      }else{
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
    })

  }

  _chooseArtist(playlist){
    this.props.chooseArtist(playlist)
  }

  _onEndReached(){

    var downloaded = this.state.page*50

    if(this.state.total >= downloaded){

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
    //AsyncStorage.removeItem('@GmixrStore:artist')

    this.props.events.addListener('userAquired', this._getUsersArtists, this)

    if(this.props.userAquired){
      this._getUsersArtists()
    }
  }
}
