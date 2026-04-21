import type { FastifyRequest, FastifyReply } from 'fastify'
import { privy } from '../lib/privy'
import { prisma } from '../lib/prisma'

declare module 'fastify' {
  interface FastifyRequest {
    privyUserId?: string
    userId?: string
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const claims = await privy.verifyAuthToken(token)
    req.privyUserId = claims.userId

    let user = await prisma.user.findUnique({ where: { privyUserId: claims.userId } })

    if (!user) {
      const privyUser = await privy.getUser(claims.userId)
      const solanaWallet = privyUser.linkedAccounts.find(
        (a: any) => a.type === 'wallet' && a.chainType === 'solana'
      ) as any

      user = await prisma.user.create({
        data: {
          privyUserId: claims.userId,
          email: (privyUser as any).email?.address ?? null,
          phone: (privyUser as any).phone?.number ?? null,
          solanaPubkey: solanaWallet?.address ?? null,
        },
      })
    }

    req.userId = user.id
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}
