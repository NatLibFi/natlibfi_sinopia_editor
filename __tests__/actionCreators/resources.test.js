// Copyright 2019 Stanford University see LICENSE for license

import {
  update, existingResource, retrieveResource, newResource,
  stubResourceProperties, publishResource,
} from 'actionCreators/resources'
/* eslint import/namespace: 'off' */
import * as server from 'sinopiaServer'
import { getFixtureResourceTemplate } from '../fixtureLoaderHelper'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import shortid from 'shortid'
import * as resourceTemplateThunks from 'actionCreators/resourceTemplates'

const mockStore = configureMockStore([thunk])
shortid.generate = jest.fn().mockReturnValue('abc123')

const state = {
  selectorReducer: {
    entities: {
      resourceTemplates: {
        'sinopia:profile:bf2:Place': {
          resourceURI: 'http://id.loc.gov/ontologies/bibframe/place',
        },
      },
    },
  }

  const currentUser = {
    getSession: jest.fn(),
  }
  const store = mockStore(state)

describe('update', () => {
  it('dispatches actions when started and finished', async () => {
    server.updateRDFResource = jest.fn().mockResolvedValue(true)

    await store.dispatch(update(currentUser))

    const actions = store.getActions()
    expect(actions.length).toEqual(2)
    expect(actions[0]).toEqual({ type: 'UPDATE_STARTED' })
    expect(actions[1]).toEqual({ type: 'UPDATE_FINISHED', payload: '53ce99f9e4b1132733bae37801cd8000' })
  })
})

describe('retrieveResource', () => {
  const uri = 'http://sinopia.io/repository/stanford/123'
  const received = `<> <http://www.w3.org/2000/01/rdf-schema#label> "splendid"@en .
<> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://id.loc.gov/ontologies/bibframe/Note> .
<> <http://www.w3.org/ns/prov#wasGeneratedBy> "resourceTemplate:bf2:Note" .`

  const state = {
    selectorReducer: {
      entities: {
        resourceTemplates: {},
      },
      resource: {},
    },
  }
  server.loadRDFResource = jest.fn().mockResolvedValue({ response: { text: received } })
  describe('when dispatch to existing resource returns undefined', () => {
    const store = mockStore(state)
    it('it does not dispatch setLastSaveChecksum', async () => {
      resourceTemplateThunks.fetchResourceTemplate = jest.fn().mockResolvedValue(undefined)

      await store.dispatch(retrieveResource(currentUser, uri))

      const actions = store.getActions()
      expect(actions.length).toEqual(1)
      expect(actions[0]).toEqual({ type: 'RETRIEVE_STARTED' })
    })
  })
  describe('when dispatch to existing resource returns a result', () => {
    const store = mockStore(state)
    it('it dispatches actions', async () => {
      const resourceTemplateId = 'resourceTemplate:bf2:Note'
      const templateResponse = await getFixtureResourceTemplate(resourceTemplateId)
      const resourceTemplate = templateResponse.response.body
      resourceTemplateThunks.fetchResourceTemplate = jest.fn().mockResolvedValue(resourceTemplate)

      await store.dispatch(retrieveResource(currentUser, uri))

      const actions = store.getActions()
      expect(actions.length).toEqual(6)
      expect(actions[0]).toEqual({ type: 'RETRIEVE_STARTED' })
      expect(actions[1].type).toEqual('TOGGLE_COLLAPSE')
      const expectedResource = {
        'resourceTemplate:bf2:Note': {
          'http://www.w3.org/2000/01/rdf-schema#label': {
            items: {
              abc123: {
                content: 'splendid',
                lang: 'en',
              },
            },
          },
          resourceURI: 'http://sinopia.io/repository/stanford/123',
        },
      }
      expect(actions[2]).toEqual({ type: 'SET_RESOURCE', payload: { resource: expectedResource, resourceTemplates: { [resourceTemplateId]: resourceTemplate } } })
      expect(actions[3]).toEqual({ type: 'CLEAR_RESOURCE_URI_MESSAGE' })
      expect(actions[4]).toEqual({ type: 'SET_LAST_SAVE_CHECKSUM' })
      expect(actions[5]).toEqual({ type: 'SET_LAST_SAVE_CHECKSUM', payload: 'd7ee91e78c7065b55a0e7df016bd1622' })
    })
  })
})

describe('publishResource', () => {
  const group = 'myGroup'
  const received = `<http://sinopia.io/repository/myGroup/myResource> <http://www.w3.org/2000/01/rdf-schema#label> "splendid"@en .
<> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://id.loc.gov/ontologies/bibframe/Note> .
<> <http://www.w3.org/ns/prov#wasGeneratedBy> "profile:bf2:Note" .`

  it('dispatches actions for happy path', async () => {
    server.publishRDFResource = jest.fn().mockResolvedValue({
      response: {
        headers: { location: 'http://sinopia.io/repository/myGroup/myResource' },
        text: received,
      },
    })

    const dispatch = jest.fn()
    await publishResource(currentUser, group)(dispatch, getState)
    expect(dispatch).toHaveBeenCalledTimes(4)
    expect(dispatch).toBeCalledWith({ type: 'PUBLISH_STARTED' })
    expect(dispatch).toBeCalledWith({ type: 'SET_BASE_URL', payload: 'http://sinopia.io/repository/myGroup/myResource' })
    expect(dispatch).toBeCalledWith({ type: 'SHOW_RESOURCE_URI_MESSAGE', payload: 'http://sinopia.io/repository/myGroup/myResource' })
    expect(dispatch).toBeCalledWith({ type: 'UPDATE_FINISHED', payload: '53ce99f9e4b1132733bae37801cd8000' })
  })
  it('dispatches actions for error path', async () => {
    const dispatch = jest.fn()
    server.publishRDFResource = jest.fn().mockRejectedValue(new Error('publish error'))

    await publishResource(currentUser, group)(dispatch, getState)
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toBeCalledWith({ type: 'PUBLISH_STARTED' })
    expect(dispatch).toBeCalledWith({ type: 'PUBLISH_ERROR', payload: 'Unable to save resource: Error: publish error' })
  })
})

describe('newResource', () => {
  const resourceTemplateId = 'resourceTemplate:bf2:Note'

  const store = mockStore({
    selectorReducer: {
      entities: {
        resourceTemplates: {},
      },
      resource: {
        'resourceTemplate:bf2:Note': {},
      },
    },
  })

  describe('when dispatch to stubResource returns undefined', () => {
    it('dispatches no actions', async () => {
      resourceTemplateThunks.fetchResourceTemplate = jest.fn().mockResolvedValue(undefined)
      await store.dispatch(newResource(resourceTemplateId))
      const actions = store.getActions()
      expect(actions.length).toEqual(0)
    })
  })
  describe('when dispatch to stubResource returns a result', () => {
    it('dispatches actions', async () => {
      const resourceTemplateResponse = await getFixtureResourceTemplate(resourceTemplateId)
      const resourceTemplate = resourceTemplateResponse.response.body
      resourceTemplateThunks.fetchResourceTemplate = jest.fn().mockResolvedValue(resourceTemplate)

      await store.dispatch(newResource(resourceTemplateId))
      const actions = store.getActions()
      expect(actions.length).toEqual(3)
      const expectedResource = { [resourceTemplateId]: { 'http://www.w3.org/2000/01/rdf-schema#label': {} } }
      expect(actions[0]).toEqual({ type: 'SET_RESOURCE', payload: { resource: expectedResource, resourceTemplates: { [resourceTemplateId]: resourceTemplate } } })
      expect(actions[1]).toEqual({ type: 'CLEAR_RESOURCE_URI_MESSAGE' })
      expect(actions[2]).toEqual({ type: 'SET_LAST_SAVE_CHECKSUM', payload: '106763b7f8529bcc234bae22985cef8b' })
    })
  })
})

describe('existingResource', () => {
  const uri = 'http://localhost:8080/repository/stanford/888ea64d-f471-41bf-9d33-c9426ab83b5c'

  const resource = {
    'resourceTemplate:bf2:Note': {},
  }

  const resourceTemplateId = 'resourceTemplate:bf2:Note'

  const store = mockStore({
    selectorReducer: {
      entities: {
        resourceTemplates: { [resourceTemplateId]: {} },
      },
      resource: {},
    },
  })

  describe('when stubResource returns undefined', () => {
    it('dispatches no actions', async () => {
      resourceTemplateThunks.fetchResourceTemplate = jest.fn().mockResolvedValue(undefined)

      await store.dispatch(existingResource(resource, uri))
      const actions = store.getActions()
      expect(actions.length).toEqual(0)
    })
  })
  describe('when stubResource returns a result', () => {
    it('dispatches actions', async () => {
      const resourceTemplateResponse = await getFixtureResourceTemplate(resourceTemplateId)
      const resourceTemplate = resourceTemplateResponse.response.body
      resourceTemplateThunks.fetchResourceTemplate = jest.fn().mockResolvedValue(resourceTemplate)

      await store.dispatch(existingResource(resource, uri))
      const actions = store.getActions()
      expect(actions.length).toEqual(3)
      const expectedResource = {
        'resourceTemplate:bf2:Note': {
          resourceURI: 'http://localhost:8080/repository/stanford/888ea64d-f471-41bf-9d33-c9426ab83b5c',
          'http://www.w3.org/2000/01/rdf-schema#label': {},
        },
      }
      expect(actions[0]).toEqual({ type: 'SET_RESOURCE', payload: { resource: expectedResource, resourceTemplates: { [resourceTemplateId]: resourceTemplate } } })
      expect(actions[1]).toEqual({ type: 'CLEAR_RESOURCE_URI_MESSAGE' })
      expect(actions[2]).toEqual({ type: 'SET_LAST_SAVE_CHECKSUM' })
    })
  })
})

describe('stubResourceProperties', () => {
  beforeEach(() => {
    resourceTemplateThunks.fetchResourceTemplate = async (resourceTemplateId) => {
      const resourceTemplateResponse = await getFixtureResourceTemplate(resourceTemplateId)
      return resourceTemplateResponse.response.body
    }
  })

  describe('resource using defaults', () => {
    let dispatch
    let resource
    let resourceTemplates
    beforeEach(async () => {
      dispatch = jest.fn()
      const result = await stubResourceProperties('resourceTemplate:bf2:Monograph:Instance', {}, {}, ['resource'], true, false, false, dispatch)
      resource = result[0]
      resourceTemplates = result[1]
    })
    it('returns loaded resource templates', () => {
      expect(Object.keys(resourceTemplates)).toEqual(['resourceTemplate:bf2:Monograph:Instance', 'resourceTemplate:bf2:Monograph:Work'])
    })
    it('stubs mandatory properties that are value refs', () => {
      const property = resource['http://id.loc.gov/ontologies/bibframe/instanceOf']
      expect(property).toBeTruthy()
      const nestedResource = property.abc123['resourceTemplate:bf2:Monograph:Work']
      expect(nestedResource['http://id.loc.gov/ontologies/bibframe/temporalCoverage']).toEqual({})
      expect(nestedResource['http://id.loc.gov/ontologies/bibframe/content'].items).toBeTruthy()
      expect(findToggleCollapse(dispatch.mock.calls, [
        'resource',
        'resourceTemplate:bf2:Monograph:Instance',
        'http://id.loc.gov/ontologies/bibframe/instanceOf',
      ]).length).toEqual(1)
      expect(findToggleCollapse(dispatch.mock.calls, [
        'resource',
        'resourceTemplate:bf2:Monograph:Instance',
        'http://id.loc.gov/ontologies/bibframe/instanceOf',
        'abc123',
        'resourceTemplate:bf2:Monograph:Work',
        'http://id.loc.gov/ontologies/bibframe/content',
      ]).length).toEqual(1)
    })
    it('stubs mandatory properties that are property refs', () => {
      // Agent contribution
      expect(resource['http://id.loc.gov/ontologies/bibframe/contribution'].items).toEqual({})
      expect(findToggleCollapse(dispatch.mock.calls, [
        'resource',
        'resourceTemplate:bf2:Monograph:Instance',
        'http://id.loc.gov/ontologies/bibframe/contribution',
      ]).length).toEqual(1)
    })
    it('stubs properties with defaults', () => {
      // Carrier type
      const item = resource['http://id.loc.gov/ontologies/bibframe/carrier'].items.abc123
      expect(item.label).toEqual('volume')
      expect(item.uri).toEqual('http://id.loc.gov/vocabulary/carriers/nc')
      expect(findToggleCollapse(dispatch.mock.calls, [
        'resource',
        'resourceTemplate:bf2:Monograph:Instance',
        'http://id.loc.gov/ontologies/bibframe/carrier',
      ]).length).toEqual(1)
    })
    it('does not stub other properties with defaults', () => {
      // Item information
      expect(resource['http://id.loc.gov/ontologies/bibframe/itemPortion']).toEqual({})
    })
  })
  describe('resource with existing values', () => {
    const existingResource = {
      'http://id.loc.gov/ontologies/bibframe/itemPortion': {
        M16a_G7Zc: {
          'resourceTemplate:bf2:Identifiers:Barcode': {
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#value': {
              items: [
                {
                  id: 'wORfB8Vnvdw',
                  content: '67890',
                  lang: 'en',
                },
              ],
            },
            'http://id.loc.gov/ontologies/bibframe/enumerationAndChronology': {},
          },
        },
      },
    }

    let resource
    let dispatch
    beforeEach(async () => {
      dispatch = jest.fn()
      const result = await stubResourceProperties('resourceTemplate:bf2:Monograph:Instance', {}, existingResource, ['resource'], true, false, false, dispatch)
      resource = result[0]
    })
    it('stubs properties with existing values', () => {
      expect(resource['http://id.loc.gov/ontologies/bibframe/itemPortion']).toEqual(existingResource['http://id.loc.gov/ontologies/bibframe/itemPortion'])

      expect(findToggleCollapse(dispatch.mock.calls, [
        'resource',
        'resourceTemplate:bf2:Monograph:Instance',
        'http://id.loc.gov/ontologies/bibframe/itemPortion',
        'M16a_G7Zc',
        'resourceTemplate:bf2:Identifiers:Barcode',
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#value',
      ]).length).toEqual(1)
      expect(findToggleCollapse(dispatch.mock.calls, [
        'resource',
        'resourceTemplate:bf2:Monograph:Instance',
        'http://id.loc.gov/ontologies/bibframe/itemPortion',
        'M16a_G7Zc',
        'resourceTemplate:bf2:Identifiers:Barcode',
        'http://id.loc.gov/ontologies/bibframe/enumerationAndChronology',
      ]).length).toEqual(1)
    })
  })
  describe('single property of resource', () => {
    let resource
    let dispatch
    beforeEach(async () => {
      dispatch = jest.fn()
      const result = await stubResourceProperties('resourceTemplate:bf2:Monograph:Instance', {}, existingResource, ['resource'], true, false, 'http://id.loc.gov/ontologies/bibframe/itemPortion', dispatch)
      resource = result[0]
    })
    it('stubs that property', () => {
      // Item portion
      expect(resource['http://id.loc.gov/ontologies/bibframe/itemPortion']).toEqual({
        abc123: {
          'resourceTemplate:bf2:Identifiers:Barcode': {
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#value': {
              items: {
                abc123: {
                  content: '12345',
                  lang: 'en',
                },
              },
            },
            'http://id.loc.gov/ontologies/bibframe/enumerationAndChronology': {},
          },
        },
      })

      expect(findToggleCollapse(dispatch.mock.calls, [
        'resource',
        'resourceTemplate:bf2:Monograph:Instance',
        'http://id.loc.gov/ontologies/bibframe/itemPortion',
        'abc123',
        'resourceTemplate:bf2:Identifiers:Barcode',
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#value',
      ]).length).toEqual(1)
    })
    it('does not stub other properties', () => {
      // Instance of
      expect(resource['http://id.loc.gov/ontologies/bibframe/instanceOf']).toEqual(undefined)
    })
  })
})

const findToggleCollapse = (actions, reduxPath) => {
  return actions.filter((action) => {
    return action[0].type === 'TOGGLE_COLLAPSE' && action[0].payload.reduxPath.join(' > ') === reduxPath.join(' > ')
  })
}
