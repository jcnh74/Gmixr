'use strict';

var React = require('react-native');

var {
  StyleSheet,
  Dimensions
} = React;

// Settings
const {height, width} = Dimensions.get('window')
const black = 'black'
const darkgray = 'rgb(20,20,20)'
const midgray = 'rgb(60,60,60)'
const blue = 'rgb(0,113,188)'
const green = '#84bd00'

module.exports = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: darkgray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0,
    opacity:0.2,
  },
  flex: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  backgroundView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionView: {
  	position:'absolute', 
    left:0,
    right:0,
    top:0,
    bottom:64,
    overflow: 'hidden'
  },
  controlView: {
	position: 'absolute',
    top:0,
    left:0,
    right:0,
    backgroundColor: 'transparent',
  },
  listView: {
    position:'absolute', 
    left:0,
    right:0,
    top:0,
    backgroundColor: 'transparent',
  },
  topPlayerView: {

  },
  video: {
    backgroundColor: black,
  },
  loader: {
    position: 'absolute',
    bottom:0,
    left:0,
    width:0,
    height:6,
    alignSelf:'flex-start',
    backgroundColor: blue
  },
  flexColumn: {
    flex: 1
  },
  flexRow: {
    flex: 1,
    flexDirection:'row',
  },
  termInput: {
    padding:0,
    color:'white',
    height: 0, 
    overflow: 'hidden',
    backgroundColor:'rgba(0,0,0,0.3)'

  },
  controls: {
    flex: 1,
    flexDirection:'row',
    paddingTop:40,
    paddingBottom:40,
  },
  smallButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width:48,
    height:48,
    marginTop:12,
    marginBottom:12,
    marginLeft:20,
    marginRight:20,
  },
  smallerButton:{
    justifyContent: 'center',
    alignItems: 'center',
    width:48,
    height:48,
    marginTop:12,
    marginBottom:12,
    marginLeft:0,
    marginRight:0,
  },
  largeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width:72,
    height:72,
    margin:0,
    borderRadius:36,
    borderWidth:1,
    borderColor:'white'
  },
  image: {
    width: 250,
    height: 50
  },
  mediumText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 10,
    color: 'white',
    backgroundColor: 'transparent',
  },
  monoText: {
    fontSize: 14,
    textAlign: 'center',
    margin: 10,
    color: 'white',
    fontFamily: 'Courier New',
    backgroundColor: 'transparent',

  },
  marqueeView: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    height:30,
    marginTop: 10,
    marginBottom: 0,
  },
  marqueeLabel: {
    flexGrow: 1,
    height:30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width:width - 100,
    color:'#FFF',
  },
  marqueeText: {
    flexGrow: 1,
    lineHeight:30,
    height:30,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: 'transparent',
    width:width - 100,
    fontSize:20,
    fontWeight:'500',
    color:'#FFF',
  },
  bottomBar: {
    flex: 1,
    flexDirection:'row',
    position: 'absolute',
    width: width,
    height: 64,
    paddingBottom:4,
    paddingTop: 4,
    bottom: 0,
    left: 0,
    backgroundColor:'rgba(0,0,0,0.3)'
  },
  avatar: {
    width:36, 
    height: 36, 
    borderRadius: 18,
    marginLeft: 10,
    marginRight: 0,
  },
  row: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    height:56,
  },
  playlistThumbnail: {
    width:48, 
    height: 48, 
    marginRight: 8,
    backgroundColor:'rgb(40,40,40)'
  },
  listTitleText: {
    fontSize:15,
    fontWeight:'500',
    color:'#FFF',
    marginTop: 4,
    marginBottom: 0,
  },
  listDescText: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    color: 'white',
  },

})
