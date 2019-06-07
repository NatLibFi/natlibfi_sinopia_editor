// Copyright 2019 Stanford University see LICENSE for license
import shortid from 'shortid'
import selectorReducer, {
  getAllRdf,
  populatePropertyDefaults,
  refreshResourceTemplate,
  setResourceURI,
} from '../../src/reducers/index'
/* eslint import/namespace: 'off' */
import * as inputs from '../../src/reducers/inputs'

describe('getAllRdf()', () => {
  const state = {
    selectorReducer: {
      'resourceTemplate:bf2:Monograph:Work': {
        rdfClass: 'http://id.loc.gov/ontologies/bibframe/Work',
        'http://id.loc.gov/ontologies/bibframe/title': {},
      },
    },
  }
  const action = { }

  it('returns a function, which when invoked returns a string', () => {
    const fn = getAllRdf(state, action)

    expect(fn()).toEqual('<> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://id.loc.gov/ontologies/bibframe/Work> .\n')
  })
})

describe('selectorReducer', () => {
  const samplePropertyTemplate = [
    {
      propertyLabel: 'Instance of',
      propertyURI: 'http://id.loc.gov/ontologies/bibframe/instanceOf',
      resourceTemplates: [],
      type: 'resource',
      valueConstraint: {
        valueTemplateRefs: [
          'resourceTemplate:bf2:Monograph:Work',
        ],
        useValuesFrom: [],
        valueDataType: {},
        defaults: [],
      },
      mandatory: 'true',
      repeatable: 'true',
    },
    {
      propertyURI: 'http://id.loc.gov/ontologies/bibframe/issuance',
      propertyLabel: 'Mode of Issuance (RDA 2.13)',
      remark: 'http://access.rdatoolkit.org/2.13.html',
      mandatory: 'true',
      repeatable: 'true',
      type: 'resource',
      resourceTemplates: [],
      valueConstraint: {
        valueTemplateRefs: [],
        useValuesFrom: [
          'https://id.loc.gov/vocabulary/issuance',
        ],
        valueDataType: {
          dataTypeURI: 'http://id.loc.gov/ontologies/bibframe/Issuance',
        },
        editable: 'false',
        repeatable: 'true',
        defaults: [
          {
            defaultURI: 'http://id.loc.gov/vocabulary/issuance/mono',
            defaultLiteral: 'single unit',
          },
        ],
      },
    },
    {
      propertyLabel: 'LITERAL WITH DEFAULT',
      propertyURI: 'http://id.loc.gov/ontologies/bibframe/heldBy',
      resourceTemplates: [],
      type: 'literal',
      valueConstraint: {
        valueTemplateRefs: [],
        useValuesFrom: [],
        valueDataType: {
          dataTypeURI: 'http://id.loc.gov/ontologies/bibframe/Agent',
        },
        defaults: [
          {
            defaultURI: 'http://id.loc.gov/vocabulary/organizations/dlc',
            defaultLiteral: 'DLC',
          },
        ],
      },
      mandatory: 'false',
      repeatable: 'true',
    },
  ]

  const propertyTemplateWithoutConstraint = [
    {
      propertyLabel: 'LITERAL WITH DEFAULT',
      propertyURI: 'http://id.loc.gov/ontologies/bibframe/heldBy',
      resourceTemplates: [],
      type: 'literal',
      mandatory: 'false',
      repeatable: 'true',
    },
  ]

  // Make sure spies/mocks don't leak between tests
  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('handles the initial state', () => {
    expect(
      selectorReducer(undefined, {}),
    ).toMatchObject(
      {
        authenticate: { authenticationState: { currentUser: null, currentSession: null, authenticationError: null } },
        lang: { formData: [] },
        selectorReducer: {},
      },
    )
  })

  it('handles SET_BASE_URL', () => {
    inputs.setBaseURL = jest.fn().mockReturnValue({})
    const oldState = {
      'resourceTemplate:bf2:Monograph:Instance': {
        rdfClass: 'http://id.loc.gov/ontologies/bibframe/Instance',
      },
    }
    const action = {
      type: 'SET_BASE_URL',
      payload: 'http://example.com/base/123',
    }

    selectorReducer({ selectorReducer: oldState }, action)
    expect(inputs.setBaseURL).toBeCalledWith(oldState, action)
  })

  it('handles SET_RESOURCE_TEMPLATE', () => {
    shortid.generate = jest.fn().mockReturnValue(0)
    const result = selectorReducer({
      selectorReducer: {},
    }, {
      type: 'SET_RESOURCE_TEMPLATE',
      payload: {
        id: 'resourceTemplate:bf2:Monograph:Instance',
        resourceURI: 'http://id.loc.gov/ontologies/bibframe/Instance',
        propertyTemplates: samplePropertyTemplate,
      },
    })

    expect(result.authenticate).toMatchObject({ authenticationState: { currentUser: null, currentSession: null, authenticationError: null } })
    expect(result.lang).toMatchObject({ formData: [] })
    expect(result.selectorReducer).toMatchObject({
      'resourceTemplate:bf2:Monograph:Instance':
      {
        rdfClass: 'http://id.loc.gov/ontologies/bibframe/Instance',
        'http://id.loc.gov/ontologies/bibframe/instanceOf': {},
        'http://id.loc.gov/ontologies/bibframe/issuance':
          {
            items:
            [{
              id: 0,
              content: 'single unit',
              uri: 'http://id.loc.gov/vocabulary/issuance/mono',
            }],
          },
        'http://id.loc.gov/ontologies/bibframe/heldBy':
          {
            items:
            [{
              id: 0,
              content: 'DLC',
              uri: 'http://id.loc.gov/vocabulary/organizations/dlc',
            }],
          },
      },
    })
  })

  it('allows SET_RESOURCE_TEMPLATE on templates without valueConstraint', () => {
    shortid.generate = jest.fn().mockReturnValue(0)
    const result = selectorReducer({
      selectorReducer: {},
    }, {
      type: 'SET_RESOURCE_TEMPLATE',
      payload: {
        id: 'resourceTemplate:bf2:Monograph:Instance',
        propertyTemplates: propertyTemplateWithoutConstraint,
      },
    })

    expect(result.selectorReducer).toMatchObject({
      'resourceTemplate:bf2:Monograph:Instance':
      {
        'http://id.loc.gov/ontologies/bibframe/heldBy':
          {},
      },
    })
  })
})

describe('refreshResourceTemplate', () => {
  // Make sure spies/mocks don't leak between tests
  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('passing a payload to an empty state', () => {
    const emptyStateResult = refreshResourceTemplate({}, {
      type: 'REFRESH_RESOURCE_TEMPLATE',
      payload: {
        reduxPath: ['http://sinopia.io/example'],
      },
    })

    expect(emptyStateResult).toEqual({
      'http://sinopia.io/example': {},
    })
  })

  it('missing reduxPath in payload should return the state', () => {
    const missingPayload = refreshResourceTemplate({}, {
      type: 'REFRESH_RESOURCE_TEMPLATE',
      payload: {},
    })

    expect(missingPayload).toEqual({})
  })

  it('tests with a more realistic payload with defaults', () => {
    shortid.generate = jest.fn().mockReturnValue(0)
    const defaultStateResult = refreshResourceTemplate({}, {
      type: 'REFRESH_RESOURCE_TEMPLATE',
      payload: {
        reduxPath: ['resourceTemplate:bf2:Item', 'http://schema.org/name'],
        property: { valueConstraint: { defaults: [{ defaultLiteral: 'Sinopia Name' }] } },
      },
    })

    expect(defaultStateResult).toEqual({
      'resourceTemplate:bf2:Item': {
        'http://schema.org/name': {
          items: [{ content: 'Sinopia Name', id: 0, uri: undefined }],
        },
      },
    })
  })
})

describe('populatePropertyDefaults()', () => {
  it('empty and undefined properties return empty array', () => {
    const undefinedResult = populatePropertyDefaults()

    expect(undefinedResult).toEqual([])
    const nullResult = populatePropertyDefaults(null)

    expect(nullResult).toEqual([])
    const emptyObjectResult = populatePropertyDefaults({})

    expect(emptyObjectResult).toEqual([])
  })

  it('propertyTemplate without defaults returns empty array', () => {
    const simpleProperty = populatePropertyDefaults(
      {
        mandatory: 'false',
        repeatable: 'true',
        type: 'resource',
        resourceTemplates: [],
        valueConstraint: {
          valueTemplateRefs: [
            'resourceTemplate:bf2:Identifiers:LC',
            'resourceTemplate:bf2:Identifiers:DDC',
            'resourceTemplate:bf2:Identifiers:Shelfmark',
          ],
          useValuesFrom: [],
          valueDataType: {},
        },
        propertyURI: 'http://id.loc.gov/ontologies/bibframe/identifiedBy',
        propertyLabel: 'Call numbers',
      },
    )

    expect(simpleProperty).toEqual([])
  })

  it('tests propertyTemplate with defaults returns array with object containing default values', () => {
    const propertyWithDefaults = populatePropertyDefaults(
      {
        propertyLabel: 'LITERAL WITH DEFAULT',
        propertyURI: 'http://id.loc.gov/ontologies/bibframe/heldBy',
        resourceTemplates: [],
        type: 'literal',
        valueConstraint: {
          valueTemplateRefs: [],
          useValuesFrom: [],
          valueDataType: {
            dataTypeURI: 'http://id.loc.gov/ontologies/bibframe/Agent',
          },
          defaults: [
            {
              defaultURI: 'http://id.loc.gov/vocabulary/organizations/dlc',
              defaultLiteral: 'DLC',
            },
          ],
        },
        mandatory: 'false',
        repeatable: 'true',
      },
    )

    expect(propertyWithDefaults).toEqual([{
      content: 'DLC',
      id: 0,
      uri: 'http://id.loc.gov/vocabulary/organizations/dlc',
    }])
  })

  describe('handles SET_RESOURCE_URI', () => {
    const state = {
      'resourceTemplate:bf2:Monograph:Work': {
        'http://id.loc.gov/ontologies/bibframe/title': {},
      },
    }

    it('adds rdfClass to state', () => {
      const newState = setResourceURI(state, {
        type: 'SET_RESOURCE_URI',
        payload: {
          reduxPath: ['resourceTemplate:bf2:Monograph:Work'],
          resourceURI: 'http://id.loc.gov/ontologies/bibframe/Work',
        },
      })

      expect(newState).toEqual({
        'resourceTemplate:bf2:Monograph:Work': {
          'http://id.loc.gov/ontologies/bibframe/title': {},
          rdfClass: 'http://id.loc.gov/ontologies/bibframe/Work',
        },
      })
    })
  })
})
