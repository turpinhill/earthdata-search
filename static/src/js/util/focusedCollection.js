import { isEmpty } from 'lodash'

import { buildDataCenters } from './collectionMetadata/dataCenters'
import { buildDoi } from './collectionMetadata/doi'
import { buildGibsLayers } from './collectionMetadata/gibsLayers'
import { buildRelatedUrls } from './collectionMetadata/relatedUrls'
import { buildScienceKeywords } from './collectionMetadata/scienceKeywords'
import { buildSpatial } from './collectionMetadata/spatial'
import { buildTemporal } from './collectionMetadata/temporal'
import { buildUrls } from './collectionMetadata/buildUrls'
import { buildNativeFormat } from './collectionMetadata/nativeFormat'

/**
 * Returns the collection object from the metadata store for the provided collectionId
 * @param {String} collectionId Focused collection id
 * @param {Object} collections collections from the metadata store
 */
export const getCollectionMetadata = (collectionId, collections) => {
  if (isEmpty(collections)) return undefined

  const { [collectionId]: collectionMetadata = {} } = collections

  return collectionMetadata
}

/**
 * Returns the json metadata from the store for the provided collectionId
 * @param {String} collectionId Focused collection id
 * @param {Object} collections collections from the metadata store
 */
export const getFocusedCollectionMetadata = (collectionId, collections) => {
  const collection = getCollectionMetadata(collectionId, collections)
  if (isEmpty(collection)) return undefined
  const { metadata = {} } = collection

  return metadata
}

/**
 * Format fetched metadata for the UI
 * @param {Object} metadata Collection metadata
 * @param {String} authToken The authenticated users' JWT token
 */
export const createFocusedCollectionMetadata = (metadata, authToken) => ({
  gibsLayers: buildGibsLayers(metadata),
  urls: buildUrls(metadata, authToken),
  dataCenters: buildDataCenters(metadata),
  doi: buildDoi(metadata),
  nativeFormats: buildNativeFormat(metadata),
  relatedUrls: buildRelatedUrls(metadata),
  scienceKeywords: buildScienceKeywords(metadata),
  temporal: buildTemporal(metadata),
  spatial: buildSpatial(metadata)
})
