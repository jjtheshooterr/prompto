import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface ForkNotificationParams {
  authorEmail: string
  authorName: string
  forkerName: string
  promptTitle: string
  forkedPromptLink: string
}

export async function sendForkNotification({
  authorEmail,
  authorName,
  forkerName,
  promptTitle,
  forkedPromptLink,
}: ForkNotificationParams) {
  // Skip if Resend is not configured
  if (!resend) {
    console.log('Resend not configured, skipping fork notification email')
    return { success: true, skipped: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Promptvexity <notifications@promptvexity.com>',
      to: authorEmail,
      subject: '[Promptvexity] Your prompt was forked!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Hi ${authorName},</p>
          
          <p>${forkerName} just forked your prompt <strong>"${promptTitle}"</strong>.</p>
          
          <p>
            <a href="${forkedPromptLink}" style="color: #0066cc; text-decoration: none;">
              See how your prompt evolves →
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 32px;">
            —<br/>
            Promptvexity Team
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send fork notification:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send fork notification:', error)
    return { success: false, error }
  }
}
