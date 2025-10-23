const pool = require('../config/database');

exports.getInventory = async (req, res) => {
  try {
    const { warehouse_id, product_id, low_stock } = req.query;

    let query = `
      SELECT i.*, w.name as warehouse_name, w.city as warehouse_city,
             p.sku, p.name as product_name, p.category
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN products p ON i.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (warehouse_id) {
      query += ` AND i.warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
      paramCount++;
    }

    if (product_id) {
      query += ` AND i.product_id = $${paramCount}`;
      params.push(product_id);
      paramCount++;
    }

    if (low_stock === 'true') {
      query += ` AND i.quantity <= i.min_stock_level`;
    }

    query += ` ORDER BY w.name, p.name`;

    const result = await pool.query(query, params);
    res.json({ inventory: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { warehouse_id, product_id, quantity, min_stock_level, max_stock_level } = req.body;

    const existing = await pool.query(
      'SELECT * FROM inventory WHERE warehouse_id = $1 AND product_id = $2',
      [warehouse_id, product_id]
    );

    let result;
    if (existing.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO inventory (warehouse_id, product_id, quantity, min_stock_level, max_stock_level, last_restocked)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
        [warehouse_id, product_id, quantity, min_stock_level || 0, max_stock_level]
      );
    } else {
      result = await pool.query(
        `UPDATE inventory SET quantity = quantity + $3, 
         min_stock_level = COALESCE($4, min_stock_level),
         max_stock_level = COALESCE($5, max_stock_level),
         last_restocked = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
         WHERE warehouse_id = $1 AND product_id = $2 RETURNING *`,
        [warehouse_id, product_id, quantity, min_stock_level, max_stock_level]
      );
    }

    res.json({ message: 'Inventory updated successfully', inventory: result.rows[0] });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { warehouse_id, product_id, quantity } = req.query;

    const result = await pool.query(
      `SELECT (quantity - reserved_quantity) as available_quantity
       FROM inventory
       WHERE warehouse_id = $1 AND product_id = $2`,
      [warehouse_id, product_id]
    );

    if (result.rows.length === 0) {
      return res.json({ available: false, available_quantity: 0 });
    }

    const available_quantity = result.rows[0].available_quantity;
    const requested_quantity = parseInt(quantity || 0);

    res.json({
      available: available_quantity >= requested_quantity,
      available_quantity,
      requested_quantity
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};
