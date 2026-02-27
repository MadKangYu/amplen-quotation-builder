// POST /api/quotations/save - Save a new quotation
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      doc_number,
      customer_company,
      customer_name,
      customer_contact,
      customer_notes,
      products,
      total_qty,
      total_usd
    } = req.body;

    // Validate required fields
    if (!doc_number || !products) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get client IP
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Insert into database
    const result = await sql`
      INSERT INTO quotations (
        doc_number,
        customer_company,
        customer_name,
        customer_contact,
        customer_notes,
        products,
        total_qty,
        total_usd,
        ip_address
      ) VALUES (
        ${doc_number},
        ${customer_company || null},
        ${customer_name || null},
        ${customer_contact || null},
        ${customer_notes || null},
        ${JSON.stringify(products)},
        ${total_qty || 0},
        ${total_usd || 0},
        ${ip_address}
      )
      RETURNING id, doc_number, created_at
    `;

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving quotation:', error);
    
    // Handle duplicate doc_number
    if (error.message?.includes('unique constraint')) {
      return res.status(409).json({ error: 'Document number already exists' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
