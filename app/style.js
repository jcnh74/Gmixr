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
    bottom:50,
    overflow: 'hidden'
  },
  controlView: {
    position: 'absolute',
    top:0,
    left:0,
    right:0,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    height:4,
    alignSelf:'flex-start',
    backgroundColor: blue
  },
  flexColumn: {
    flex: 1,
    flexDirection:'column',
  },
  flexRow: {
    flex: 1,
    flexDirection:'row',
  },
  termInput: {
    padding:0,
    height: 0, 
    overflow: 'hidden',
    backgroundColor:'rgba(0,0,0,0.2)'
  },
  searchInput: {
    position:'absolute',
    top:0,
    left:0,
    right:0,
    padding:10,
    color:'white',
    height: 48,
    fontSize: 16,
    lineHeight:24,

  },
  miniControls: {
    flex: 1,
    flexDirection:'row',
    height:42
  },
  miniButton: {
    flex:-1,
    justifyContent: 'center',
    alignItems: 'center',
    width:36,
    height:36,
    marginTop: 4,
  },
  miniPlayerTrack: {
    position: 'absolute',
    top:0,
    left:0,
    right:0,
    height:2,
    backgroundColor:darkgray
  },
  miniPlayerTrackProgress: {
    position: 'absolute',
    top:0,
    bottom:0,
    left:0,
    width:0,
    alignSelf:'flex-start',
    backgroundColor:'white'
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
    padding:10,
  },
  giphyButton:{
    justifyContent: 'center',
    alignItems: 'center',
    width:120,
    height:32,
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
  mediumTextMini: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 0,
    color: 'white',
    backgroundColor: 'transparent',
  },
  monoText: {
    fontSize: 12,
    textAlign: 'center',
    color: 'rgb(160,160,160)',
    fontFamily: 'Avenir Next',
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
  marqueeViewMini: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    height:18,
    marginTop: 4,
    marginBottom: 0,
  },
  marqueeLabel: {
    flexGrow: 1,
    height:30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width:width - 100,
    color:'white',
  },
  marqueeLabelMini: {
    flexGrow: 1,
    height:30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width:width - 100,
    color:'white',
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
  marqueeTextMini: {
    flexGrow: 1,
    lineHeight:18,
    height:18,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: 'transparent',
    width:width - 100,
    fontSize:15,
    fontWeight:'500',
    color:'#FFF',
  },
  bottomBar: {
    flex: 1,
    flexDirection:'row',
    position: 'absolute',
    width: width,
    height: 50,
    paddingBottom:4,
    paddingTop: 4,
    bottom: 0,
    left: 0,
    backgroundColor:'rgba(0,0,0,0.3)'
  },
  tabText: {
    color:'#FFF',
    fontSize: 11
  },
  tabItem: {
    flex: 1,
    width: width/5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width:36, 
    height: 36, 
    borderRadius: 18,
    marginRight: 20,
  },
  row: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    height:56,
  },
  slimrow: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    height:24,    
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
    backgroundColor: 'transparent',
  },
  listDescText: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    color: 'white',
  },

})
