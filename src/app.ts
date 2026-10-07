import 'dotenv/config'
import express, {
  type Application,
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes.js'
import leadRoutes from './modules/leads/lead.routes.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' })
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)

  if (err?.code === 'P2022' || err?.code === 'P2021') {
    res.status(500).json({
      success: false,
      message:
        'Database schema is out of date. Run `npx prisma migrate deploy` and restart the server.',
    })
    return
  }

  res.status(500).json({ success: false, message: 'Internal server error' })
}

const app: Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) =>
  res.json({ success: true, message: 'LSHS CRM OK' })
)

app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

// Start server (since dev runs src/app.ts directly)
const start = async () => {
  try {
    await prisma.$connect()
    console.log('✓ Database connected')

    app.listen(env.port, () => {
      console.log(`🚀 LSHS CRM running on http://localhost:${env.port}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()

export default app