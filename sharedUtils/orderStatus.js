import { upperFirst } from 'lodash'

export const orderStates = {
  complete: [
    'closed',
    'complete',
    'complete_with_errors'
  ],
  failed: [
    'failed',
    'cancelled',
    'cancelling',
    'closed_with_exceptions',
    'create_failed', // Custom EDSC status for orders that failed to create
    'not_validated',
    'not_found', // Custom EDSC status for orders that aren't found in the DB
    'quote_rejected',
    'quote_failed',
    'submit_rejected',
    'submit_failed'
  ],
  in_progress: [
    'initialized', // Custom EDSC status for orders that have been submitted but we dont have a status for yet
    'in progress',
    'pending',
    'processing',
    'processing_with_exceptions',
    'validated',
    'quoting',
    'quoted',
    'quoted_with_exceptions',
    'submitting',
    'submitted_with_exceptions'
  ],
  creating: [
    'creating' // Custom EDSC status pertaining to orders before they are submitted
  ]
}

/**
 * Remove underscores, uppercase first letter, then add spaces back. This relies on multi worder statuses to look
 * like 'not_validated' which would output 'Not Validated'.
 * @param {String} status - The current order status
 * @returns {String} - The formatted order status.
 */
export const formatOrderStatus = status => status.split('_').map(word => upperFirst(word)).join(' ')

/**
 * Returns whether or not the order state is 'failed', 'complete', or 'in progress' based on its order status.
 * @param {String} status - The current order status
 * @returns {String|False} - A string representing the current state, or false if the state does not match a status.
 */
export const getStateFromOrderStatus = (status) => {
  if (orderStates.failed.indexOf(status.toLowerCase()) > -1) return 'failed'
  if (orderStates.complete.indexOf(status.toLowerCase()) > -1) return 'complete'
  if (orderStates.in_progress.indexOf(status.toLowerCase()) > -1) return 'in_progress'
  if (orderStates.creating.indexOf(status.toLowerCase()) > -1) return 'creating'

  return false
}

/**
 * Derive an order state from all orders
 * @param {Array} orders An array of orders
 */
export const aggregatedOrderStatus = (orders = []) => {
  let orderStatus = 'creating'

  // If no orders exist the state should return the default, creating
  if (orders.length === 0) return orderStatus

  if (orders.some(order => getStateFromOrderStatus(order.state) === 'in_progress')) {
    orderStatus = 'in progress'
  }

  if (orders.every(order => getStateFromOrderStatus(order.state) === 'failed')) {
    orderStatus = 'failed'
  }

  if (orders.every(order => getStateFromOrderStatus(order.state) === 'complete')) {
    orderStatus = 'complete'
  }

  return orderStatus
}
