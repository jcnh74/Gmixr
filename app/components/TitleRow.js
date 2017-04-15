/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'

import {
  Text,
  View,
  Dimensions,
} from 'react-native'

const {height, width} = Dimensions.get('window')


var styles = require('../style');


export default class TitleRow extends Component {
  constructor(props) {
    super(props)
  }


  render() {

    return (
      <View style={styles.row}>
        <View style={styles.flexRow}>
          <View style={{marginTop: 10}}>
            <Text style={[styles.listTitleText, {width: width, textAlign: 'center'}]} numberOfLines={1}>
              {this.props.data.name}
            </Text>
          </View>
        </View>
      </View>
    )
  }
}
