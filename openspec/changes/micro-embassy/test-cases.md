# Micro-Embassy Test Cases

## Scenario: Visitor understands the product boundary

Given the home page is loaded
When the visitor reads the hero and case header
Then the page explains that Micro-Embassy is post-incident infrastructure
And it does not present itinerary or travel-planning features

## Scenario: Recipient views disclose different evidence

Given the synthetic emergency case is open
When the traveler selects Police and then Airline
Then the visible shared fields differ
And hidden fields are explicitly represented as protected

## Scenario: Traveler revokes access

Given the selected recipient link is active
When the traveler presses Revoke access
Then the recipient status becomes Revoked
And the preview reports that the link can no longer be opened

## Scenario: Traveler reissues access

Given the selected recipient link is revoked
When the traveler presses Reissue for 30 min
Then the status becomes Active
And the expiration is reset to 30 minutes

## Scenario: Mobile layout remains usable

Given a viewport width of 390 pixels
When the dashboard is loaded
Then recipient controls and the primary action remain visible without horizontal scrolling
