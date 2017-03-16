//
//  EventManager.m
//  GmixrReact
//
//  Created by John Hanusek on 3/13/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EventManager.h"

@implementation EventManager

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  if ( self ) {
    NSNotificationCenter * notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter addObserver:self selector:@selector(eventReminderReceived:) name:@"EventFromSpotify" object:nil];
  }
  
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"EventReminder"];
}

- (void)eventReminderReceived:(NSNotification *)notification
{
  NSString *eventObject = notification.userInfo[@"object"];
  [self sendEventWithName:@"EventReminder" body:@{@"object": eventObject}];
}

@end
