import { useDispatch } from "react-redux"
import {
  fetchSinopiaSearchResults as fetchSinopiaSearchResultsCreator,
  fetchQASearchResults as fetchQASearchResultsCreator,
} from "actionCreators/search"
import { setSearchResults } from "actions/search"
import { sinopiaSearchUri } from "utilities/authorityConfig"
import { useHistory } from "react-router-dom"

const useSearch = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const fetchQASearchResults = (
    queryString,
    uri,
    searchOptions,
    startOfRange
  ) => {
    dispatch(
      fetchQASearchResultsCreator(queryString, uri, {
        ...searchOptions,
        startOfRange,
      })
    ).then((response) => {
      if (response) {
        dispatch(
          setSearchResults(
            "resource",
            uri,
            response.results,
            response.totalHits,
            {},
            queryString,
            { startOfRange },
            response.error
          )
        )
      }
    })
  }

  const fetchSinopiaSearchResults = (
    queryString,
    searchOptions,
    startOfRange
  ) => {
    dispatch(
      fetchSinopiaSearchResultsCreator(queryString, {
        ...searchOptions,
        startOfRange,
      })
    ).then((response) => {
      if (response) {
        dispatch(
          setSearchResults(
            "resource",
            sinopiaSearchUri,
            response.results,
            response.totalHits,
            {},
            queryString,
            { startOfRange },
            response.error
          )
        )
      }
    })
  }

  const fetchSearchResults = (
    queryString,
    uri,
    searchOptions,
    startOfRange
  ) => {
    if (uri === sinopiaSearchUri) {
      fetchSinopiaSearchResults(queryString, searchOptions, startOfRange)
    } else {
      fetchQASearchResults(queryString, uri, searchOptions, startOfRange)
    }
  }

  const fetchNewSearchResults = (queryString, uri, searchOptions = {}) => {
    fetchSearchResults(queryString, uri, searchOptions, 0)
    history.push("/search")
  }

  return { fetchSearchResults, fetchNewSearchResults }
}

export default useSearch
