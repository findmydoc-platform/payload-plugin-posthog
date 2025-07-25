import { buildConfig } from 'payload/config'
import { posthogPlugin } from 'payload-plugin-posthog'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
        },
      ],
    },
    {
      slug: 'users',
      auth: true,
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
  ],
  plugins: [
    posthogPlugin({
      // Configuration will be read from environment variables
      // POSTHOG_PROJECT_API_KEY and POSTHOG_HOST
    }),
  ],
})