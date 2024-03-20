import React from 'react';

const AppVersion = () => {
  const env = import.meta.env;
  console.log(env)
  return (
    <div style={{
      // float on bottom left
      position: 'fixed',
      bottom: '0',
      left: '0',
      padding: '10px',
      color: 'gray',
    }}>
      {env.VITE_VERCEL_ENV ?
          <a href={`https://github.com/${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_OWNER}/commit/${env.VERCEL_GIT_COMMIT_SHA}`}>{env.VITE_VERCEL_ENV}:vercel:{env.VERCEL_GIT_PROVIDER}:{env.VERCEL_GIT_COMMIT_REF}/{env.VERCEL_GIT_COMMIT_SHA.toString().substring(0, 7)}</a>
        : <span>Development</span>
      }
    </div>
  );
};

export default AppVersion;