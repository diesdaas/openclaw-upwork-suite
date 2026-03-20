# Upwork GraphQL Runbook

## Basis

Endpoint:
https://api.upwork.com/graphql

Headers:
Authorization: Bearer YOUR_ACCESS_TOKEN
X-Upwork-API-TenantId: YOUR_ORGANIZATION_ID
Content-Type: application/json

Wichtig:
- Immer den errors-Block im Response lesen.
- GraphQL kann bei Fehlern trotzdem HTTP 200 liefern.
- Ohne X-Upwork-API-TenantId nutzt Upwork die Default-Organisation.
- Für alle Fälle wird "Common Entities - Read-Only Access" benötigt.
- Rohdaten nicht länger als 24 Stunden speichern.

## Reihenfolge

1. companySelector testen
2. proposalMetadata testen
3. vendorProposals testen
4. Jobsuche testen
5. Mutation im Schema finden
6. Mutation mit Minimalinput testen
7. Readback über vendorProposal oder vendorProposals machen

## 1) Tenant finden

query CompanySelector {
  companySelector {
    items {
      title
      organizationId
    }
  }
}

Ziel:
- gültige organizationId holen
- als X-Upwork-API-TenantId verwenden

## 2) Read-Scope prüfen

query ProposalMetadata {
  proposalMetadata {
    engagementDurationValues {
      key
      label
    }
    reasons {
      key
      label
    }
  }
}

Wenn das fehlschlägt:
- Token prüfen
- Tenant prüfen
- Scopes prüfen

## 3) Vendor-Proposals Readback testen

query VendorProposals(
  $filter: VendorProposalFilter!,
  $sortAttribute: VendorProposalSortAttribute!,
  $pagination: Pagination!
) {
  vendorProposals(
    filter: $filter,
    sortAttribute: $sortAttribute,
    pagination: $pagination
  ) {
    totalCount
    edges {
      node {
        id
        proposalCoverLetter
        coverLetter
        marketplaceJobPosting {
          id
          title
        }
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}

Beispiel-Variablen:
{
  "filter": {},
  "sortAttribute": "CREATE_DATE_TIME_DESC",
  "pagination": {
    "after": null,
    "first": 10
  }
}

Wenn das fehlschlägt:
- Pflichtargumente prüfen
- Enum-Wert für sortAttribute im Schema nachsehen
- filter/pagination exakt an den Input-Type anpassen

## 4) Jobsuche testen

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

Variablen:
{
  "query": "OpenClaw automation",
  "first": 10
}

Wenn marketplaceJobPostingsSearch nicht existiert:
- im Schema suchen nach:
  - marketplace
  - jobPosting
  - search
  - MarketplaceJobPosting

## 5) Mutation finden

Suche unter Mutation nacheinander nach:
- proposal
- vendorProposal
- jobApplication
- apply
- vendor
- coverLetter
- terms
- marketplaceJobPosting

Bei Kandidatenmutation prüfen:
- exakter Mutationsname
- exakter Input-Type
- Pflichtfelder
- Felder wie:
  - jobPostingId
  - coverLetter
  - proposalCoverLetter
  - terms
  - rateAmount

## 6) Mutation minimal testen

mutation Candidate($input: CANDIDATE_INPUT_TYPE!) {
  CANDIDATE_MUTATION_NAME(input: $input) {
    id
    __typename
  }
}

Beispiel-Variablen:
{
  "input": {
    "jobPostingId": "JOB_ID_HERE",
    "coverLetter": "Hi, your project looks like a strong fit for my current automation and OpenClaw capabilities. I would start by auditing the setup, reproducing the issue, and stabilizing the baseline workflow before optimizing it further."
  }
}

Wichtig:
- Feldnamen exakt aus dem Schema nehmen
- bei Fehlern Pflichtfelder einzeln ergänzen
- nicht raten, sondern Explorer-Input-Type lesen

## 7) Readback

query VendorProposal($id: ID!) {
  vendorProposal(id: $id) {
    id
    proposalCoverLetter
    coverLetter
    marketplaceJobPosting {
      id
      title
    }
    status {
      __typename
    }
  }
}

Oder erneut vendorProposals ausführen.

Ziel:
- prüfen, ob Proposal sichtbar ist
- prüfen, ob Job-Referenz stimmt
- prüfen, ob Cover Letter übernommen wurde

## Fehler-Mapping

Scope-Fehler:
"The client or authentication token doesn't have enough oauth2 permissions/scopes..."
=> Scope fehlt, Query verkleinern, Key/Token prüfen

MissingFieldArgument
=> Pflichtargument fehlt

NullValueForNonNullArgument
=> Pflichtwert ist null oder leer

WrongType
=> falscher Typ oder falscher Enum-Wert

SubSelectionRequired
=> Objektfeld ohne Unterfelder abgefragt

HTTP 429
=> Rate-Limit erreicht, weniger pollen und cachen

HTTP 500
=> serverseitiger/GraphQL-Layer-Fehler, Request vereinfachen und erneut testen

## Guardrails

- Keine Write-Operation ohne explizite User-Freigabe
- Keine Service-Accounts für Write-Operationen
- Ergebnisse lokal cachen, aber nicht länger als 24 Stunden
- Erst Read-Flow stabilisieren, dann Submit aktivieren