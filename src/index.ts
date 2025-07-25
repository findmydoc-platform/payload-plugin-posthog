import type { Config, Plugin } from 'payload/config'
import type { PayloadRequest } from 'payload/types'
import { PostHog } from 'posthog-node'

export interface PostHogPluginConfig {
  apiKey?: string
  host?: string
}

let postHogClient: PostHog | null = null

const initializePostHog = (config: PostHogPluginConfig): PostHog | null => {
  const apiKey = config.apiKey || process.env.POSTHOG_PROJECT_API_KEY
  const host = config.host || process.env.POSTHOG_HOST || 'https://eu.posthog.com'

  if (!apiKey) {
    console.warn('PostHog Plugin: POSTHOG_PROJECT_API_KEY is not configured. Plugin will be disabled.')
    return null
  }

  if (!postHogClient) {
    postHogClient = new PostHog(apiKey, { host })
    console.log('PostHog Plugin: Initialized successfully')
  }

  return postHogClient
}

const getDistinctId = (req: PayloadRequest): string => {
  return req.user?.id?.toString() || 'system'
}

const identifyUser = (req: PayloadRequest): void => {
  if (!postHogClient || !req.user) return

  const distinctId = getDistinctId(req)
  const userProperties: Record<string, any> = {}

  if (req.user.email) {
    userProperties.email = req.user.email
  }

  postHogClient.identify({
    distinctId,
    properties: userProperties
  })
}

const captureEvent = (req: PayloadRequest, event: string, properties: Record<string, any> = {}): void => {
  if (!postHogClient) return

  const distinctId = getDistinctId(req)

  postHogClient.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      userId: req.user?.id || null,
      timestamp: new Date().toISOString()
    }
  })
}

export const posthogPlugin = (pluginConfig: PostHogPluginConfig = {}): Plugin => {
  return (config: Config): Config => {
    // Initialize PostHog client
    const client = initializePostHog(pluginConfig)
    
    if (!client) {
      // Return config unchanged if PostHog is not configured
      return config
    }

    // Clone the existing config to avoid mutations
    const updatedConfig: Config = { ...config }

    // Ensure collections array exists
    if (!updatedConfig.collections) {
      updatedConfig.collections = []
    }

    // Add hooks to all collections
    updatedConfig.collections = updatedConfig.collections.map((collection) => {
      const updatedCollection = { ...collection }

      // Ensure hooks object exists
      if (!updatedCollection.hooks) {
        updatedCollection.hooks = {}
      }

      // Add afterChange hook
      const existingAfterChange = updatedCollection.hooks.afterChange || []
      updatedCollection.hooks.afterChange = [
        ...existingAfterChange,
        ({ doc, req, operation }) => {
          try {
            const eventName = `${collection.slug}_${operation}`
            const properties = {
              id: doc.id,
              data: doc
            }
            captureEvent(req, eventName, properties)
          } catch (error) {
            console.error('PostHog Plugin: Error capturing collection event:', error)
          }
        }
      ]

      // Add afterLogin hook for auth collections
      if (collection.auth) {
        const existingAfterLogin = updatedCollection.hooks.afterLogin || []
        updatedCollection.hooks.afterLogin = [
          ...existingAfterLogin,
          ({ user, req }) => {
            try {
              // Identify user first
              identifyUser(req)
              
              // Capture login event
              const properties = {
                userId: user.id,
                email: user.email,
                loginTime: new Date().toISOString()
              }
              captureEvent(req, 'admin_login', properties)
            } catch (error) {
              console.error('PostHog Plugin: Error capturing login event:', error)
            }
          }
        ]
      }

      return updatedCollection
    })

    return updatedConfig
  }
}

export default posthogPlugin