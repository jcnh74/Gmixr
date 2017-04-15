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
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      tracksData: [],
      page: 0,
      total: 0
    }
  }

  _processTracks(tracks){

    var mydata = this.state.tracksData
    for(i = 0; i < tracks.length; i++){

      //console.log(playlists)
      mydata.push({name:tracks[i].track.name, uri:tracks[i].track.uri, artist:tracks[i].track.artists[0].name, album:tracks[i].track.album.name})
    }

    var page = this.state.page

    this.setState({
      tracksData: mydata,
      dataSource: this.state.dataSource.cloneWithRows(mydata),
      page: page + 1
    })


  }

  // Get all the users Playlists
  _fetchTracks(bearer){


    var offset = this.state.page * 50
    var userTracks = this.state.userTracks

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

      var tracks = responseJson.items
      var merge = userTracks.concat(tracks)

      this.setState({
        userTracks: merge,
        total: responseJson.total
      })

      AsyncStorage.setItem( '@GmixrStore:tracks', JSON.stringify(merge) )


      this._processTracks(merge)
      
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
    this.props.chooseTrack(track)
  }

  _onEndReached(){

    var downloaded = this.state.page*50

    if(this.state.total >= downloaded){

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
  }


  render() {

    var vidHeight = (this.props.layoutProps.orientation == 'landscape') ? this.props.layoutProps.height : this.props.layoutProps.width*3/4

    return (
      <View>
    		<ListView
          ref="listview"
          style={[styles.listView, {top: 0, height: height - vidHeight - 94 }]}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionID, rowID) => <TrackRow key={rowID} data={rowData} chooseTrack={(track) => this._chooseTrack(track)} />} 
          enableEmptySections={true}
          onEndReached={() => this._onEndReached()}
          onEndReachedThreshold={2000} />
      </View>
    )
  }

  componentDidMount() {

    // IMPORTANT: HIDE IN RELEASE
    //AsyncStorage.removeItem('@GmixrStore:tracks')

    this.props.events.addListener('userAquired', this._getUsersTracks, this)

    if(this.props.userAquired){
      this._getUsersTracks()
    }
    
  }

}
