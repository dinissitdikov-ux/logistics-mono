const pool = require('../config/database');

exports.getAllVehicles = async (req, res) => {
  try {
    const { status, vehicle_type } = req.query;

    let query = `
      SELECT v.*, u.full_name as driver_name, u.email as driver_email
      FROM vehicles v
      LEFT JOIN users u ON v.assigned_driver_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND v.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (vehicle_type) {
      query += ` AND v.vehicle_type = $${paramCount}`;
      params.push(vehicle_type);
      paramCount++;
    }

    query += ` ORDER BY v.vehicle_number`;

    const result = await pool.query(query, params);
    res.json({ vehicles: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT v.*, u.full_name as driver_name, u.email as driver_email, u.phone as driver_phone
       FROM vehicles v
       LEFT JOIN users u ON v.assigned_driver_id = u.id
       WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      make,
      model,
      year,
      license_plate,
      capacity_weight,
      capacity_volume,
      assigned_driver_id
    } = req.body;

    const result = await pool.query(
      `INSERT INTO vehicles (vehicle_number, vehicle_type, make, model, year, 
       license_plate, capacity_weight, capacity_volume, assigned_driver_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'available') RETURNING *`,
      [vehicle_number, vehicle_type, make, model, year, license_plate, 
       capacity_weight, capacity_volume, assigned_driver_id]
    );

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      current_location,
      assigned_driver_id,
      capacity_weight,
      capacity_volume
    } = req.body;

    const updateFields = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      updateFields.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (current_location) {
      updateFields.push(`current_location = $${paramCount}`);
      params.push(JSON.stringify(current_location));
      paramCount++;
    }

    if (assigned_driver_id !== undefined) {
      updateFields.push(`assigned_driver_id = $${paramCount}`);
      params.push(assigned_driver_id);
      paramCount++;
    }

    if (capacity_weight !== undefined) {
      updateFields.push(`capacity_weight = $${paramCount}`);
      params.push(capacity_weight);
      paramCount++;
    }

    if (capacity_volume !== undefined) {
      updateFields.push(`capacity_volume = $${paramCount}`);
      params.push(capacity_volume);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await pool.query(
      `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle updated successfully', vehicle: result.rows[0] });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};
