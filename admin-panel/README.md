# TechStore Admin Panel

A modular, framework-free Admin Panel in the existing `ecommerce-frontend` repository. It uses HTML, CSS and JavaScript ES modules and calls backend APIs through same-origin Nginx routes.

## Structure

```text
admin-panel/
├── index.html          # Page layout and navigation
├── assets/
│   └── admin.css       # Responsive layout and component styles
├── js/
│   ├── api.js          # Fetch wrapper, session and service API functions
│   └── app.js          # Access guard, navigation, rendering and page actions
└── README.md           # Architecture and API integration notes
```

## Why each file exists

- `index.html`: semantic page shell, navigation, tables, forms and page containers.
- `assets/admin.css`: one responsive stylesheet; keeps visual design separate from application logic.
- `js/api.js`: one place for API paths, cookie-based requests, JSON parsing and service health checks.
- `js/app.js`: application state, owner/product-manager authorization, page navigation and live data rendering.
- `README.md`: documents the service contract and deployment assumptions.

## Backend routes currently assumed

| Feature | Same-origin API | Current integration |
|---|---|---|
| Admin identity | `GET /api/auth/me` | Existing Auth Service |
| Sign out | `POST /api/auth/logout` | Existing Auth Service |
| Product list | `GET /api/products/admin` | Existing Product API |
| Product create | `POST /api/products` JSON | Requires Product Service JSON route |
| Orders | `GET /api/orders` | Existing route; confirm gateway target |
| Customers | `GET /api/users` | Existing monolith route; migrate to Auth/User admin API |

Inventory, payment history and notification history are deliberately marked as pending until their services expose authenticated admin endpoints. Health URLs are proposed placeholders; a 404 means the service health route has not been implemented, not that the service is down.

## Security and architecture requirements

1. Browser requests use same-origin URLs and `credentials: "same-origin"`; Nginx routes requests to private localhost service ports.
2. Every admin API must independently verify the session and role. Hiding a page in the browser is not authorization.
3. Do not expose ports 3001–3008 directly to the public internet. Expose Nginx only.
4. Do not use the old monolith as the final API dependency. Move each API to its owning microservice before removing port 3000.
5. Use an API gateway route map and health endpoints that match the actual Express route mounts before enabling the health dashboard.
6. Product image upload is not included in this first panel scaffold. Integrate it only after Image Service authentication, upload limits, and a secure product-image contract are implemented.

## Current limitations

This is the first modular Admin Panel implementation. Product listing, product creation, order listing and customer listing require the documented API contracts. Inventory adjustments, payment history, notification history, product editing/deactivation, and full service health monitoring need backend endpoints and authorization before they can be enabled. The UI intentionally does not display fabricated business data.

## Deployment

From the EC2 frontend directory, pull the repository's main branch. The static directory is served at `/admin-panel/` when the Nginx document root is the frontend root. Before enabling it in production, verify that the Nginx API locations point to the intended microservices and that all admin routes enforce authorization.
