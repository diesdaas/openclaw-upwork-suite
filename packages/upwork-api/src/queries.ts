export const MARKETPLACE_JOB_SEARCH_QUERY = `
query SearchJobs($query: String!, $first: Int!) {
  marketplaceJobPostingsSearch(query: $query, first: $first) {
    edges {
      node {
        id
        title
        description
        createdDateTime
        url
      }
    }
  }
}
`;
