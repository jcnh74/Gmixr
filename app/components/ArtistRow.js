/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'

import {
  Image,
  Text,
  TouchableHighlight,
  View,
  Dimensions,
} from 'react-native'

const {height, width} = Dimensions.get('window')


var styles = require('../style');


export default class ArtistRow extends Component {
  constructor(props) {
    super(props)

    this._setArtist = this._setArtist.bind(this)

  }

  _setArtist(artist){
    this.props.chooseArtist(artist)
  }

  render() {

    return (
      <TouchableHighlight style={styles.row} onPress={() => this._setArtist(this.props.data)} activeOpacity={1} underlayColor="transparent">
        <View style={styles.flexRow}>
          <View>
            <View style={{width: 48, height:48, borderRadius: 24, overflow: 'hidden'}}>
              {(this.props.data.image != '') ? (
                <Image style={styles.playlistThumbnail} source={{ uri: this.props.data.image}} />
              ) : (
                <View style={styles.playlistThumbnail} />
              )}
            </View>
          </View>
          <View style={{marginLeft:8}}>
            <Text style={[styles.listTitleText, {width: width - (56 + 8) }]} numberOfLines={1}>
              {this.props.data.name}
            </Text>
            <Text style={[styles.listDescText, {width: width - (56 + 8) }]} numberOfLines={1}>
              {'following'}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
  componentDidMount() {

    
  }

}
