/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"
#import <UIKit/UIKit.h>

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import <SpotifyAuthentication/SpotifyAuthentication.h>
#import <SpotifyMetadata/SpotifyMetadata.h>
#import <SpotifyAudioPlayback/SpotifyAudioPlayback.h>
#import "Config.h"


@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"GmixrReact"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [UIColor blackColor];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  [[UIApplication sharedApplication] setIdleTimerDisabled: YES];
  
  
SPTAuth *auth = [SPTAuth defaultInstance];
  auth.clientID = @kClientId;
  auth.requestedScopes = @[SPTAuthStreamingScope];
  auth.redirectURL = [NSURL URLWithString:@kCallbackURL];
#ifdef kTokenSwapServiceURL
  auth.tokenSwapURL = [NSURL URLWithString:@kTokenSwapServiceURL];
#endif
#ifdef kTokenRefreshServiceURL
  auth.tokenRefreshURL = [NSURL URLWithString:@kTokenRefreshServiceURL];
#endif
  auth.sessionUserDefaultsKey = @kSessionUserDefaultsKey;

  return YES;
  
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
  NSLog(@"*** url: %@", url);
  SPTAuth *auth = [SPTAuth defaultInstance];
  
  SPTAuthCallback authCallback = ^(NSError *error, SPTSession *session) {
    // This is the callback that'll be triggered when auth is completed (or fails).
    NSLog(@"authCallback");
    if (error) {
      NSLog(@"*** openURL Auth error: %@", error);
    } else {
      auth.session = session;
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:@"sessionUpdated" object:url];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"sessionUpdated" object:nil];
  };
  
  /*
   Handle the callback from the authentication service. -[SPAuth -canHandleURL:]
   helps us filter out URLs that aren't authentication URLs (i.e., URLs you use elsewhere in your application).
   */
  
  if ([auth canHandleURL:url]) {
    [auth handleAuthCallbackWithTriggeredAuthURL:url callback:authCallback];
    return YES;
  }
  
  return NO;
}


@end
