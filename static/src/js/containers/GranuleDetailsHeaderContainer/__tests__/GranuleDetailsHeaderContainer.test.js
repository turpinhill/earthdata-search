import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import { GranuleDetailsHeaderContainer } from '../GranuleDetailsHeaderContainer'
import GranuleDetailsHeader from '../../../components/GranuleDetails/GranuleDetailsHeader'

Enzyme.configure({ adapter: new Adapter() })

function setup() {
  const props = {
    granuleMetadata: {
      metadataUrls: {
        atom: 'https://cmr.earthdata.nasa.gov/search/concepts/focusedGranule.atom'
      }
    },
    location: {
      data: 'data'
    }
  }

  const enzymeWrapper = shallow(<GranuleDetailsHeaderContainer {...props} />)

  return {
    enzymeWrapper,
    props
  }
}

describe('GranuleDetailsHeaderContainer component', () => {
  test('passes its props and renders a single GranuleDetailsHeader component', () => {
    const { enzymeWrapper } = setup()

    expect(enzymeWrapper.find(GranuleDetailsHeader).length).toBe(1)
    expect(enzymeWrapper.find(GranuleDetailsHeader).props().granuleMetadata).toEqual({
      metadataUrls: {
        atom: 'https://cmr.earthdata.nasa.gov/search/concepts/focusedGranule.atom'
      }
    })
    expect(enzymeWrapper.find(GranuleDetailsHeader).props().location).toEqual({
      data: 'data'
    })
  })
})
