/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'

import {
  Image,
  Text,
  View,
  TouchableHighlight
} from 'react-native'

import * as Animatable from 'react-native-animatable'


var styles = require('../style');


export default class MediaView extends Component {
  constructor(props) {
    super(props)

  }

  _setView(){
    this.props._setView(!this.props.mini)
  }

  render() {

    return (
		<View style={[styles.video, {height: this.props.vidHeight}]}>
		 <TouchableHighlight onPress={() => this._setView()} activeOpacity={1} underlayColor="transparent">

          <View>
			{(this.props.source != '') ? (
				<Image 
				  style={{width: this.props.layoutProps.width, height: this.props.vidHeight}}
				  source={this.props.source}
				  resizeMode='contain'
				/>
			) : (
				<View 
				  style={{width: this.props.layoutProps.width, height: this.props.vidHeight}}
				/>
			)}

			<View style={[styles.loader, {width:this.props.loaderWidth, opacity: this.props.loaderOpacity}]}></View>
			</View>
			</TouchableHighlight>
		</View>
    )
  }
  componentDidMount() {

    
  }

}
