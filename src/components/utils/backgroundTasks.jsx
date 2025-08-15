import NotificationService from './notificationService';

class BackgroundTaskManager {
  constructor() {
    this.intervals = new Map();
  }

  // Start background notification checks with error handling
  startNotificationChecks() {
    console.log('Starting background notification tasks...');
    
    // Check for overdue items every 15 minutes
    const overdueInterval = setInterval(async () => {
      try {
        await NotificationService.checkAndNotifyOverdueItems();
      } catch (error) {
        console.error('Error in overdue check interval:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    // Check for upcoming reminders every 5 minutes
    const reminderInterval = setInterval(async () => {
      try {
        await NotificationService.checkAndSendReminders();
      } catch (error) {
        console.error('Error in reminder check interval:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.intervals.set('overdue', overdueInterval);
    this.intervals.set('reminders', reminderInterval);

    // Initial check on startup with delay and error handling
    setTimeout(async () => {
      try {
        console.log('Running initial notification checks...');
        await NotificationService.checkAndNotifyOverdueItems();
        await NotificationService.checkAndSendReminders();
        console.log('Initial notification checks completed');
      } catch (error) {
        console.error('Error in initial notification checks:', error);
      }
    }, 5000); // 5 seconds delay on startup

    console.log('Background notification tasks started successfully');
  }

  // Stop all background tasks
  stopAllTasks() {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    console.log('All background tasks stopped');
  }

  // Start background tasks when user is active
  startWhenActive() {
    // Only start if not already running
    if (this.intervals.size === 0) {
      this.startNotificationChecks();
    }
  }

  // Stop background tasks when user is inactive
  stopWhenInactive() {
    this.stopAllTasks();
  }
}

// Create singleton instance
const backgroundTaskManager = new BackgroundTaskManager();

// Auto-start when window gains focus
window.addEventListener('focus', () => {
  try {
    backgroundTaskManager.startWhenActive();
  } catch (error) {
    console.error('Error starting background tasks on focus:', error);
  }
});

// Stop when window loses focus (optional - saves resources)
window.addEventListener('blur', () => {
  // Uncomment to stop tasks when window is not focused
  // backgroundTaskManager.stopWhenInactive();
});

// Start tasks when module is loaded with error handling
try {
  backgroundTaskManager.startNotificationChecks();
} catch (error) {
  console.error('Error starting background tasks on module load:', error);
}

export default backgroundTaskManager;