import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Plantilla base para todos los emails
function emailLayout(title: string, content: string, gymName: string = 'Cultiva Fitness') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
          .content { padding: 40px 30px; color: #1e293b; line-height: 1.6; }
          .content h2 { color: #0f172a; margin-top: 0; font-size: 20px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #94a3b8; font-size: 12px; }
          .highlight { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${gymName}</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            ${content}
          </div>
          <div class="footer">
            Este email fue enviado por ${gymName} a través de Cultiva Manager.<br>
            Si no esperabas este mensaje, podés ignorarlo.
          </div>
        </div>
      </body>
    </html>
  `
}

// 1. Email de bienvenida (cuando el alumno se registra)
export async function sendWelcomeEmail(params: {
  to: string
  firstName: string
  gymName: string
  miplanUrl: string
}) {
  try {
    await resend.emails.send({
        from: `${params.gymName} <noreply@cultivafitness.app>`,
      to: params.to,
      subject: `¡Bienvenido/a a ${params.gymName}!`,
      html: emailLayout(
        `¡Hola ${params.firstName}!`,
        `
          <p>Te damos la bienvenida a <strong>${params.gymName}</strong>. Tu cuenta ya está activa.</p>
          <p>Desde la app MIPLAN vas a poder:</p>
          <ul>
            <li>Ver tu rutina de entrenamiento</li>
            <li>Reservar clases grupales</li>
            <li>Registrar tu progreso</li>
            <li>Acceder al gimnasio con tu QR</li>
          </ul>
          <div style="text-align: center;">
            <a href="${params.miplanUrl}" class="button">Abrir MIPLAN</a>
          </div>
          <div class="highlight">
            <p style="margin: 0;"><strong>💡 Tip:</strong> El QR de acceso lo encontrás en la sección "Asistencias" de la app.</p>
          </div>
        `,
        params.gymName
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false }
  }
}

// 2. Email de membresía por vencer
export async function sendMembershipExpiringEmail(params: {
  to: string
  firstName: string
  gymName: string
  planName: string
  endDate: Date
  daysLeft: number
  miplanUrl: string
}) {
  try {
    const formattedDate = params.endDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    })

    await resend.emails.send({
      from: `${params.gymName} <onboarding@resend.dev>`,
      to: params.to,
      subject: `Tu membresía vence en ${params.daysLeft} día${params.daysLeft > 1 ? 's' : ''}`,
      html: emailLayout(
        `Hola ${params.firstName},`,
        `
          <p>Te recordamos que tu plan <strong>${params.planName}</strong> vence el <strong>${formattedDate}</strong>.</p>
          <div class="highlight">
            <p style="margin: 0;"><strong>⏰ Quedan ${params.daysLeft} día${params.daysLeft > 1 ? 's' : ''}</strong> para renovar.</p>
          </div>
          <p>Para no perder el acceso al gimnasio y a las clases, te recomendamos renovar tu membresía.</p>
          <div style="text-align: center;">
            <a href="${params.miplanUrl}/pagos" class="button">Renovar membresía</a>
          </div>
        `,
        params.gymName
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending membership email:', error)
    return { success: false }
  }
}

// 3. Email de rutina nueva asignada
export async function sendNewRoutineEmail(params: {
  to: string
  firstName: string
  gymName: string
  routineName: string
  routineGoal: string
  miplanUrl: string
}) {
  try {
    await resend.emails.send({
      from: `${params.gymName} <onboarding@resend.dev>`,
      to: params.to,
      subject: `Nueva rutina asignada: ${params.routineName}`,
      html: emailLayout(
        `¡Hola ${params.firstName}!`,
        `
          <p>Tu entrenador te asignó una nueva rutina de entrenamiento:</p>
          <div class="highlight">
            <p style="margin: 0;"><strong>📋 ${params.routineName}</strong></p>
            <p style="margin: 8px 0 0 0; color: #64748b;">Objetivo: ${params.routineGoal}</p>
          </div>
          <p>Ingresá a MIPLAN para ver los ejercicios, series y repeticiones.</p>
          <div style="text-align: center;">
            <a href="${params.miplanUrl}/rutina" class="button">Ver mi rutina</a>
          </div>
        `,
        params.gymName
      ),
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending routine email:', error)
    return { success: false }
  }
}