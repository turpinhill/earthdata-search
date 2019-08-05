import { buildURL } from '../util/cmr/buildUrl'
import { doSearchRequest } from '../util/cmr/doSearchRequest'
import { getJwtToken } from '../util/getJwtToken'
import { isWarmUp } from '../util/isWarmup'

/**
 * Handler to perform an authenticated OUS Granule search
 */
const ousGranuleSearch = async (event) => {
  // Prevent execution if the event source is the warmer
  if (await isWarmUp(event)) return false

  // Whitelist parameters supplied by the request
  const permittedCmrKeys = [
    'bounding_box',
    'exclude_granules',
    'granules',
    'format',
    'temporal',
    'variables'
  ]

  const { body } = event

  // We need echo_collection_id to construct the URL but it is not listed
  // as a permitted key so it will be ignored when the request is made
  const { params = {} } = JSON.parse(body)
  const { echo_collection_id: echoCollectionId } = params

  return doSearchRequest(getJwtToken(event), buildURL({
    body,
    path: `/service-bridge/ous/collection/${echoCollectionId}`,
    permittedCmrKeys
  }))
}

export default ousGranuleSearch