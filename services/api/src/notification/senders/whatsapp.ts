// WhatsApp sender — uses the Meta Cloud API in production.
// In development (when WHATSAPP_TOKEN is not set), messages are printed to the console.
export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const token   = process.env.WHATSAPP_TOKEN;
  const apiUrl  = process.env.WHATSAPP_API_URL;

  if (!token || !apiUrl) {
    // Dev mode — just log it
    console.log(`[whatsapp mock] → ${to}: ${message}`);
    return;
  }

  const res = await fetch(`${apiUrl}/messages`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${body}`);
  }
}
