
import actions from './index'

import { buildPromise } from '../util/buildPromise'
import { findProvider } from '../util/findProvider'
import { getValueForTag, hasTag } from '../../../../sharedUtils/tags'
import { parseError } from '../../../../sharedUtils/parseError'

import AccessMethodsRequest from '../util/request/accessMethodsRequest'
import { getCollectionsMetadata } from '../selectors/collectionMetadata'
import { getCollectionMetadata } from '../util/focusedCollection'

/**
 * Fetch available access methods
 * @param {Object} collectionIds Collections to retrieve access methods for
 */
export const fetchAccessMethods = collectionIds => async (dispatch, getState) => {
  const state = getState()

  // Get the selected Access Method
  const {
    authToken
  } = state

  const collectionsMetadata = getCollectionsMetadata(state)

  // If the user is not logged in, don't fetch any methods
  if (authToken === '') return buildPromise(null)

  // If there are no collections, do not continue
  if (collectionIds.length === 0) return buildPromise(null)

  // The process of fetching access methods requires that we have providers retrieved
  // in order to look up provider guids
  try {
    // Fetching access methods requires that providers be fetched and available
    await dispatch(actions.fetchProviders())

    const accessMethodPromises = collectionIds.map((collectionId) => {
      const collectionMetadata = getCollectionMetadata(collectionId, collectionsMetadata)

      const {
        dataCenter,
        services,
        tags,
        variables
      } = collectionMetadata

      const collectionProvider = findProvider(getState(), dataCenter)

      // If the collection has tag data, retrieve the access methods from lambda
      const hasEchoOrders = hasTag(collectionMetadata, 'subset_service.echo_orders')
      const hasEsi = hasTag(collectionMetadata, 'subset_service.esi')
      const hasOpendap = hasTag(collectionMetadata, 'subset_service.opendap')
      const capabilitiesData = getValueForTag('collection_capabilities', tags)
      const { granule_online_access_flag: downloadable } = capabilitiesData || {}

      if (hasEchoOrders || hasEsi || hasOpendap) {
        const requestObject = new AccessMethodsRequest(authToken)

        const response = requestObject.search({
          collectionId,
          collectionProvider,
          services,
          tags,
          variables
        })
          .then((response) => {
            const { data } = response
            const { accessMethods, selectedAccessMethod } = data

            const accessMethodPayload = {
              collectionId,
              methods: accessMethods
            }

            if (selectedAccessMethod) {
              accessMethodPayload.selectedAccessMethod = selectedAccessMethod
            }

            dispatch(actions.addAccessMethods(accessMethodPayload))
          })
          .catch((error) => {
            dispatch(actions.handleError({
              error,
              action: 'fetchAccessMethods',
              resource: 'access methods',
              requestObject
            }))
          })

        return response
      }

      // If the collection is online downloadable, add the download method
      if (downloadable) {
        dispatch(actions.addAccessMethods({
          collectionId,
          methods: {
            download: {
              isValid: true,
              type: 'download'
            }
          },
          selectedAccessMethod: 'download'
        }))
      }

      return buildPromise(null)
    })

    return Promise.all(accessMethodPromises)
      .catch((e) => {
        parseError(e)
      })
  } catch (e) {
    return buildPromise(
      parseError(e, { asJSON: false })
    )
  }
}

export default fetchAccessMethods
