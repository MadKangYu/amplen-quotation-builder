// GET /api/quotations/get?id=xxx - Get single quotation by ID
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = await sql`
      SELECT * FROM quotations WHERE id = ${parseInt(id)}
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Parse products JSON
    const quotation = result.rows[0];
    if (typeof quotation.products === 'string') {
      quotation.products = JSON.parse(quotation.products);
    }

    return res.status(200).json({
      success: true,
      data: quotation
    });

  } catch (error) {
    console.error('Error fetching quotation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
