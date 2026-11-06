const amqp = require('amqplib');

let channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    channel = await connection.createChannel();
    
    await channel.assertExchange('parking_events', 'topic', { durable: true });
    console.log('RabbitMQ Bağlantısı Başarılı');
    return channel;
  } catch (error) {
    console.error('RabbitMQ Bağlantı Hatası:', error);
    setTimeout(connectRabbitMQ, 5000); // Hata durumunda tekrar dene
  }
}

async function publishEvent(routingKey, data) {
  if (!channel) await connectRabbitMQ();
  channel.publish('parking_events', routingKey, Buffer.from(JSON.stringify(data)));
  console.log(`[EVENT PUBLISHED] -> ${routingKey}`, data);
}

module.exports = { connectRabbitMQ, publishEvent };