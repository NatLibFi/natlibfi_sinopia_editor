// Copyright 2019 Stanford University see LICENSE for license

/**
 * @param {Object} state the previous redux state
 * @param {Object} action the payload of the action is the this of search results
 * @return {Object} the next redux state
 */
const showSearchResults = (state, action) => {
  const newState = { ...state }

  newState.search.results = action.payload.searchResults
  newState.search.totalResults = action.payload.totalResults

  return newState
}

export default showSearchResults
