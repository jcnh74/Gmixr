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
import TrackRow from './TrackRow'

// Native Modules
const SpotifyAuth = NativeModules.SpotifyAuth

var styles = require('../style');

const {height, width} = Dimensions.get('window')


export default class SongSelectView extends Component {
  constructor(props) {
    super(props)

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      userTracks: [],
      dataSource: ds.cloneWithRows([]),
    }
  }

  _processTracks(tracks){
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    var mydata = []
    for(i = 0; i < tracks.length; i++){

      //console.log(playlists)
      mydata.push({name:tracks[i].track.name, uri:tracks[i].track.uri, artist:tracks[i].track.artists[0].name, album:tracks[i].track.album.name})
    }

    this.setState({
      userTracks: tracks,
      dataSource: ds.cloneWithRows(mydata),
    })

  }

  // Get all the users Playlists
  _fetchTracks(bearer){
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
      var tracks = responseJson.items
      console.log(tracks)
      AsyncStorage.setItem( '@GmixrStore:tracks', JSON.stringify(tracks) )

      this._processTracks(tracks)
      
    })
    .catch((err) => {
      console.error(err)
    })
  }

  // If we can, respond to fetch function
  // TODO: May be able to bypass this function
  _getUsersTracks(){

    AsyncStorage.getItem('@GmixrStore:tracks', (err, res) => {
      if(res){
        this._processTracks(JSON.parse(res))
      }else{
        SpotifyAuth.getToken((result)=>{

          if(result){

            this._fetchTracks(result)

          }else{
            AsyncStorage.getItem('@GmixrStore:token', (err, res) => {
              this._fetchTracks(res)
            })

          }
        })

      }
    })

  }

  _chooseTrack(track){
    this.props._chooseTrack(track)
  }


  render() {

    var vidHeight = (this.props.layoutProps.orientation == 'landscape') ? this.props.layoutProps.height : this.props.layoutProps.width*3/4

    return (
      <View>
    		<ListView
          style={[styles.listView, {top: 0, height: height - vidHeight - 94 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <TrackRow key={rowID} data={rowData} chooseTrack={(track) => this._chooseTrack(track)} />} 
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


    this.props.events.addListener('userAquired', this._getUsersTracks, this)

    if(this.props.userAquired){
      this._getUsersTracks()
    }
    
  }

}
