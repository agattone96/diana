# Backend API Reference (Developer)

Base paths:
- Health: `/health`
- API: `/api/*`

Authentication:
- Use `Authorization: Bearer <token>` for protected endpoints.

## Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Profile / defaults

- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/profile/reset`

## Inventory

- `GET /api/inventory?location=pantry|fridge|freezer`
- `POST /api/inventory`
- `POST /api/inventory/batch`
- `PUT /api/inventory/{item_id}`
- `DELETE /api/inventory/{item_id}`
- `POST /api/inventory/extract-photo`

## Required items

- `GET /api/required-items`
- `POST /api/required-items`
- `PUT /api/required-items/{item_id}`
- `DELETE /api/required-items/{item_id}`

## Plans and history

- `POST /api/generate-plan`
- `GET /api/current-plan`
- `PUT /api/current-plan`
- `DELETE /api/current-plan/recipe/{recipe_id}`
- `POST /api/regenerate-recipe`
- `GET /api/history`
- `POST /api/history/save`
- `POST /api/history/{history_id}/duplicate`

