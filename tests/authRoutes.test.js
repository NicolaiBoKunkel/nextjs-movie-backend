const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectToDatabase, getMongoServer } = require('../server.js');

const testEmail = 'jestuser@example.com';
const testPassword = 'Test1234!';
const testUsername = 'jestuser';

let token = '';

beforeAll(async () => {
  await connectToDatabase(); // Just connect — do NOT call app.listen()
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteOne({ email: testEmail });
  await mongoose.connection.close();

  const mongoServer = getMongoServer();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUsername,
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/registered/i);
  });

  it('should log in the user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should return user info when using valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testEmail);
    expect(res.body.username).toBe(testUsername);
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('should return 403 for invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer faketoken');

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/invalid token/i);
  });
});
