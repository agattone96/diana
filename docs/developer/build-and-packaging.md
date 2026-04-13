# Build and Packaging

## Web build (Expo export)

The web bundle for Netlify is produced via:

```bash
cd frontend
npx expo export --platform web
```

Output: `frontend/dist/`

## Mobile builds

Mobile packaging depends on your Expo / EAS workflow and signing setup. This repository does not include store signing credentials.

