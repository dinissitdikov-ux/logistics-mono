const pool = require('../config/database');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, sku } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (sku) {
      query += ` AND sku ILIKE $${paramCount}`;
      params.push(`%${sku}%`);
      paramCount++;
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json({ products: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const inventoryResult = await pool.query(`
      SELECT i.*, w.name as warehouse_name, w.city
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.product_id = $1
    `, [id]);

    res.json({
      product: result.rows[0],
      inventory_locations: inventoryResult.rows
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      weight,
      dimensions,
      category,
      unit_price
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products (sku, name, description, weight, dimensions, category, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [sku, name, description, weight, dimensions ? JSON.stringify(dimensions) : null, category, unit_price]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['name', 'description', 'weight', 'dimensions', 'category', 'unit_price'];
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'dimensions') {
          updateFields.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          params.push(value);
        }
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await pool.query(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};
