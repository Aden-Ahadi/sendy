module.exports = function handler(req, res) {
  res.json({
    status: 'healthy',
    service: 'Sendy API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
};
