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


export default class PlaylistRow extends Component {
  constructor(props) {
    super(props)

    this._setLibrary = this._setLibrary.bind(this)

  }

  _setLibrary(playlist){
    this.props.chooseLibraryItem(playlist)
  }

  render() {

    // onPress={() => this._setLibrary(this.props.data)}

    return (
      <View>
        <TouchableHighlight style={styles.row} activeOpacity={1} underlayColor="transparent">
          <View style={styles.flexRow}>
            <View>
              <Image style={styles.playlistThumbnail} source={{ uri: this.props.data.image}} />
            </View>
            <View>
              <Text style={[styles.listTitleText, {width: width - (56 + 8) }]} numberOfLines={1}>
                {this.props.data.name}
              </Text>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
  componentDidMount() {

    
  }

}
