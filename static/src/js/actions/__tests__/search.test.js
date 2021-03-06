import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import actions from '../index'
import { updateCollectionQuery, updateGranuleQuery } from '../search'
import {
  CLEAR_COLLECTION_GRANULES,
  CLEAR_EXCLUDE_GRANULE_ID,
  CLEAR_REMOVED_GRANULE_ID,
  CLEAR_FILTERS,
  CLEAR_SHAPEFILE,
  TOGGLE_DRAWING_NEW_LAYER,
  UPDATE_COLLECTION_QUERY,
  UPDATE_GRANULE_QUERY,
  UPDATE_REGION_QUERY,
  UPDATE_TIMELINE_INTERVALS
} from '../../constants/actionTypes'

const mockStore = configureMockStore([thunk])

beforeEach(() => {
  jest.clearAllMocks()
})

describe('updateCollectionQuery', () => {
  test('should create an action to update the search query', () => {
    const payload = {
      keyword: 'new keyword',
      pageNum: 1,
      spatial: {
        point: '0,0'
      }
    }
    const expectedAction = {
      type: UPDATE_COLLECTION_QUERY,
      payload
    }
    expect(updateCollectionQuery(payload)).toEqual(expectedAction)
  })
})

describe('updateGranuleQuery', () => {
  test('should create an action to update the search query', () => {
    const payload = {
      pageNum: 1
    }
    const expectedAction = {
      type: UPDATE_GRANULE_QUERY,
      payload
    }
    expect(updateGranuleQuery(payload)).toEqual(expectedAction)
  })
})

describe('changeQuery', () => {
  test('should update the search query and call getCollections', () => {
    const newQuery = {
      collection: {
        keyword: 'new keyword',
        spatial: {
          point: '0,0'
        },
        temporal: {}
      }
    }

    // mock getCollections
    const getCollectionsMock = jest.spyOn(actions, 'getCollections')
    getCollectionsMock.mockImplementation(() => jest.fn())

    // mockStore with initialState
    const store = mockStore({
      focusedCollection: '',
      query: {
        collection: {
          keyword: 'old stuff',
          spatial: {}
        }
      },
      project: {},
      router: {
        location: {
          pathname: ''
        }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeQuery({ ...newQuery }))

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: CLEAR_EXCLUDE_GRANULE_ID
    })
    expect(storeActions[1]).toEqual({
      type: CLEAR_REMOVED_GRANULE_ID
    })
    expect(storeActions[2]).toEqual({
      type: UPDATE_COLLECTION_QUERY,
      payload: {
        keyword: 'new keyword',
        pageNum: 1,
        spatial: {
          point: '0,0'
        },
        temporal: {}
      }
    })

    // was getCollections called
    expect(getCollectionsMock).toHaveBeenCalledTimes(1)
  })

  test('should wipe excluded granule ids when overideTemporal is modified', () => {
    const newQuery = {
      collection: {
        overideTemporal: {
          endDate: '2019-02-09T00:17:36.267Z',
          startDate: '2018-12-28T23:04:23.677Z'
        }
      }
    }

    // mockStore with initialState
    const store = mockStore({
      focusedCollection: '',
      query: {
        collection: {}
      },
      project: {},
      router: {
        location: {
          pathname: ''
        }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeQuery({ ...newQuery }))

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: CLEAR_EXCLUDE_GRANULE_ID
    })
  })

  test('should wipe excluded granule ids when gridName is modified', () => {
    const newQuery = {
      collection: {
        gridName: 'Test Grid'
      }
    }

    // mockStore with initialState
    const store = mockStore({
      focusedCollection: '',
      query: {
        collection: {}
      },
      project: {},
      router: {
        location: {
          pathname: ''
        }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeQuery({ ...newQuery }))

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: CLEAR_EXCLUDE_GRANULE_ID
    })
  })
})

describe('changeProjectQuery', () => {
  test('should update the search query', () => {
    const newQuery = {
      collection: {
        keyword: 'new keyword',
        spatial: {
          point: '0,0'
        },
        temporal: {}
      }
    }

    // mockStore with initialState
    const store = mockStore({
      focusedCollection: '',
      query: {
        collection: {
          keyword: 'old stuff'
        }
      },
      router: {
        location: {
          pathname: ''
        }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeProjectQuery({ ...newQuery }))

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: UPDATE_COLLECTION_QUERY,
      payload: {
        keyword: 'new keyword',
        spatial: {
          point: '0,0'
        },
        temporal: {}
      }
    })
  })
})

describe('changeCollectionPageNum', () => {
  test('should update the collection query and call getCollections', () => {
    const pageNum = 2

    // mock getCollections
    const getCollectionsMock = jest.spyOn(actions, 'getCollections')
    getCollectionsMock.mockImplementation(() => jest.fn())

    // mockStore with initialState
    const store = mockStore({
      query: {
        collection: { pageNum: 1 }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeCollectionPageNum(pageNum))

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: UPDATE_COLLECTION_QUERY,
      payload: {
        pageNum: 2
      }
    })

    // was getCollections called
    expect(getCollectionsMock).toHaveBeenCalledTimes(1)
  })
})

describe('changeGranulePageNum', () => {
  test('should update the collection query and call getCollections', () => {
    const collectionId = 'collectionId'
    const pageNum = 2

    // mock getGranules
    const getGranulesMock = jest.spyOn(actions, 'getGranules')
    getGranulesMock.mockImplementation(() => jest.fn())

    // mockStore with initialState
    const store = mockStore({
      metadata: {
        collections: {
          allIds: [collectionId],
          byId: {
            collectionId: {
              granules: {
                allIds: ['123', '456'],
                hits: 100
              }
            }
          }
        }
      },
      query: {
        collection: {},
        granule: { pageNum: 1 }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeGranulePageNum({ collectionId, pageNum }))

    // Is updateGranuleQuery called with the right payload
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: UPDATE_GRANULE_QUERY,
      payload: {
        pageNum: 2
      }
    })

    // was getCollections called
    expect(getGranulesMock).toHaveBeenCalledTimes(1)
  })

  test('should not update the collection query and call getCollections if there are no more granules', () => {
    const collectionId = 'collectionId'
    const pageNum = 2

    // mock getGranules
    const getGranulesMock = jest.spyOn(actions, 'getGranules')
    getGranulesMock.mockImplementation(() => jest.fn())

    // mockStore with initialState
    const store = mockStore({
      metadata: {
        collections: {
          allIds: [collectionId],
          byId: {
            collectionId: {
              granules: {
                allIds: ['123', '456'],
                hits: 2
              }
            }
          }
        }
      },
      query: {
        collection: {},
        granule: { pageNum: 1 }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeGranulePageNum({ collectionId, pageNum }))

    // Is updateGranuleQuery called with the right payload
    const storeActions = store.getActions()
    expect(storeActions.length).toBe(0)

    expect(getGranulesMock).toHaveBeenCalledTimes(0)
  })
})

describe('changeGranuleGridCoords', () => {
  test('should update the collection query and call getCollections', () => {
    const coords = 'Test Grid Coords'

    // mock getGranules
    const getGranulesMock = jest.spyOn(actions, 'getGranules')
    getGranulesMock.mockImplementation(() => jest.fn())

    // mockStore with initialState
    const store = mockStore({
      query: {
        collection: {},
        granule: { pageNum: 1 }
      }
    })

    // call the dispatch
    store.dispatch(actions.changeGranuleGridCoords(coords))

    // Is updateGranuleQuery called with the right payload
    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: UPDATE_GRANULE_QUERY,
      payload: {
        gridCoords: coords
      }
    })

    // was getCollections called
    expect(getGranulesMock).toHaveBeenCalledTimes(1)
  })
})

describe('removeGridFilter', () => {
  test('should remove the grid query', () => {
    // mockStore with initialState
    const store = mockStore({
      query: {
        collection: {
          spatial: {},
          temporal: {},
          gridName: 'mock grid'
        },
        granule: {
          gridCoords: 'mock coords'
        }
      },
      project: {},
      router: {
        location: {
          pathname: ''
        }
      },
      timeline: {
        query: {}
      }
    })

    // call the dispatch
    store.dispatch(actions.removeGridFilter())

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: CLEAR_EXCLUDE_GRANULE_ID
    })
    expect(storeActions[1]).toEqual({
      type: CLEAR_REMOVED_GRANULE_ID
    })
    expect(storeActions[2]).toEqual({
      type: UPDATE_COLLECTION_QUERY,
      payload: {
        gridName: '',
        pageNum: 1
      }
    })
    expect(storeActions[3]).toEqual({
      type: UPDATE_GRANULE_QUERY,
      payload: {
        gridCoords: '',
        pageNum: 1
      }
    })
  })
})

describe('removeSpatialFilter', () => {
  test('should remove the spatial query', () => {
    // mockStore with initialState
    const store = mockStore({
      query: {
        collection: {
          spatial: {
            point: '0,0'
          },
          temporal: {}
        }
      },
      project: {},
      router: {
        location: {
          pathname: ''
        }
      },
      timeline: {
        query: {}
      }
    })

    // call the dispatch
    store.dispatch(actions.removeSpatialFilter())

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: CLEAR_EXCLUDE_GRANULE_ID
    })
    expect(storeActions[1]).toEqual({
      type: CLEAR_REMOVED_GRANULE_ID
    })
    expect(storeActions[2]).toEqual({
      type: UPDATE_COLLECTION_QUERY,
      payload: {
        pageNum: 1,
        spatial: {}
      }
    })
    expect(storeActions[3]).toEqual({
      type: UPDATE_GRANULE_QUERY,
      payload: {
        pageNum: 1
      }
    })
    expect(storeActions[4]).toEqual({
      type: CLEAR_COLLECTION_GRANULES
    })
    expect(storeActions[5]).toEqual({
      type: UPDATE_TIMELINE_INTERVALS,
      payload: {
        results: []
      }
    })
    expect(storeActions[6]).toEqual({
      type: TOGGLE_DRAWING_NEW_LAYER,
      payload: false
    })
    expect(storeActions[7]).toEqual({
      type: CLEAR_SHAPEFILE
    })
  })
})

describe('removeTemporalFilter', () => {
  test('should remove the temporal query', () => {
    // mockStore with initialState
    const store = mockStore({
      query: {
        collection: {
          spatial: {},
          temporal: {
            endDate: '2019-02-09T00:17:36.267Z',
            startDate: '2018-12-28T23:04:23.677Z'
          }
        }
      },
      project: {},
      router: {
        location: {
          pathname: ''
        }
      },
      timeline: {
        query: {}
      }
    })

    // call the dispatch
    store.dispatch(actions.removeTemporalFilter())

    const storeActions = store.getActions()
    expect(storeActions[0]).toEqual({
      type: CLEAR_EXCLUDE_GRANULE_ID
    })
    expect(storeActions[1]).toEqual({
      type: CLEAR_REMOVED_GRANULE_ID
    })
    expect(storeActions[2]).toEqual({
      type: UPDATE_COLLECTION_QUERY,
      payload: {
        pageNum: 1,
        temporal: {}
      }
    })
  })
})

describe('changeRegionQuery', () => {
  test('clears the query and calls getCollections', () => {
    const query = {
      exact: false,
      endpoint: 'region',
      keyword: 'test value'
    }

    // mockStore with initialState
    const store = mockStore({})

    // mock getRegionsMock
    const getRegionsMock = jest.spyOn(actions, 'getRegions')
    getRegionsMock.mockImplementation(() => jest.fn())

    // call the dispatch
    store.dispatch(actions.changeRegionQuery(query))
    const storeActions = store.getActions()

    expect(storeActions[0]).toEqual({
      type: UPDATE_REGION_QUERY,
      payload: query
    })

    // was getCollections called
    expect(getRegionsMock).toHaveBeenCalledTimes(1)
  })
})

describe('clearFilters', () => {
  test('clears the query and calls getCollections', () => {
    // mockStore with initialState
    const store = mockStore({})

    // mock getCollections
    const getCollectionsMock = jest.spyOn(actions, 'getCollections')
    getCollectionsMock.mockImplementation(() => jest.fn())
    const getProjectCollectionsMock = jest.spyOn(actions, 'getProjectCollections')
    getProjectCollectionsMock.mockImplementation(() => jest.fn())
    const getGranulesMock = jest.spyOn(actions, 'getGranules')
    getGranulesMock.mockImplementation(() => jest.fn())
    const getTimelineMock = jest.spyOn(actions, 'getTimeline')
    getTimelineMock.mockImplementation(() => jest.fn())

    // call the dispatch
    store.dispatch(actions.clearFilters())
    const storeActions = store.getActions()

    expect(storeActions[0]).toEqual({
      type: CLEAR_FILTERS
    })

    // was getCollections called
    expect(getCollectionsMock).toHaveBeenCalledTimes(1)
    expect(getProjectCollectionsMock).toHaveBeenCalledTimes(1)
    expect(getGranulesMock).toHaveBeenCalledTimes(1)
    expect(getTimelineMock).toHaveBeenCalledTimes(1)
  })
})
