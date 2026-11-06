// api-gateway/index.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8000;

// Loglama ve İstek Takibi için Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  console.log(`[GATEWAY] [${new Date().toISOString()}] ${req.method} ${req.url} - CorrelationID: ${correlationId}`);
  next();
});

// Servis Yönlendirmeleri (Reverse Proxy)
app.use('/api/v1/auth', createProxyMiddleware({ target: process.env.AUTH_SERVICE_URL, changeOrigin: true }));
app.use('/api/v1/parkings', createProxyMiddleware({ target: process.env.PARKING_SERVICE_URL, changeOrigin: true }));
app.use('/api/v2/parkings', createProxyMiddleware({ target: process.env.PARKING_SERVICE_URL, changeOrigin: true })); // Versiyonlama
app.use('/api/v1/reservations', createProxyMiddleware({ target: process.env.RESERVATION_SERVICE_URL, changeOrigin: true }));
app.use('/api/v1/payments', createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL, changeOrigin: true }));

app.listen(PORT, () => {
  console.log(`API Gateway ${PORT} portunda çalışıyor.`);
});