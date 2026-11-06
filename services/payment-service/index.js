const amqp = require('amqplib');

async function startPaymentConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  const channel = await connection.createChannel();
  await channel.assertExchange('parking_events', 'topic', { durable: true });

  const q = await channel.assertQueue('payment_queue');
  await channel.bindQueue(q.queue, 'parking_events', 'payment.process');

  channel.consume(q.queue, (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log(`[PAYMENT] Ödeme İşleniyor... Tutar: ${data.amount} TL`);

    const isSuccess = data.amount <= 500;

    if (isSuccess) {
      console.log(`[PAYMENT SUCCESS] Ödeme Başarılı: ${data.reservationId}`);
      channel.publish('parking_events', 'payment.success', Buffer.from(JSON.stringify({
        reservationId: data.reservationId
      })));
    } else {
      console.error(`[PAYMENT FAILED] Yetersiz Bakiye! Telafi Başlatılıyor...`);
      channel.publish('parking_events', 'payment.failed', Buffer.from(JSON.stringify({
        reservationId: data.reservationId,
        reason: 'INSUFFICIENT_FUNDS'
      })));
    }

    channel.ack(msg);
  });
}

startPaymentConsumer();