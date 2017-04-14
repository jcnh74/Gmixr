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


export default class AlbumRow extends Component {
  constructor(props) {
    super(props)

    this._setAlbum = this._setAlbum.bind(this)

  }

  _setAlbum(playlist){
    this.props.chooseAlbum(playlist)
  }

  render() {

    return (
      <TouchableHighlight style={styles.row} onPress={() => this._setAlbum(this.props.data)} activeOpacity={1} underlayColor="transparent">
        <View style={styles.flexRow}>
          <View>
            {(this.props.data.image != '') ? (
              <Image style={styles.playlistThumbnail} source={{ uri: this.props.data.image}} />
            ) : (
              <View style={styles.playlistThumbnail} />
            )}
          </View>
          <View>
            <Text style={[styles.listTitleText, {width: width - (56 + 8) }]} numberOfLines={1}>
              {this.props.data.name}
            </Text>
            <Text style={[styles.listDescText, {width: width - (56 + 8) }]} numberOfLines={1}>
              {this.props.data.artist}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
  componentDidMount() {

    
  }

}
