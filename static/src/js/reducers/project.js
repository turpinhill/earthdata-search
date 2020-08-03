import {
  ADD_ACCESS_METHODS,
  ADD_COLLECTION_TO_PROJECT,
  ADD_GRANULE_TO_PROJECT_COLLECTION,
  ADD_MORE_PROJECT_GRANULE_RESULTS,
  CLEAR_REMOVED_GRANULE_ID,
  ERRORED_PROJECT_GRANULES,
  FINISHED_PROJECT_GRANULES_TIMER,
  PROJECT_GRANULES_LOADED,
  PROJECT_GRANULES_LOADING,
  REMOVE_COLLECTION_FROM_PROJECT,
  REMOVE_GRANULE_FROM_PROJECT_COLLECTION,
  RESTORE_FROM_URL,
  SELECT_ACCESS_METHOD,
  STARTED_PROJECT_GRANULES_TIMER,
  SUBMITTED_PROJECT,
  SUBMITTING_PROJECT,
  UPDATE_ACCESS_METHOD,
  UPDATE_PROJECT_GRANULE_RESULTS,
  UPDATE_PROJECT_GRANULE_PARAMS
} from '../constants/actionTypes'

const initialState = {
  collections: {
    allIds: [],
    byId: {}
  },
  isSubmitted: false,
  isSubmitting: false
}

const processResults = (results) => {
  const allIds = []

  results.forEach((result) => {
    const { id } = result

    allIds.push(id)
  })

  return allIds
}

export const initialGranuleState = {
  addedGranuleIds: [],
  allIds: [],
  hits: 0,
  isErrored: false,
  isLoaded: false,
  isLoading: false,
  params: {
    pageNum: 1
  },
  removedGranuleIds: []
}

const projectReducer = (state = initialState, action) => {
  switch (action.type) {
    case STARTED_PROJECT_GRANULES_TIMER: {
      const collectionId = action.payload

      const { collections: projectCollections = {} } = state
      const { byId: projectCollectionsById = {} } = projectCollections
      const { [collectionId]: projectCollection = {} } = projectCollectionsById
      const { granules: projectCollectionGranules = initialGranuleState } = projectCollection

      return {
        ...state,
        collections: {
          ...projectCollections,
          byId: {
            ...projectCollectionsById,
            [collectionId]: {
              ...projectCollection,
              granules: {
                ...projectCollectionGranules,
                timerStart: Date.now()
              }
            }
          }
        }
      }
    }
    case ERRORED_PROJECT_GRANULES: {
      const collectionId = action.payload

      const { collections = {} } = state
      const { byId: projectCollectionsById = {} } = collections
      const { [collectionId]: projectCollection = {} } = projectCollectionsById
      const { granules: projectCollectionGranules = initialGranuleState } = projectCollection

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...projectCollectionsById,
            [collectionId]: {
              ...projectCollection,
              granules: {
                ...projectCollectionGranules,
                isErrored: true,
                isLoaded: true,
                isLoading: false
              }
            }
          }
        }
      }
    }
    case FINISHED_PROJECT_GRANULES_TIMER: {
      const collectionId = action.payload

      const { collections, timerStart } = state
      const { byId: projectCollectionsById = {} } = collections
      const { [collectionId]: projectCollection = {} } = projectCollectionsById
      const { granules: projectCollectionGranules = initialGranuleState } = projectCollection

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...projectCollectionsById,
            [collectionId]: {
              ...projectCollection,
              granules: {
                ...projectCollectionGranules,
                timerStart: null,
                loadTime: Date.now() - timerStart
              }
            }
          }
        }
      }
    }
    case PROJECT_GRANULES_LOADED: {
      const collectionId = action.payload

      const { collections = {} } = state
      const { byId: projectCollectionsById = {} } = collections
      const { [collectionId]: projectCollection = {} } = projectCollectionsById
      const { granules: projectCollectionGranules = initialGranuleState } = projectCollection

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...projectCollectionsById,
            [collectionId]: {
              ...projectCollection,
              granules: {
                ...projectCollectionGranules,
                isErrored: false,
                isLoaded: true,
                isLoading: false
              }
            }
          }
        }
      }
    }
    case PROJECT_GRANULES_LOADING: {
      const collectionId = action.payload

      const { collections = {} } = state
      const { byId: projectCollectionsById = {} } = collections
      const { [collectionId]: projectCollection = {} } = projectCollectionsById
      const { granules: projectCollectionGranules = initialGranuleState } = projectCollection

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...projectCollectionsById,
            [collectionId]: {
              ...projectCollection,
              granules: {
                ...projectCollectionGranules,
                isErrored: false,
                isLoaded: false,
                isLoading: true
              }
            }
          }
        }
      }
    }
    case ADD_MORE_PROJECT_GRANULE_RESULTS: {
      const {
        collectionId,
        results
      } = action.payload

      const newIds = processResults(results)

      const { byId = {} } = state
      const { [collectionId]: projectCollection = {} } = byId
      const { granules: projectCollectionGranules = initialGranuleState } = projectCollection
      const { allIds } = projectCollectionGranules

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...state.collections.byId,
            [collectionId]: {
              ...projectCollection,
              granules: {
                ...projectCollectionGranules,
                allIds: [
                  ...allIds,
                  ...newIds
                ]
              }
            }
          }
        }
      }
    }
    case UPDATE_PROJECT_GRANULE_RESULTS: {
      const {
        collectionId,
        hits,
        isCwic,
        results,
        totalSize,
        singleGranuleSize
      } = action.payload

      const allIds = processResults(results)

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...state.collections.byId,
            [collectionId]: {
              ...state.collections.byId[collectionId],
              granules: {
                ...state.collections.byId[collectionId].granules,
                allIds,
                hits,
                isCwic,
                totalSize,
                singleGranuleSize
              }
            }
          }
        }
      }
    }
    case UPDATE_PROJECT_GRANULE_PARAMS: {
      const { collectionId, pageNum } = action.payload

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...state.collections.byId,
            [collectionId]: {
              ...state.collections.byId[collectionId],
              granules: {
                ...state.collections.byId[collectionId].granules,
                params: {
                  pageNum
                }
              }
            }
          }
        }
      }
    }
    case ADD_GRANULE_TO_PROJECT_COLLECTION: {
      const { collectionId, granuleId } = action.payload

      const { collections: projectCollections } = state
      const { allIds, byId: projectCollectionsById } = projectCollections

      // If the collection does not exist in the project, dont do anything.
      if (allIds.indexOf(collectionId) === -1) return state

      const { [collectionId]: projectCollection } = projectCollectionsById
      const { granules: projectCollectionGranules } = projectCollection

      const {
        addedGranuleIds = [],
        removedGranuleIds = []
      } = projectCollectionGranules

      // If there are no added granules, a user is trying to remove a granule from
      // a collection in their project.
      const removedGranuleIdIndex = removedGranuleIds.indexOf(granuleId)

      // If the granule is not already in the removed granule list
      if (removedGranuleIdIndex > -1) {
        return {
          ...state,
          collections: {
            ...projectCollections,
            byId: {
              ...projectCollectionsById,
              [collectionId]: {
                ...projectCollection,
                granules: {
                  ...projectCollectionGranules,
                  removedGranuleIds: [
                    ...removedGranuleIds.slice(0, removedGranuleIdIndex),
                    ...removedGranuleIds.slice(removedGranuleIdIndex + 1)
                  ]
                }
              }
            }
          }
        }
      }

      const addedGranuleIdIndex = addedGranuleIds.indexOf(granuleId)

      // If the granule is an added granule
      if (addedGranuleIdIndex === -1) {
        return {
          ...state,
          collections: {
            ...projectCollections,
            byId: {
              ...projectCollectionsById,
              [collectionId]: {
                ...projectCollection,
                granules: {
                  ...projectCollectionGranules,
                  addedGranuleIds: [
                    ...addedGranuleIds,
                    granuleId
                  ]
                }
              }
            }
          }
        }
      }

      return state
    }
    case REMOVE_GRANULE_FROM_PROJECT_COLLECTION: {
      const { collectionId, granuleId } = action.payload

      const { collections: projectCollections } = state
      const { allIds, byId: projectCollectionsById } = projectCollections

      // If the collection does not exist in the project, dont do anything.
      if (allIds.indexOf(collectionId) === -1) return state

      const { [collectionId]: projectCollection } = projectCollectionsById
      const { granules: projectCollectionGranules } = projectCollection

      const {
        addedGranuleIds = [],
        removedGranuleIds = []
      } = projectCollectionGranules

      const addedGranuleIdIndex = addedGranuleIds.indexOf(granuleId)

      // If the granule is an added granule
      if (addedGranuleIdIndex > -1) {
        // Remove it from the added granule list
        return {
          ...state,
          collections: {
            ...projectCollections,
            byId: {
              ...projectCollectionsById,
              [collectionId]: {
                ...projectCollection,
                granules: {
                  ...projectCollectionGranules,
                  addedGranuleIds: [
                    ...addedGranuleIds.slice(0, addedGranuleIdIndex),
                    ...addedGranuleIds.slice(addedGranuleIdIndex + 1)
                  ]
                }
              }
            }
          }
        }
      }

      // If there are no added granules, a user is trying to remove a granule from
      // a collection in their project.
      const removedGranuleIdIndex = removedGranuleIds.indexOf(granuleId)

      // If the granule is not already in the removed granule list
      if (removedGranuleIdIndex === -1) {
        return {
          ...state,
          collections: {
            ...projectCollections,
            byId: {
              ...projectCollectionsById,
              [collectionId]: {
                ...projectCollection,
                granules: {
                  ...projectCollectionGranules,
                  removedGranuleIds: [
                    ...removedGranuleIds,
                    granuleId
                  ]
                }
              }
            }
          }
        }
      }

      return state
    }
    case CLEAR_REMOVED_GRANULE_ID: {
      const { collections: projectCollections = {} } = state
      const { allIds, byId } = projectCollections

      allIds.forEach((collectionId) => {
        if ('removedGranuleIds' in byId[collectionId]) {
          byId[collectionId].removedGranuleIds = []
        }
      })

      return {
        ...state,
        collections: {
          ...projectCollections,
          byId
        }
      }
    }
    case ADD_COLLECTION_TO_PROJECT: {
      const collectionId = action.payload

      const { collections: projectCollections } = state
      const { allIds, byId } = projectCollections

      // If the collection is already in the project there is no action to be taken
      if (allIds.indexOf(collectionId) > -1) return state

      return {
        ...state,
        collections: {
          ...projectCollections,
          allIds: [
            ...allIds,
            collectionId
          ],
          byId: {
            ...byId,
            [collectionId]: {
              granules: initialGranuleState
            }
          }
        }
      }
    }
    case REMOVE_COLLECTION_FROM_PROJECT: {
      const collectionId = action.payload

      const { collections: projectCollection } = state
      const { allIds, byId } = projectCollection

      const collectionIndex = allIds.indexOf(collectionId)

      // If the collection isn't in the project there is no action to be taken
      if (collectionIndex === -1) return state

      // Delete the collection from byId
      delete byId[collectionId]

      return {
        ...state,
        collections: {
          ...projectCollection,
          allIds: [
            ...allIds.slice(0, collectionIndex),
            ...allIds.slice(collectionIndex + 1)
          ],
          byId: {
            ...byId
          }
        }
      }
    }
    case RESTORE_FROM_URL: {
      const { project } = action.payload

      return {
        ...state,
        ...project
      }
    }
    case SELECT_ACCESS_METHOD: {
      const {
        collectionId,
        selectedAccessMethod
      } = action.payload

      const { collections } = state
      const { byId } = collections

      return {
        ...state,
        collections: {
          ...collections,
          byId: {
            ...byId,
            [collectionId]: {
              ...byId[collectionId],
              selectedAccessMethod
            }
          }
        }
      }
    }
    case ADD_ACCESS_METHODS: {
      const {
        collectionId,
        methods,
        selectedAccessMethod
      } = action.payload

      const { collections: projectCollections } = state
      const { byId: projectCollectionsById = {} } = projectCollections
      const { [collectionId]: projectCollection = {} } = projectCollectionsById
      const { accessMethods = {} } = projectCollection

      const existingMethods = {}

      Object.keys(methods).forEach((key) => {
        existingMethods[key] = {
          ...accessMethods[key],
          ...methods[key]
        }
      })

      if (selectedAccessMethod) {
        projectCollection.selectedAccessMethod = selectedAccessMethod
      }

      return {
        ...state,
        collections: {
          ...projectCollections,
          byId: {
            ...projectCollectionsById,
            [collectionId]: {
              ...projectCollection,
              accessMethods: existingMethods
            }
          }
        }
      }
    }
    case UPDATE_ACCESS_METHOD: {
      const { collectionId, method } = action.payload

      const byId = {
        ...state.collections.byId
      }

      const [methodKey] = Object.keys(method)
      const { accessMethods = {} } = byId[collectionId] || {}
      const oldMethod = accessMethods[methodKey] || {}

      byId[collectionId] = {
        ...byId[collectionId],
        accessMethods: {
          ...accessMethods,
          [methodKey]: {
            ...oldMethod,
            ...method[methodKey]
          }
        }
      }

      return {
        ...state,
        collections: {
          ...state.collections,
          byId: {
            ...state.collections.byId,
            ...byId
          }
        }
      }
    }
    case SUBMITTING_PROJECT: {
      return {
        ...state,
        isSubmitted: false,
        isSubmitting: true
      }
    }
    case SUBMITTED_PROJECT: {
      return {
        ...state,
        isSubmitted: true,
        isSubmitting: false
      }
    }
    default:
      return state
  }
}

export default projectReducer
