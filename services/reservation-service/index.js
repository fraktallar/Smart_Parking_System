const express = require('express');
const amqp = require('amqplib');
const { publishEvent } = require('./rabbitmq');

const app = express();
app.use(express.json());

const reservations = {};

app.post('/api/v1/reservations', async (req, res) => {
  const { userId, parkingSpotId, amount } = req.body;
  const reservationId = `RES-${Date.now()}`;

  reservations[reservationId] = {
    id: reservationId,
    userId,
    parkingSpotId,
    amount,
    status: 'PENDING'
  };

  console.log(`[SAGA STARTED] Rezervasyon Oluşturuldu: ${reservationId} (PENDING)`);

  await publishEvent('reservation.created', {
    reservationId,
    parkingSpotId,
    amount,
    userId
  });

  return res.status(202).json({
    message: 'Rezervasyon talebi alındı, işleniyor...',
    reservationId,
    status: 'PENDING'
  });
});

async function consumeSagaEvents() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  const channel = await connection.createChannel();
  await channel.assertExchange('parking_events', 'topic', { durable: true });

  const q = await channel.assertQueue('reservation_saga_queue');
  await channel.bindQueue(q.queue, 'parking_events', 'parking.reserved');
  await channel.bindQueue(q.queue, 'parking_events', 'payment.success');
  await channel.bindQueue(q.queue, 'parking_events', 'payment.failed');

  channel.consume(q.queue, (msg) => {
    const event = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;

    console.log(`[SAGA EVENT RECEIVED] -> ${routingKey}`, event);

    if (routingKey === 'parking.reserved') {
      publishEvent('payment.process', {
        reservationId: event.reservationId,
        amount: event.amount
      });
    }

    if (routingKey === 'payment.success') {
      if (reservations[event.reservationId]) {
        reservations[event.reservationId].status = 'CONFIRMED';
        console.log(`[SAGA SUCCESS] Rezervasyon Onaylandı: ${event.reservationId}`);
      }
    }

    if (routingKey === 'payment.failed') {
      if (reservations[event.reservationId]) {
        reservations[event.reservationId].status = 'CANCELLED';
        console.log(`[SAGA COMPENSATE] Ödeme Başarısız! Rezervasyon İptal Edildi: ${event.reservationId}`);

        publishEvent('parking.release', {
          parkingSpotId: reservations[event.reservationId].parkingSpotId,
          reservationId: event.reservationId
        });
      }
    }

    channel.ack(msg);
  });
}

consumeSagaEvents();
app.listen(3003, () => console.log('Reservation Service 3003 portunda çalışıyor.'));