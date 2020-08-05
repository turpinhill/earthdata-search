import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import { CollectionResultsBodyContainer } from '../CollectionResultsBodyContainer'
import CollectionResultsBody from '../../../components/CollectionResults/CollectionResultsBody'

Enzyme.configure({ adapter: new Adapter() })

function setup() {
  const props = {
    browser: {
      name: 'browser name'
    },
    collectionsMetadata: {
      id1: {
        title: 'collection 1 title'
      },
      id2: {
        title: 'collection 2 title'
      }
    },
    collectionsSearch: {},
    portal: {},
    projectCollectionsIds: [],
    location: {
      value: 'location'
    },
    onAddProjectCollection: jest.fn(),
    onRemoveCollectionFromProject: jest.fn(),
    onChangeCollectionPageNum: jest.fn(),
    onViewCollectionGranules: jest.fn(),
    onViewCollectionDetails: jest.fn(),
    panelView: 'list',
    query: {
      pageNum: 1
    }
  }

  const enzymeWrapper = shallow(<CollectionResultsBodyContainer {...props} />)

  return {
    enzymeWrapper,
    props
  }
}

describe('CollectionResultsBodyContainer component', () => {
  test('passes its props and renders a single CollectionResultsBody component', () => {
    const { enzymeWrapper } = setup()

    expect(enzymeWrapper.find(CollectionResultsBody).length).toBe(1)
    expect(enzymeWrapper.find(CollectionResultsBody).props().browser).toEqual({
      name: 'browser name'
    })
    expect(enzymeWrapper.find(CollectionResultsBody).props().collectionsMetadata).toEqual({
      id1: {
        title: 'collection 1 title'
      },
      id2: {
        title: 'collection 2 title'
      }
    })
    expect(enzymeWrapper.find(CollectionResultsBody).props().projectCollectionsIds).toEqual([])
    expect(enzymeWrapper.find(CollectionResultsBody).props().location).toEqual({
      value: 'location'
    })
    expect(typeof enzymeWrapper.find(CollectionResultsBody).props().onAddProjectCollection).toEqual('function')
    expect(typeof enzymeWrapper.find(CollectionResultsBody).props().onRemoveCollectionFromProject).toEqual('function')
    expect(typeof enzymeWrapper.find(CollectionResultsBody).props().onViewCollectionGranules).toEqual('function')
    expect(typeof enzymeWrapper.find(CollectionResultsBody).props().onViewCollectionDetails).toEqual('function')
  })

  test('loadNextPage calls onChangeCollectionPageNum', () => {
    const { enzymeWrapper, props } = setup()

    const collectionResultsBody = enzymeWrapper.find(CollectionResultsBody)

    collectionResultsBody.prop('loadNextPage')()

    setTimeout(() => {
      expect(props.onChangeCollectionPageNum.mock.calls.length).toBe(1)
      expect(props.onChangeCollectionPageNum.mock.calls[0]).toEqual([2])
    }, 0)
  })
})
