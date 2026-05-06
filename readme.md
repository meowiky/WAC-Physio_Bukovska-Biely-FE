# WAC Physio UFE

Stencil microfrontend for the Physio rehabilitation management API.

## Commands

- `npm install`
- `npm run build`
- `npm run start`

Start the real API first. The local dev page uses `http://localhost:8080/api`.

The app expects the API base URL through the `api-base` property:

```html
<wac-physio-app api-base="http://localhost:8080/api" base-path="/physio/"></wac-physio-app>
```
