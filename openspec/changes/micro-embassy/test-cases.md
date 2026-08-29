# Micro-Embassy Test Cases

## Scenario: Traveler reports an incident

Given the home page is loaded
When the traveler enters nationality, location, loss date, and planned departure
Then evidence upload appears only after the incident is recorded

## Scenario: Official recovery route is matched

Given the traveler is French and currently in Barcelona
When a reviewed case is created
Then the Recovery Action Board identifies the French Consulate General in Barcelona
And every procedural claim links to an official government source

## Scenario: Preparation is not presented as submission

Given the action board is open
Then the overall state is Not submitted
And copying the prepared contact message does not change the state to Sent or Delivered
And no acknowledgement is claimed without a reference

## Scenario: Different people cannot share one case

Given one document is confirmed for Maya Laurent
And another is confirmed for Maria Ivanova
Then Micro-Embassy reports an identity conflict
And case creation remains disabled

## Scenario: Recipient links require explicit authorization

Given two reviewed documents belong to the same traveler
When only Police and Airline are selected
Then the dashboard contains exactly two recipient links
And Consulate and Hotel links are absent

## Scenario: Purpose-bound evidence remains secondary

Given the Recovery Action Board is open
When the traveler expands evidence sharing controls
Then selected recipients receive different allowlisted views
And hidden fields remain protected

## Scenario: Mobile layout remains usable

Given a viewport width of 390 pixels
When the incident, evidence, and action-board stages are opened
Then primary actions remain visible without horizontal scrolling
