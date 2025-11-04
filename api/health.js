module.exports = (req, res) => {
  res.status(200).json({ ok: true, service: 'logistics-mono', ts: new Date().toISOString() });
};
