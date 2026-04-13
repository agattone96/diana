# Privacy, Data, and Permissions

## Data stored by the backend

The backend stores (per account):
- your household defaults (profile)
- inventory items and locations
- required items
- current weekly plan and saved history

## AI features

When AI features are used (plan generation, recipe replacement, photo inventory extraction), the backend sends a derived prompt payload to its configured AI provider.

What may be included:
- household defaults and weekly preferences
- inventory item names (and related metadata like quantities/locations)
- required item names (and related metadata)
- for photo extraction: an encoded image payload

The system is not intended for sensitive personal data. Do not upload or enter:
- payment card data
- government IDs
- medical data

## Permissions (mobile)

Depending on platform and features used, the app may request:
- camera / photo library access (for photo extraction)

