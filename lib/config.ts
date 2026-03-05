// Business configuration — sourced from environment variables with fallbacks
export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '51944629513'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`
export const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/hub_lorenzo'
export const PHONE_DISPLAY = process.env.NEXT_PUBLIC_PHONE_DISPLAY || '+51 944 629 513'
