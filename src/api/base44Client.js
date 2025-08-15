import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "689da29bc576e49b6356c2b4", 
  requiresAuth: true // Ensure authentication is required for all operations
});
