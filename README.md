# payload-plugin-posthog

A Payload CMS plugin that automatically tracks collection changes and admin logins using PostHog analytics.

## Features

- 🚀 **Automatic Event Tracking**: Tracks all collection create, update, and delete operations
- 🔐 **Admin Login Tracking**: Monitors admin user logins with user identification
- ⚙️ **Easy Configuration**: Simple setup with environment variables
- 🎯 **User Identification**: Automatic user identification and property setting
- 📊 **Rich Event Data**: Includes user context, operation type, and document data

## Installation

```bash
npm install payload-plugin-posthog
# or
yarn add payload-plugin-posthog
```

## Quick Start

### 1. Environment Variables

Set up your PostHog configuration in your environment:

```bash
# Required
POSTHOG_PROJECT_API_KEY=your_project_api_key

# Optional (defaults to https://eu.posthog.com)
POSTHOG_HOST=https://app.posthog.com  # or your self-hosted instance
```

### 2. Add to Payload Config

```typescript
import { buildConfig } from 'payload/config'
import { posthogPlugin } from 'payload-plugin-posthog'

export default buildConfig({
  // ... your existing config
  plugins: [
    posthogPlugin({
      // Optional: override environment variables
      // apiKey: 'your_api_key',
      // host: 'https://app.posthog.com'
    })
  ]
})
```

### 3. That's it! 🎉

The plugin will now automatically track:

- **Collection Events**: `posts_created`, `users_updated`, `pages_deleted`, etc.
- **Admin Logins**: `admin_login` events with user identification

## Event Types

### Collection Events

For each collection operation, events are sent with the following naming pattern:
- `{collection_slug}_created`
- `{collection_slug}_updated` 
- `{collection_slug}_deleted`

**Event Properties:**
```typescript
{
  id: string,           // Document ID
  userId: string | null, // User performing the action (if authenticated)
  data: object,         // Full document data
  timestamp: string     // ISO timestamp
}
```

### Login Events

**Event Name:** `admin_login`

**Event Properties:**
```typescript
{
  userId: string,    // User ID
  email: string,     // User email
  loginTime: string, // ISO timestamp
  timestamp: string  // ISO timestamp
}
```

## User Identification

The plugin automatically identifies users using their Payload user ID as the `distinctId`. On login, additional user properties (like email) are set in PostHog.

## Configuration Options

```typescript
posthogPlugin({
  apiKey?: string,    // Override POSTHOG_PROJECT_API_KEY env var
  host?: string       // Override POSTHOG_HOST env var
})
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTHOG_PROJECT_API_KEY` | Yes | - | Your PostHog project API key |
| `POSTHOG_HOST` | No | `https://eu.posthog.com` | PostHog instance URL |

## Error Handling

The plugin includes comprehensive error handling:
- Gracefully disables if PostHog API key is not provided
- Logs warnings and errors to console without breaking your app
- Wraps all PostHog calls in try-catch blocks

## License

MIT
