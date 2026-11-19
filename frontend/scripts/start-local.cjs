// Cross-platform local entrypoint: Windows cmd/PowerShell, macOS and Linux.
const server='https://api.mlkino.com'

function configureLocalEnvironment(env,forceServer=false) {
    env.PORT=env.PORT || '3000'
    env.REACT_APP_API_URL=forceServer?server:(env.REACT_APP_API_URL || server)
    const target=new URL(env.REACT_APP_API_URL)
    const proxy=target.protocol==='https:'&&['api.mlkino.com','mlkino.com'].includes(target.hostname)
    return {port:env.PORT,apiOrigin:target.origin,proxy}
}

if(require.main===module) {
    process.env.BABEL_ENV='development'
    process.env.NODE_ENV='development'
    // Load the project's normal .env files before selecting defaults.
    require('react-scripts/config/env')
    const effective=configureLocalEnvironment(process.env,process.argv.includes('--server'))
    console.log(`[local] Port ${effective.port}; API ${effective.proxy?'same-origin /api proxy to':'direct'} ${effective.apiOrigin}`)
    require('react-scripts/scripts/start')
}

module.exports={configureLocalEnvironment}
