const pool = require('../config/database');

exports.getAllWarehouses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, u.full_name as manager_name, u.email as manager_email
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      ORDER BY w.name
    `);

    res.json({ warehouses: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT w.*, u.full_name as manager_name, u.email as manager_email
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE w.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const inventoryResult = await pool.query(`
      SELECT i.*, p.sku, p.name as product_name, p.category
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.warehouse_id = $1
      ORDER BY p.name
    `, [id]);

    res.json({
      warehouse: result.rows[0],
      inventory: inventoryResult.rows
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      capacity,
      manager_id
    } = req.body;

    const result = await pool.query(
      `INSERT INTO warehouses (name, address, city, state, zip_code, latitude, longitude, capacity, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, address, city, state, zip_code, latitude, longitude, capacity, manager_id]
    );

    res.status(201).json({
      message: 'Warehouse created successfully',
      warehouse: result.rows[0]
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['name', 'address', 'city', 'state', 'zip_code', 'latitude', 'longitude', 'capacity', 'manager_id'];
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await pool.query(
      `UPDATE warehouses SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse updated successfully', warehouse: result.rows[0] });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
};
