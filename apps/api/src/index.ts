import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { healthRoutes } from './routes/health'
import { statsRoutes } from './routes/stats'
import { transferRoutes } from './routes/transfers'
import { vaultRoutes } from './routes/vault'
import { lpRoutes } from './routes/lp'
import { webhookRoutes } from './routes/webhooks'
import { rateRoutes } from './routes/rate'
import { explorerRoutes } from './routes/explorer'
import { faucetRoutes } from './routes/faucet'
import { startSettlementScheduler } from './services/settler'

const app = Fastify({ logger: true })

async function main() {
  await app.register(cors, { origin: true })
  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(healthRoutes)
  await app.register(statsRoutes)
  await app.register(transferRoutes)
  await app.register(vaultRoutes)
  await app.register(lpRoutes)
  await app.register(webhookRoutes)
  await app.register(rateRoutes)
  await app.register(explorerRoutes)
  await app.register(faucetRoutes)

  startSettlementScheduler()

  const port = Number(process.env.API_PORT ?? 3001)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`[api] Listening on port ${port}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
