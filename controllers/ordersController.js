const pool = require('../config/database');

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      customer_id,
      origin_warehouse_id,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_zip_code,
      delivery_latitude,
      delivery_longitude,
      priority,
      items,
      notes
    } = req.body;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    let total_weight = 0;
    let total_value = 0;

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, origin_warehouse_id, delivery_address, 
       delivery_city, delivery_state, delivery_zip_code, delivery_latitude, delivery_longitude, 
       priority, status, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11) 
       RETURNING *`,
      [orderNumber, customer_id, origin_warehouse_id, delivery_address, delivery_city, 
       delivery_state, delivery_zip_code, delivery_latitude, delivery_longitude, priority || 'standard', notes]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT weight, unit_price FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];
      total_weight += (product.weight || 0) * item.quantity;
      total_value += (product.unit_price || 0) * item.quantity;

      const inventoryCheck = await client.query(
        'SELECT quantity, reserved_quantity FROM inventory WHERE warehouse_id = $1 AND product_id = $2',
        [origin_warehouse_id, item.product_id]
      );

      if (inventoryCheck.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not available in warehouse ${origin_warehouse_id}`);
      }

      const availableQuantity = inventoryCheck.rows[0].quantity - inventoryCheck.rows[0].reserved_quantity;
      if (availableQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${availableQuantity}, Requested: ${item.quantity}`);
      }

      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [order.id, item.product_id, item.quantity, product.unit_price]
      );

      await client.query(
        'UPDATE inventory SET reserved_quantity = reserved_quantity + $1 WHERE warehouse_id = $2 AND product_id = $3',
        [item.quantity, origin_warehouse_id, item.product_id]
      );
    }

    await client.query(
      'UPDATE orders SET total_weight = $1, total_value = $2 WHERE id = $3',
      [total_weight, total_value, order.id]
    );

    await client.query('COMMIT');

    const fullOrderResult = await pool.query(
      `SELECT o.*, c.name as customer_name, w.name as warehouse_name,
       json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 
                                  'unit_price', oi.unit_price, 'product_name', p.name)) as items
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN warehouses w ON o.origin_warehouse_id = w.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id, c.name, w.name`,
      [order.id]
    );

    res.status(201).json({
      message: 'Order created successfully',
      order: fullOrderResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  } finally {
    client.release();
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, customer_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT o.*, c.name as customer_name, c.email as customer_email,
             w.name as warehouse_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN warehouses w ON o.origin_warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (customer_id) {
      query += ` AND o.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ orders: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, c.name as customer_name, c.email as customer_email,
              w.name as warehouse_name, w.address as warehouse_address,
              json_agg(json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', p.name,
                'sku', p.sku,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price
              )) as items
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN warehouses w ON o.origin_warehouse_id = w.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id, c.name, c.email, w.name, w.address`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order updated successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};
