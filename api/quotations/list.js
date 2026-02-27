// GET /api/quotations/list - List all quotations
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
    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await sql`SELECT COUNT(*) as total FROM quotations`;
    const total = parseInt(countResult.rows[0].total);

    // Get quotations (exclude products JSON for list view)
    const result = await sql`
      SELECT 
        id,
        doc_number,
        customer_company,
        customer_name,
        total_qty,
        total_usd,
        created_at
      FROM quotations
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching quotations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
