/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'

import {
  Text,
  TouchableHighlight,
  View,
  Dimensions,
} from 'react-native'

const {height, width} = Dimensions.get('window')


var styles = require('../style');


export default class TrackRow extends Component {
  constructor(props) {
    super(props)

    this._setTrack = this._setTrack.bind(this)

  }

  _setTrack(track){
    this.props.chooseTrack(track)
  }

  render() {

    return (
      <TouchableHighlight style={styles.row} onPress={() => this._setTrack(this.props.data)} activeOpacity={1} underlayColor="transparent">
        <View style={styles.flexRow}>
          <View>
            <Text style={[styles.listTitleText, {width: width - (56 + 8) }]} numberOfLines={1}>
              {this.props.data.name}
            </Text>
            <Text style={[styles.listDescText, {width: width - (56 + 8) }]} numberOfLines={1}>
              {this.props.data.artist + ' · ' + this.props.data.album}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
  componentDidMount() {

    
  }

}
