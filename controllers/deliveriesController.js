const pool = require('../config/database');

exports.createDelivery = async (req, res) => {
  try {
    const {
      order_id,
      vehicle_id,
      driver_id,
      scheduled_pickup_time,
      scheduled_delivery_time
    } = req.body;

    const deliveryNumber = `DEL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO deliveries (delivery_number, order_id, vehicle_id, driver_id, 
       scheduled_pickup_time, scheduled_delivery_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled') 
       RETURNING *`,
      [deliveryNumber, order_id, vehicle_id, driver_id, scheduled_pickup_time, scheduled_delivery_time]
    );

    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['confirmed', order_id]
    );

    await pool.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2',
      ['in_transit', vehicle_id]
    );

    res.status(201).json({
      message: 'Delivery created successfully',
      delivery: result.rows[0]
    });
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
};

exports.getAllDeliveries = async (req, res) => {
  try {
    const { status, driver_id, vehicle_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT d.*, o.order_number, o.delivery_address,
             v.vehicle_number, v.vehicle_type,
             u.full_name as driver_name
      FROM deliveries d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      LEFT JOIN users u ON d.driver_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND d.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (driver_id) {
      query += ` AND d.driver_id = $${paramCount}`;
      params.push(driver_id);
      paramCount++;
    }

    if (vehicle_id) {
      query += ` AND d.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ deliveries: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};

exports.getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT d.*, o.order_number, o.delivery_address, o.customer_id,
              c.name as customer_name,
              v.vehicle_number, v.vehicle_type,
              u.full_name as driver_name, u.email as driver_email
       FROM deliveries d
       LEFT JOIN orders o ON d.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN vehicles v ON d.vehicle_id = v.id
       LEFT JOIN users u ON d.driver_id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const trackingResult = await pool.query(
      `SELECT te.*, u.full_name as created_by_name
       FROM tracking_events te
       LEFT JOIN users u ON te.created_by = u.id
       WHERE te.delivery_id = $1
       ORDER BY te.created_at DESC`,
      [id]
    );

    res.json({
      delivery: result.rows[0],
      tracking_events: trackingResult.rows
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, current_location, delivery_notes } = req.body;

    const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    let paramCount = 2;

    if (current_location) {
      updateFields.push(`current_location = $${paramCount}`);
      params.push(JSON.stringify(current_location));
      paramCount++;
    }

    if (delivery_notes) {
      updateFields.push(`delivery_notes = $${paramCount}`);
      params.push(delivery_notes);
      paramCount++;
    }

    if (status === 'picked_up') {
      updateFields.push(`actual_pickup_time = CURRENT_TIMESTAMP`);
    } else if (status === 'delivered') {
      updateFields.push(`actual_delivery_time = CURRENT_TIMESTAMP`);
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE deliveries SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    await pool.query(
      `INSERT INTO tracking_events (delivery_id, event_type, event_description, location, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, status, `Delivery status updated to ${status}`, 
       current_location ? JSON.stringify(current_location) : null, req.user.id]
    );

    if (status === 'delivered') {
      const delivery = result.rows[0];
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['delivered', delivery.order_id]);
      await pool.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['available', delivery.vehicle_id]);
    }

    res.json({ message: 'Delivery updated successfully', delivery: result.rows[0] });
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ error: 'Failed to update delivery' });
  }
};

exports.addTrackingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_type, event_description, location } = req.body;

    const result = await pool.query(
      `INSERT INTO tracking_events (delivery_id, event_type, event_description, location, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, event_type, event_description, location ? JSON.stringify(location) : null, req.user.id]
    );

    res.status(201).json({
      message: 'Tracking event added successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Add tracking event error:', error);
    res.status(500).json({ error: 'Failed to add tracking event' });
  }
};
