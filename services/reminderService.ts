import * as Notifications from 'expo-notifications';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Constants from 'expo-constants';

// Check if running in Expo Go (notifications have limitations in SDK 53+)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure notification handler to create Firestore notifications when reminders fire
// Only set handler if not in Expo Go (to avoid warnings)
// Note: Push notifications don't work in Expo Go with SDK 53+, but work fine in APK builds
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // When reminder notification fires, create Firestore notification
    if (notification.request.content.data?.type === 'walk_reminder') {
      const { requestId } = notification.request.content.data;
      
      try {
        // Get walk request details
        const walkRequestRef = doc(db, 'walkRequests', requestId as string);
        const walkRequestSnap = await getDoc(walkRequestRef);
        
        if (walkRequestSnap.exists()) {
          const walkData = walkRequestSnap.data();
          const locationText = walkData.meetingPoint || walkData.pickup || 'your scheduled location';
          const reminderMinutes = parseReminderMinutes(walkData.reminder || 'None');
          
          // Create Firestore notification for wanderer (will trigger toast automatically)
          if (walkData.wandererId) {
            await addDoc(collection(db, 'notifications'), {
              userId: walkData.wandererId,
              walkRequestId: requestId as string,
              type: 'walk_reminder',
              title: `Walk Reminder: ${reminderMinutes} minutes until walk`,
              message: `Your walk with ${walkData.walkerName} is scheduled in ${reminderMinutes} minutes at ${locationText}`,
              timestamp: serverTimestamp(),
              read: false,
            });
          }
          
          // Create Firestore notification for walker (will trigger toast automatically)
          if (walkData.walkerId) {
            await addDoc(collection(db, 'notifications'), {
              userId: walkData.walkerId,
              walkRequestId: requestId as string,
              type: 'walk_reminder',
              title: `Walk Reminder: ${reminderMinutes} minutes until walk`,
              message: `Your walk with ${walkData.wandererName} is scheduled in ${reminderMinutes} minutes at ${locationText}`,
              timestamp: serverTimestamp(),
              read: false,
            });
          }
        }
      } catch (error) {
        console.error('Error creating Firestore notification from reminder:', error);
      }
    }
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
  });
  } catch (error) {
    // Silently handle if notifications aren't available (e.g., in Expo Go)
    // This won't affect APK builds where notifications work properly
    console.warn('Could not set notification handler (may not be supported in Expo Go):', error);
  }
}

/**
 * Parse reminder string and return minutes before walk
 */
export function parseReminderMinutes(reminder: string): number {
  switch (reminder) {
    case '5 min before':
      return 5;
    case '15 min before':
      return 15;
    case '30 min before':
      return 30;
    default:
      return 0;
  }
}

/**
 * Parse scheduled date and time to Date object
 */
export function parseScheduledDateTime(scheduledDate: string, scheduledTime: string): Date | null {
  try {
    // Parse date (format: YYYY-MM-DD)
    const dateParts = scheduledDate.split('-');
    if (dateParts.length !== 3) return null;
    
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2]);
    
    // Parse time (format: "HH:MM AM/PM")
    const timeMatch = scheduledTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return null;
    
    let hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    const scheduledDateTime = new Date(year, month, day, hour, minute, 0, 0);
    return scheduledDateTime;
  } catch (error) {
    console.error('Error parsing scheduled date/time:', error);
    return null;
  }
}

/**
 * Schedule reminder notification for a walk
 */
export async function scheduleWalkReminder(
  requestId: string,
  scheduledDate: string,
  scheduledTime: string,
  reminder: string,
  wandererId: string,
  walkerId: string,
  wandererName: string,
  walkerName: string,
  walkType?: string,
  meetingPoint?: string,
  pickup?: string
): Promise<void> {
  try {
    // Check if reminder is set
    if (reminder === 'None' || !reminder) {
      console.log('No reminder set for walk request:', requestId);
      return;
    }

    // Parse scheduled date/time
    const scheduledDateTime = parseScheduledDateTime(scheduledDate, scheduledTime);
    if (!scheduledDateTime) {
      console.error('Could not parse scheduled date/time');
      return;
    }

    // Calculate reminder time
    const reminderMinutes = parseReminderMinutes(reminder);
    if (reminderMinutes === 0) {
      console.log('Invalid reminder value:', reminder);
      return;
    }

    const reminderTime = new Date(scheduledDateTime.getTime() - reminderMinutes * 60 * 1000);
    const now = new Date();

    // Check if reminder time is in the past
    if (reminderTime <= now) {
      console.log('Reminder time is in the past, skipping notification');
      return;
    }

    // Request notification permissions
    // Note: In Expo Go (SDK 53+), push notifications don't work, but this is fine for APK builds
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission not granted');
        // Still continue - Firestore notifications will work in-app
        // Local notifications just won't fire, but reminders will show in-app
      }
    } catch (error) {
      // Handle case where notifications aren't available (e.g., in Expo Go SDK 53+)
      // This is expected in Expo Go but won't affect APK builds
      console.warn('Notifications not available (expected in Expo Go SDK 53+):', error);
      // Continue anyway - Firestore notifications will still work in-app
      // This ensures reminders work even if local notifications don't
    }

    // Create notification content
    const locationText = meetingPoint || pickup || 'your scheduled location';
    const reminderMinutesText = reminderMinutes.toString();
    const title = `Walk Reminder: ${reminderMinutesText} min before walk`;
    const body = `Your walk with ${walkerName} is scheduled in ${reminderMinutesText} minutes at ${locationText}`;
    const walkerTitle = `Walk Reminder: ${reminderMinutesText} min before walk`;
    const walkerBody = `Your walk with ${wandererName} is scheduled in ${reminderMinutesText} minutes at ${locationText}`;

    // Calculate seconds until reminder
    const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
    
    if (secondsUntilReminder <= 0) {
      console.log('Reminder time is in the past');
      return;
    }

    // Schedule local notification for wanderer
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            requestId,
            type: 'walk_reminder',
            scheduledDate,
            scheduledTime,
          },
          sound: true,
        },
        trigger: {
          type: 'timeInterval',
          seconds: secondsUntilReminder,
        } as Notifications.TimeIntervalTriggerInput,
      });
      console.log('Scheduled local notification for wanderer at:', reminderTime);
    } catch (error: any) {
      // In Expo Go, scheduling might fail - that's okay, Firestore notifications will still work
      console.warn('Could not schedule local notification for wanderer (may not be supported in Expo Go):', error?.message || error);
    }

    // Schedule local notification for walker
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: walkerTitle,
          body: walkerBody,
          data: {
            requestId,
            type: 'walk_reminder',
            scheduledDate,
            scheduledTime,
          },
          sound: true,
        },
        trigger: {
          type: 'timeInterval',
          seconds: secondsUntilReminder,
        } as Notifications.TimeIntervalTriggerInput,
      });
      console.log('Scheduled local notification for walker at:', reminderTime);
    } catch (error: any) {
      // In Expo Go, scheduling might fail - that's okay, Firestore notifications will still work
      console.warn('Could not schedule local notification for walker (may not be supported in Expo Go):', error?.message || error);
    }
  } catch (error) {
    console.error('Error scheduling walk reminder:', error);
  }
}

