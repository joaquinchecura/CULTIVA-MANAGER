import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function GET() {
  try {
    const response = await clerkClient.users.getUserList()
    
    // En la nueva versión, getUserList() devuelve { data: User[], totalCount: number }
    const simplifiedUsers = response.data.map(user => ({
      id: user.id,
      emailAddresses: user.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
      firstName: user.firstName,
      lastName: user.lastName,
    }))

    return NextResponse.json(simplifiedUsers)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}