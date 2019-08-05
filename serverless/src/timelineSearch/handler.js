import { buildURL } from '../util/cmr/buildUrl'
import { doSearchRequest } from '../util/cmr/doSearchRequest'
import { getJwtToken } from '../util/getJwtToken'
import { isWarmUp } from '../util/isWarmup'

/**
 * Handler to perform an authenticated CMR Timeline search
 */
const timelineSearch = async (event) => {
  // Prevent execution if the event source is the warmer
  if (await isWarmUp(event)) return false

  // Whitelist parameters supplied by the request
  const permittedCmrKeys = [
    'concept_id',
    'end_date',
    'interval',
    'start_date'
  ]

  const nonIndexedKeys = [
    'concept_id'
  ]

  const { body } = event

  return doSearchRequest(getJwtToken(event), buildURL({
    body,
    nonIndexedKeys,
    path: '/search/granules/timeline',
    permittedCmrKeys
  }))
}

export default timelineSearch