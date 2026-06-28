import logger from '../utils/logger.js';

class EventBus {
  constructor() {
    this.listeners = {};
    this.onceListeners = {};
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.queueIntegration = false;
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    logger.debug(`Event listener added for: ${event}`);
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   */
  once(event, callback) {
    if (!this.onceListeners[event]) {
      this.onceListeners[event] = [];
    }
    this.onceListeners[event].push(callback);
    logger.debug(`Once event listener added for: ${event}`);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      logger.debug(`Event listener removed for: ${event}`);
    }
    if (this.onceListeners[event]) {
      this.onceListeners[event] = this.onceListeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event, data) {
    const eventData = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    // Add to history
    this.addToHistory(eventData);

    // Notify regular listeners
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Event listener error for ${event}: ${error.message}`);
        }
      });
    }

    // Notify once listeners
    if (this.onceListeners[event]) {
      this.onceListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Once event listener error for ${event}: ${error.message}`);
        }
      });
      // Clear once listeners after emission
      delete this.onceListeners[event];
    }

    logger.debug(`Event emitted: ${event}`);
  }

  /**
   * Add event to history
   */
  addToHistory(eventData) {
    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   */
  getHistory(event = null, limit = 50) {
    let history = this.eventHistory;
    
    if (event) {
      history = history.filter(e => e.event === event);
    }
    
    return history.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    logger.info('Event history cleared');
  }

  /**
   * Get all active event names
   */
  getActiveEvents() {
    return {
      regular: Object.keys(this.listeners),
      once: Object.keys(this.onceListeners)
    };
  }

  /**
   * Get listener count for an event
   */
  getListenerCount(event) {
    const regularCount = this.listeners[event]?.length || 0;
    const onceCount = this.onceListeners[event]?.length || 0;
    return regularCount + onceCount;
  }

  /**
   * Enable queue integration
   */
  enableQueueIntegration() {
    this.queueIntegration = true;
    logger.info('Queue integration enabled for EventBus');
  }

  /**
   * Disable queue integration
   */
  disableQueueIntegration() {
    this.queueIntegration = false;
    logger.info('Queue integration disabled for EventBus');
  }

  /**
   * Emit queue-specific event
   */
  emitQueueEvent(queueName, eventType, data) {
    const event = `queue.${queueName}.${eventType}`;
    this.emit(event, {
      queueName,
      eventType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit workflow event
   */
  emitWorkflowEvent(workflowType, eventType, data) {
    const event = `workflow.${workflowType}.${eventType}`;
    this.emit(event, {
      workflowType,
      eventType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit agent event
   */
  emitAgentEvent(agentType, eventType, data) {
    const event = `agent.${agentType}.${eventType}`;
    this.emit(event, {
      agentType,
      eventType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit notification event
   */
  emitNotification(userId, notificationType, data) {
    const event = `notification.${userId}`;
    this.emit(event, {
      userId,
      notificationType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get statistics
   */
  getStatistics() {
    let totalListeners = 0;
    Object.values(this.listeners).forEach(listeners => {
      totalListeners += listeners.length;
    });
    Object.values(this.onceListeners).forEach(listeners => {
      totalListeners += listeners.length;
    });

    return {
      totalEvents: this.eventHistory.length,
      totalListeners,
      activeEvents: this.getActiveEvents(),
      queueIntegration: this.queueIntegration
    };
  }

  /**
   * Reset the event bus
   */
  reset() {
    this.listeners = {};
    this.onceListeners = {};
    this.clearHistory();
    logger.info('EventBus reset');
  }
}

export default new EventBus();
