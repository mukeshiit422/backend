const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

exports.createSession = async (req, res) => {
  const sessionId = uuidv4();
  const data = { status: 'pending', createdAt: Date.now() };
  const redis = req.app.locals.redisClient;

  await redis.setEx(sessionId, 300, JSON.stringify(data));
  const qrDataUrl = await QRCode.toDataURL(`http://localhost:3000/auth/${sessionId}`);
  res.json({ sessionId, qrCode: qrDataUrl });
};

exports.approveSession = async (req, res) => {
  const { sessionId, user } = req.body;
  const redis = req.app.locals.redisClient;
  const session = await redis.get(sessionId);
  if (!session) return res.status(404).send('Session expired');

  const newData = { ...JSON.parse(session), status: 'approved', user };
  await redis.setEx(sessionId, 300, JSON.stringify(newData));
  res.sendStatus(200);
};

exports.getSessionStatus = async (req, res) => {
  const redis = req.app.locals.redisClient;
  const session = await redis.get(req.params.id);
  if (!session) return res.status(404).send('Session expired');

  const data = JSON.parse(session);
  if (data.status === 'approved') {
    const token = jwt.sign({ user: data.user }, JWT_SECRET);
    return res.json({ status: 'approved', token });
  }

  res.json({ status: 'pending' });
};
