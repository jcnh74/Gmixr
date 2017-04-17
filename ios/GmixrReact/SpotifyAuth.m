//
//  SpotifyAuth.m
//  spotifyModule
//
//  Created by Jack on 8/8/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "AppDelegate.h"

#import <SpotifyAuthentication/SpotifyAuthentication.h>
#import <SpotifyAudioPlayback/SpotifyAudioPlayback.h>
#import <SpotifyMetadata/SpotifyMetadata.h>

#import "SpotifyAuth.h"
#import "EventManager.h"

#import <AVFoundation/AVFoundation.h>


#import <SafariServices/SafariServices.h>
#import <WebKit/WebKit.h>
#import "WebViewController.h"

#import "Config.h"


@interface SpotifyAuth () <SFSafariViewControllerDelegate, WebViewControllerDelegate, SPTAudioStreamingDelegate, SPTAudioStreamingPlaybackDelegate>

@property (nonatomic, strong) SPTSession *session;
@property (nonatomic, strong) SPTAudioStreamingController *player;
@property (nonatomic, strong) NSString *clientID;
@property (nonatomic, strong) NSArray *requestedScopes;

@property (atomic, readwrite) UIViewController *authViewController;
@property (atomic, readwrite) BOOL firstLoad;
@property (atomic, readwrite) BOOL loggedIn;
@property (atomic, readwrite) BOOL didChangeMetadata;
@property (nonatomic) BOOL isChangingProgress;
@property (nonatomic) BOOL didChangePlaybackStatus;


@end

@implementation SpotifyAuth

RCT_EXPORT_MODULE()





//Logout from Spotify
RCT_EXPORT_METHOD(setNotifications)
{
  
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sessionUpdatedNotification:) name:@"sessionUpdated" object:nil];

}

//Start Auth process
RCT_EXPORT_METHOD(startAuth:(RCTResponseSenderBlock)block)
{
  
  NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
  
  NSArray *requestedScopes = @[@"streaming", @"playlist-read-private", @"playlist-modify-public", @"user-follow-modify", @"user-follow-read", @"user-library-read", @"user-library-modify", @"user-read-private", @"user-read-birthdate", @"user-read-email"];
  SpotifyAuth *sharedManager = [SpotifyAuth sharedManager];
  //set the sharedManager properties
  [sharedManager setClientID:@kClientId];
  [sharedManager setRequestedScopes:requestedScopes];
  [sharedManager setMyScheme:@kCallbackURL];
  
  //Observer for successful login
  [notificationCenter addObserverForName:@"loginRes" object:nil queue:nil usingBlock:^(NSNotification *notification)
   {
     //if there is an error key in the userInfo dictionary send the error, otherwise null
//     if(notification.userInfo[@"error"] != nil){
//       block(@[notification.userInfo[@"error"]]);
//     } else {
//       block(@[[NSNull null]]);
//
//     }
     NSString *token = [notification object];
     NSLog(@"addObserverForName loginRes token:  %@",token);

     if(token != nil){
       block(@[token]);
       [self showPlayer];
     } else {
       block(@[[NSNull null]]);
     }
     
   }];
  
  [self startAuth:@kClientId setRedirectURL:@kCallbackURL setRequestedScopes:requestedScopes];
  
}




#pragma mark - Auth Methods

/////////////////////////////////
////  Auth Methods
/////////////////////////////////

// Notification to update session
- (void)sessionUpdatedNotification:(NSNotification *)notification
{
  SPTAuth *auth = [SPTAuth defaultInstance];

  AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
  [delegate.window.rootViewController dismissViewControllerAnimated:YES completion:nil];
  
  
  if (auth.session && [auth.session isValid]) {
    NSString *token = [auth.session accessToken];

    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

    [notificationCenter postNotificationName:@"loginRes" object:token];
    [notificationCenter removeObserver:self name:@"loginRes" object:nil];
    
  } else {
    NSLog(@"*** Failed to log in");
  }
}

- (void)showPlayer
{
   NSDictionary* userInfo = @{@"object": @"showPlayer"};
   [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
}



- (BOOL)startAuth:(NSString *) clientID setRedirectURL:(NSString *) redirectURL setRequestedScopes:(NSArray *) requestedScopes {
  NSMutableArray *scopes = [NSMutableArray array];
  //Turn scope arry of strings into an array of SPTAuth...Scope objects
  //playlist-read-private playlist-modify-public user-follow-modify user-follow-read user-library-read user-library-modify user-read-private user-read-birthdate user-read-email
  for (int i = 0; i < [requestedScopes count]; i++) {
    if([requestedScopes[i]  isEqual: @"playlist-read-private"]){
      [scopes addObject: SPTAuthPlaylistReadPrivateScope];
    } else if([requestedScopes[i]  isEqual: @"playlist-modify-private"]){
      [scopes addObject: SPTAuthPlaylistModifyPrivateScope];
    } else if([requestedScopes[i]  isEqual: @"playlist-modify-public"]){
      [scopes addObject: SPTAuthPlaylistModifyPublicScope];
    } else if([requestedScopes[i]  isEqual: @"user-follow-modify"]){
      [scopes addObject: SPTAuthUserFollowModifyScope];
    } else if([requestedScopes[i]  isEqual: @"user-follow-read"]){
      [scopes addObject: SPTAuthUserFollowReadScope];
    } else if([requestedScopes[i]  isEqual: @"user-library-read"]){
      [scopes addObject: SPTAuthUserLibraryReadScope];
    } else if([requestedScopes[i]  isEqual: @"user-library-modify"]){
      [scopes addObject: SPTAuthUserLibraryModifyScope];
    } else if([requestedScopes[i]  isEqual: @"user-read-private"]){
      [scopes addObject: SPTAuthUserReadPrivateScope];
    } else if([requestedScopes[i]  isEqual: @"user-read-birthdate"]){
      [scopes addObject: SPTAuthUserReadBirthDateScope];
    } else if([requestedScopes[i]  isEqual: @"user-read-email"]){
      [scopes addObject: SPTAuthUserReadEmailScope];
    } else if([requestedScopes[i]  isEqual: @"streaming"]){
      [scopes addObject: SPTAuthStreamingScope];
    }
  }
  
  NSLog(@"requestedScopes: %@",scopes);
  
  [[SPTAuth defaultInstance] setClientID:clientID];
  [[SPTAuth defaultInstance] setRedirectURL:[NSURL URLWithString:redirectURL]];
  [[SPTAuth defaultInstance] setRequestedScopes:scopes];
  
  [self openLoginPage];
  
  return YES;
}

- (void)openLoginPage
{
  
  SPTAuth *auth = [SPTAuth defaultInstance];
  NSLog(@"auth spotifyWebAuthenticationURL %@",[auth spotifyWebAuthenticationURL]);
  
  if ([SPTAuth supportsApplicationAuthentication]) {
    [[UIApplication sharedApplication] openURL:[auth spotifyAppAuthenticationURL]];
    
  } else {
    
    self.authViewController = [self authViewControllerWithURL:[auth spotifyWebAuthenticationURL]];
    AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    [delegate.window.rootViewController presentViewController: self.authViewController animated:YES completion:nil];
    
  }
  
//  self.authViewController = [self authViewControllerWithURL:[auth spotifyWebAuthenticationURL]];
//  AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
//  [delegate.window.rootViewController presentViewController: self.authViewController animated:YES completion:nil];
  
}

- (void)renewTokenAndShowPlayer
{
  SPTAuth *auth = [SPTAuth defaultInstance];
  
  [auth renewSession:auth.session callback:^(NSError *error, SPTSession *session) {
    auth.session = session;
    
    if (error) {
      
      //Refreshing token failed.
      NSDictionary* userInfo = @{@"object": error};
      [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
      
      NSLog(@"*** Error renewing session: %@", error);
      return;
    }
    [self showPlayer];
  }];
}


- (void)renewToken
{
  
  SPTAuth *auth = [SPTAuth defaultInstance];
  
  [auth renewSession:auth.session callback:^(NSError *error, SPTSession *session) {
    auth.session = session;
    
    if (error) {
      
      NSLog(@"*** Error renewing session: %@", error);
      return;
    }
    
    AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    [delegate.window.rootViewController dismissViewControllerAnimated:YES completion:nil];
    
    [self showPlayer];
    
  }];
}



//Returns true when SPTAudioStreamingController is initialized, otherwise false
RCT_EXPORT_METHOD(renewToken:(RCTResponseSenderBlock)block)
{
  NSLog(@"renewToken");
  SPTAuth *auth = [SPTAuth defaultInstance];
  
  [auth renewSession:auth.session callback:^(NSError *error, SPTSession *session) {
    auth.session = session;
    
    if (error) {
      
      NSLog(@"*** Error renewing session: %@", error);
      return;
    }
    
    NSString *token = [auth.session accessToken];
    
    if(token){
      block(@[token]);
    }else{
      block(@[@""]);
    }
    
    [self handleNewSession];
    
  }];
  
}

//Returns true when SPTAudioStreamingController is initialized, otherwise false
RCT_EXPORT_METHOD(getToken:(RCTResponseSenderBlock)block)
{
  NSString *token = [[[SpotifyAuth sharedManager] session] accessToken];
  if(token){
    block(@[token]);
  }else{
    block(@[@""]);
  }
  
}

//Returns true when SPTAudioStreamingController is initialized, otherwise false
RCT_EXPORT_METHOD(loginWithToken:(NSString *)token callback:(RCTResponseSenderBlock)block)
{
  SpotifyAuth *sharedManager = [SpotifyAuth sharedManager];
  [[sharedManager player] loginWithAccessToken:token];
  
  block(@[token]);
  
}


//Returns true when SPTAudioStreamingController is initialized, otherwise false
RCT_EXPORT_METHOD(getStatus:(RCTResponseSenderBlock)block)
{
  
  SPTAuth *auth = [SPTAuth defaultInstance];
  // Uncomment to turn off native/SSO/flip-flop login flow
  //auth.allowNativeLogin = NO;
  
  // Check if we have a token at all
  if (auth.session == nil) {
    block(@[@"NoSession"]);
    return;
  }
  
  // Check if it's still valid
  if ([auth.session isValid] && self.firstLoad) {
    // It's still valid, show the player.
    block(@[@"Success"]);
    [self showPlayer];
    return;
  }
  
  // Oh noes, the token has expired, if we have a token refresh service set up, we'll call tat one.
  if (auth.hasTokenRefreshService) {
    block(@[@"Token expired"]);
    //[self checkSession];
    [self renewTokenAndShowPlayer];
    return;
  }

}

- (UIViewController *)authViewControllerWithURL:(NSURL *)url
{
  UIViewController *viewController;
  if ([SFSafariViewController class]) {
    SFSafariViewController *safari = [[SFSafariViewController alloc] initWithURL:url];
    safari.delegate = self;
    viewController = safari;
  } else {
    WebViewController *webView = [[WebViewController alloc] initWithURL:url];
    webView.delegate = self;
    viewController = [[UINavigationController alloc] initWithRootViewController:webView];
  }
  viewController.modalPresentationStyle = UIModalPresentationPageSheet;
  return viewController;
}

/////////////////////////////////
////  SPTAudioStreamingController Props
/////////////////////////////////


//Returns true when SPTAudioStreamingController is initialized, otherwise false
RCT_EXPORT_METHOD(initialized:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([sharedIn initialized])]);
}

//Returns true if the receiver is logged into the Spotify service, otherwise false
RCT_EXPORT_METHOD(loggedIn:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([sharedIn loggedIn])]);
}

//Returns true if the receiver is playing audio, otherwise false
RCT_EXPORT_METHOD(isPlaying:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([[sharedIn playbackState] isPlaying])]);
}

//Returns true if the receiver is playing audio, otherwise false
RCT_EXPORT_METHOD(isRepeating:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([[sharedIn playbackState] isRepeating])]);
}

//Returns true if the receiver is playing audio, otherwise false
RCT_EXPORT_METHOD(isShuffling:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([[sharedIn playbackState] isShuffling])]);
}

//Returns the volume, as a value between 0.0 and 1.0.
RCT_EXPORT_METHOD(volume:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([sharedIn volume])]);
}


//Returns the current approximate playback position of the current track
RCT_EXPORT_METHOD(currentPlaybackPosition:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([[sharedIn playbackState] position])]);
}

//Returns the length of the current track
RCT_EXPORT_METHOD(currentTrackDuration:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([[[sharedIn metadata] currentTrack] duration])]);

}

//Returns the current track URI, playing or not
RCT_EXPORT_METHOD(currentTrackURI:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  NSLog(@"self.player.metadata.currentTrack: %@",[[[sharedIn metadata] currentTrack] uri]);
  NSString *uri = [[[sharedIn metadata] currentTrack] uri];

  if(uri){
    block(@[uri]);
  }else{
    block(@[@""]);
  }

}

//Returns the current track URI, playing or not
RCT_EXPORT_METHOD(nextTrackURI:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  NSLog(@"self.player.metadata.nextTrack: %@",[[[sharedIn metadata] nextTrack] uri]);
  NSString *uri = [[[sharedIn metadata] nextTrack] uri];

  if(uri){
    block(@[uri]);
  }else{
    block(@[@""]);
  }
}

//Returns the current track URI, playing or not
RCT_EXPORT_METHOD(previousTrackURI:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  NSLog(@"self.player.metadata.prevTrack: %@",[[[sharedIn metadata] prevTrack] uri]);
  NSString *uri = [[[sharedIn metadata] prevTrack] uri];

  if(uri){
    block(@[uri]);
  }else{
    block(@[@""]);
  }
}

//Returns the currenly playing track index
RCT_EXPORT_METHOD(currentTrackIndex:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([[[sharedIn metadata] currentTrack] indexInContext])]);
}

//Returns the current streaming bitrate the receiver is using
RCT_EXPORT_METHOD(targetBitrate:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  block(@[@([sharedIn targetBitrate])]);
}

///-----------------------------
/// Methods
///-----------------------------


//Logout from Spotify
RCT_EXPORT_METHOD(logout)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  SpotifyAuth *sharedManager = [SpotifyAuth sharedManager];
  [sharedManager setSession:nil];
  [sharedIn logout];
}

//Set playback volume to the given level. Volume is a value between `0.0` and `1.0`.
RCT_EXPORT_METHOD(setVolume:(CGFloat)volume callback:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn setVolume:volume callback:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//Set the target streaming bitrate. 0 for low, 1 for normal and 2 for high
RCT_EXPORT_METHOD(setTargetBitrate:(NSInteger)bitrate callback:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn setTargetBitrate:bitrate callback:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//Seek playback to a given location in the current track (in secconds).
RCT_EXPORT_METHOD(seekTo:(CGFloat)offset callback:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn seekTo:offset callback:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//Set the "playing" status of the receiver. Pass true to resume playback, or false to pause it.
RCT_EXPORT_METHOD(setIsPlaying:(BOOL)playing callback:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn setIsPlaying: playing callback:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}


//Play a Spotify URI.
RCT_EXPORT_METHOD(playSpotifyURI:(NSString *)uri startingWithIndex:(NSUInteger)index startingWithPosition:(NSTimeInterval)position callback:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn playSpotifyURI:uri startingWithIndex:index startingWithPosition:position callback:^(NSError *error) {
    NSLog(@"playSpotifyURI: %@", uri);
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      NSLog(@"playSpotifyURI ERROR: %@", error);
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//Queue a Spotify URI.
RCT_EXPORT_METHOD(queueURI:(NSString *)uri callback:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn queueSpotifyURI:uri callback:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//Go to the next track in the queue
RCT_EXPORT_METHOD(skipNext:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn skipNext:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//Go to the previous track in the queue
RCT_EXPORT_METHOD(skipPrevious:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn skipPrevious:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//setShuffle
RCT_EXPORT_METHOD(setShuffle:(BOOL *)enable callback:(RCTResponseSenderBlock)block)
{
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  [sharedIn setShuffle:enable callback:^(NSError *error) {
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

//setRepeat
RCT_EXPORT_METHOD(setRepeat:(BOOL *)mode callback:(RCTResponseSenderBlock)block)
{
  
  SPTAudioStreamingController *sharedIn = [SPTAudioStreamingController sharedInstance];
  
  SPTRepeatMode newmode = SPTRepeatOff;
  if(mode){
    newmode = SPTRepeatContext;
  }
  
  [sharedIn setRepeat:newmode callback:^(NSError *error) {
    
    if(error == nil){
      block(@[[NSNull null]]);
    }else{
      block(@[error]);
      [self checkSession];
    }
    return;
  }];
}

RCT_EXPORT_METHOD(componentWillUnmount:(RCTResponseSenderBlock)block)
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:@"LoggedIn" object:nil];
  block(@[@"NSNotificationCenter LoggedIn removed"]);
}


/////////////////////////////////
////  END SPTAudioStreamingController
/////////////////////////////////


#pragma mark - Search Spotify Methods

/////////////////////////////////
////  Search
/////////////////////////////////



//Performs a search with a given query, offset and market filtering, returns an Array filled with json Objects
/*
 */
RCT_EXPORT_METHOD(performSearchWithQuery:(NSString *)searchQuery
                  queryType:(NSString *)searchQueryType
                  offset:(NSInteger)offset
                  market:(NSString *)market
                  callback:(RCTResponseSenderBlock)block)
{
  SPTSearchQueryType parm;
  //set the SPTSearchQueryType depending on searchQueryType
  if ([searchQueryType  isEqual: @"track"]){
    parm = SPTQueryTypeTrack;
  } else if ([searchQueryType  isEqual: @"artist"]){
    parm = SPTQueryTypeArtist;
  } else if ([searchQueryType  isEqual: @"album"]){
    parm = SPTQueryTypeAlbum;
  } else if ([searchQueryType  isEqual: @"playList"]){
    parm = SPTQueryTypePlaylist;
  }
  
  [SPTSearch performSearchWithQuery:searchQuery queryType:parm offset:offset accessToken:[[[SpotifyAuth sharedManager] session] accessToken] market:market callback:^(NSError *error, id object) {
    
    NSMutableDictionary *resObj = [NSMutableDictionary dictionary];
    NSMutableArray *resArr = [NSMutableArray array];
    for (int i; i < [[object items] count]; i++){
      SPTPartialArtist *temp = (SPTPartialArtist *)[object items][i];
      resObj[[temp name]] = [temp decodedJSONObject];
      [resArr addObject:[temp decodedJSONObject]];
    }
    NSLog(@"ret %@ ret", [object nextPageURL]);
    block(@[[NSNull null],resArr]);
    return;
  }];
  
}


#pragma mark - Streaming Events From Spotify

/////////////////////////////////
////  Streaming Events From Spotify
/////////////////////////////////

- (void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didReceiveMessage:(NSString *)message {
  
  NSString *mymessage = [NSString stringWithFormat:@"didReceiveMessage: %@", message];
  NSDictionary* userInfo = @{@"object": @[mymessage]};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
  
  UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"Message from Spotify"
                                                      message:message
                                                     delegate:nil
                                            cancelButtonTitle:@"OK"
                                            otherButtonTitles:nil];
  [alertView show];
}

- (void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didChangePlaybackStatus:(BOOL)isPlaying {
  
  NSString *message = [NSString stringWithFormat:@"is playing = %d", isPlaying];
  NSLog(@"%@", message);
  
  NSDictionary* userInfo = @{@"object": @"didChangePlaybackStatus"};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
  
  if (isPlaying) {
    [self activateAudioSession];
  } else {
    [self deactivateAudioSession];
  }
}

-(void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didChangeMetadata:(SPTPlaybackMetadata *)metadata {
  
  self.didChangeMetadata = YES;
  NSLog(@"%@", metadata);
  NSString *mymetadata = [NSString stringWithFormat:@"didChangeMetadata: %@",[[metadata currentTrack] uri]];
  NSDictionary* userInfo = @{@"object": @[mymetadata]};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];

}

-(void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didReceivePlaybackEvent:(SpPlaybackEvent)event withName:(NSString *)name {
  
  NSString *message = [NSString stringWithFormat:@"didReceivePlaybackEvent: %zd %@", event, name];
  NSLog(@"%@", message);
  
  NSLog(@"isPlaying=%d isRepeating=%d isShuffling=%d isActiveDevice=%d positionMs=%f",
        self.player.playbackState.isPlaying,
        self.player.playbackState.isRepeating,
        self.player.playbackState.isShuffling,
        self.player.playbackState.isActiveDevice,
        self.player.playbackState.position);
  
  NSString *mymessage = [NSString stringWithFormat:@"didReceivePlaybackEvent: %@", message];
  NSDictionary* userInfo = @{@"object": @[mymessage]};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
}

- (void)audioStreamingDidLogout:(SPTAudioStreamingController *)audioStreaming {
  NSDictionary* userInfo = @{@"object": @"audioStreamingDidLogout"};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
  [self closeSession];
}

- (void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didReceiveError:(NSError* )error {
  NSLog(@"didReceiveError: %zd %@", error.code, error.localizedDescription);
  
  if (error.code == SPErrorNeedsPremium) {
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Premium account required" message:@"Premium account is required to showcase application functionality. Please login using premium account." preferredStyle:UIAlertControllerStyleAlert];
    [alert addAction:[UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:^(UIAlertAction* action){
      [self closeSession];
    }]];
    
    NSDictionary* userInfo = @{@"object": @"SPErrorNeedsPremium"};
    [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
    
  }
  
  NSString *mymessage = [NSString stringWithFormat:@"didReceiveError: %@", error.localizedDescription];
  NSDictionary* userInfo = @{@"object": @[mymessage]};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
  
}

- (void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didChangePosition:(NSTimeInterval)position {
  if (self.isChangingProgress) {
    //TODO
    NSString *mymessage = [NSString stringWithFormat: @"didChangePosition: %f", position];
    NSDictionary* userInfo = @{@"object": @[mymessage]};
    [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
    return;
  }
}

- (void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didStartPlayingTrack:(NSString *)trackUri {
  NSLog(@"Starting %@", trackUri);
  NSLog(@"Source %@", self.player.metadata.currentTrack.playbackSourceUri);
  // If context is a single track and the uri of the actual track being played is different
  // than we can assume that relink has happended.
  BOOL isRelinked = [self.player.metadata.currentTrack.playbackSourceUri containsString: @"spotify:track"]
  && ![self.player.metadata.currentTrack.playbackSourceUri isEqualToString:trackUri];
  NSLog(@"Relinked %d", isRelinked);
  
  NSString *mymessage = [NSString stringWithFormat: @"didStartPlayingTrack: %@", trackUri];
  NSDictionary* userInfo = @{@"object": @[mymessage]};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
}

- (void)audioStreaming:(SPTAudioStreamingController *)audioStreaming didStopPlayingTrack:(NSString *)trackUri {
  NSLog(@"Finishing: %@", trackUri);
  
  NSString *mymessage = [NSString stringWithFormat: @"didStopPlayingTrack: %@", trackUri];
  NSDictionary* userInfo = @{@"object": @[mymessage]};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
}

- (void)audioStreamingDidLogin:(SPTAudioStreamingController *)audioStreaming {
  NSLog(@"audioStreamingDidLogin");
  self.loggedIn = YES;
  
  NSDictionary* userInfo = @{@"object": @"audioStreamingDidLogin"};
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EventFromSpotify" object:nil userInfo:userInfo];
}

/////////////////////////////////
////  Web Controller Delegates
/////////////////////////////////

#pragma mark WebViewControllerDelegate

- (void)webViewControllerDidFinish:(WebViewController *)controller
{
  // User tapped the close button. Treat as auth error
}

- (void)safariViewControllerDidFinish:(SFSafariViewController *)controller
{
  // User tapped the close button. Treat as auth error
}

#pragma mark Session Methods

/////////////////////////////////
////  Session Methods
/////////////////////////////////

-(void)handleNewSession {
  
  SPTAuth *auth = [SPTAuth defaultInstance];
  
  if (self.player == nil) {
    NSError *error = nil;
    NSLog(@"handleNewSession");
    self.player = [SPTAudioStreamingController sharedInstance];
    if ([self.player startWithClientId:auth.clientID audioController:nil allowCaching:NO error:&error]) {
      if(error){
        NSLog(@"error: %@",error);
        return;
      }
      self.player.delegate = self;
      self.player.playbackDelegate = self;
      self.player.diskCache = [[SPTDiskCache alloc] initWithCapacity:1024 * 1024 * 64];
      [self.player loginWithAccessToken:auth.session.accessToken];
      
      AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      [delegate.window.rootViewController dismissViewControllerAnimated:YES completion:nil];
      
    } else {
      self.player = nil;
      UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Error init" message:[error description] preferredStyle:UIAlertControllerStyleAlert];
      [alert addAction:[UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:nil]];
      //[self presentViewController:alert animated:YES completion:nil];
      [self closeSession];
    }
  }
}

- (void)closeSession {
  NSError *error = nil;
  if (![self.player stopWithError:&error]) {
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Error deinit" message:[error description] preferredStyle:UIAlertControllerStyleAlert];
    [alert addAction:[UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:nil]];
    //[self presentViewController:alert animated:YES completion:nil];
  }
  [SPTAuth defaultInstance].session = nil;
}


//Check if session is valid and renew it if not
-(void)checkSession{
  SpotifyAuth *sharedManager = [SpotifyAuth sharedManager];
  if (![[sharedManager session] isValid]){
    [[SPTAuth defaultInstance] renewSession:[sharedManager session] callback:^(NSError *error, SPTSession *session) {
      if(error != nil){
        NSLog(@"Error: %@", error);
        //launch the login again
        
        [sharedManager startAuth:sharedManager.clientID setRedirectURL:sharedManager.myScheme setRequestedScopes:sharedManager.requestedScopes];
      } else {
        [sharedManager setSession:session];
        [[sharedManager player] loginWithAccessToken:session.accessToken];
        
      }
    }];
  }
}

-(void)setSession:(SPTSession *)session{
  _session = session;
}

-(void)setMyScheme:(NSString *)myScheme{
  _myScheme = myScheme;
}

-(void)setClientID:(NSString *)clientID{
  _clientID = clientID;
}

-(void)setRequestedScopes:(NSArray *)requestedScopes{
  _requestedScopes = requestedScopes;
}

+ (id)sharedManager {
  static SpotifyAuth *sharedMyManager = nil;
  @synchronized(self) {
    if (sharedMyManager == nil)
      sharedMyManager = [[self alloc] init];
  }
  return sharedMyManager;
}

#pragma mark - Audio Session

- (void)activateAudioSession
{
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                         error:nil];
  [[AVAudioSession sharedInstance] setActive:YES error:nil];
}

- (void)deactivateAudioSession
{
  [[AVAudioSession sharedInstance] setActive:NO error:nil];
}


@end
