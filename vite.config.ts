import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'


// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isVercel = env.VERCEL === '1'
  return {
    plugins: [tsconfigPaths(), react()],
    define: {
      buildDate: JSON.stringify(new Date().toISOString()),
      ...(isVercel ? {
        vercel: {
          deploymentId: env.VERCEL_DEPLOYMENT_ID,
          gitProvider: env.VERCEL_GIT_PROVIDER,
          repoSlug: env.VERCEL_GIT_REPO_SLUG,
          repoOwner: env.VERCEL_GIT_REPO_OWNER,
          commitBranch: env.VERCEL_GIT_COMMIT_REF,
          commitSha: env.VERCEL_GIT_COMMIT_SHA,
        }
      } : {})
    }
  }
})
