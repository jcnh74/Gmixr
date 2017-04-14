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

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      userPlaylists: [],
      dataSource: ds.cloneWithRows([]),
    }
  }

  _processPlaylists(playlists){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    var mydata = []
    for(i = 0; i < playlists.length; i++){
      var imgArr = playlists[i].images
      var playlistImage = 'https://facebook.github.io/react/img/logo_og.png'

      if(typeof(imgArr) !== 'undefined' && imgArr.length){
        if(imgArr[imgArr.length - 1].url){
          playlistImage = imgArr[imgArr.length - 1].url
        }
      }
      //console.log(playlists)
      mydata.push({name:playlists[i].name, uri:playlists[i].uri, image:playlistImage, genres:playlists[i].genres, popularity: playlists[i].popularity})
    }

    this.setState({
      userPlaylists: playlists,
      dataSource: ds.cloneWithRows(mydata),
    })

  }

  // Get all the users Playlists
  _fetchPlaylists(bearer){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    fetch('https://api.spotify.com/v1/me/following?type=artist&limit=50', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer '+bearer
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {

      console.log(responseJson.artists.items)

      if(responseJson.error){
        return
      }
      var playlists = responseJson.artists.items
      AsyncStorage.setItem( '@GmixrStore:artist', JSON.stringify(playlists) )

      this._processPlaylists(playlists)
      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getUsersPlaylists(){

    AsyncStorage.getItem('@GmixrStore:artist', (err, res) => {
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

  _chooseArtist(playlist){
    this.props.chooseArtist(playlist)
  }


  render() {

    var vidHeight = (this.props.layoutProps.orientation == 'landscape') ? this.props.layoutProps.height : this.props.layoutProps.width*3/4

    return (
      <View>
    		<ListView
          style={[styles.listView, {top: 0, height: height - vidHeight - 94 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <ArtistRow key={rowID} data={rowData} chooseArtist={(playlist) => this._chooseArtist(playlist)} />} 
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
    //console.log(this.state.userPlaylists)


    this.props.events.addListener('userAquired', this._getUsersPlaylists, this)

    if(this.props.userAquired){
      this._getUsersPlaylists()
    }
    
  }

}
