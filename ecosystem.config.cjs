module.exports = {
  apps: [
    {
      name: 'grabbe-ldap-manager',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max', // Nutzt alle CPU-Kerne (Cluster Mode)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
