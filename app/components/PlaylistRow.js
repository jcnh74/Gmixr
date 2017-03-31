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

    this._setPlaylist = this._setPlaylist.bind(this)

  }

  _setPlaylist(playlist){
    this.props.choosePlaylist(playlist)
  }

  render() {

    return (
      <TouchableHighlight style={styles.row} onPress={() => this._setPlaylist(this.props.data.uri)} activeOpacity={1} underlayColor="transparent">
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
              {'by ' + this.props.data.owner + ' · ' + this.props.data.total + ' songs'}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
  componentDidMount() {

    
  }

}

// const Row = (props) => (
//       <TouchableHighlight style={styles.row} onPress={() => this._choosePlaylist(props.data.uri)} activeOpacity={1} underlayColor="transparent">
//         <View style={styles.flexRow}>
//           <Image style={styles.playlistThumbnail} source={{ uri: props.data.image}} />
//           <View>
//             <Text style={[styles.listTitleText, {width: listTextWidth }]} numberOfLines={1}>
//               {props.data.name}
//             </Text>
//             <Text style={[styles.listDescText, {width: listTextWidth }]} numberOfLines={1}>
//               {'by ' + props.data.owner + ' · ' + props.data.total + ' songs'}
//             </Text>
//           </View>
//         </View>
//       </TouchableHighlight>
//     )