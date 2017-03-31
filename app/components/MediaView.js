/**
 * Gmixr Native App
 * https://github.com/jcnh74/Gmixr
 * @flow
 */


import React, { Component } from 'react'

import {
  Image,
  Text,
  View
} from 'react-native'


var styles = require('../style');


export default class MediaView extends Component {
  constructor(props) {
    super(props)

  }

  render() {

    var vidHeight = (this.props.layoutProps.orientation == 'landscape') ? this.props.layoutProps.height : this.props.layoutProps.width*3/4

    return (
		<View style={styles.video}>
			{(this.props.source != '') ? (
				<Image 
				  style={{width: this.props.layoutProps.width, height: vidHeight}}
				  source={this.props.source}
				  resizeMode='contain'
				/>
			) : (
				<View 
				  style={{width: this.props.layoutProps.width, height: vidHeight}}
				/>
			)}

			<View style={[styles.loader, {width:this.props.loaderWidth, opacity: this.props.loaderOpacity}]}></View>
		</View>
    )
  }
  componentDidMount() {

    
  }

}
