const request = require('supertest');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { app, mongoServer } = require('../server.js'); // 👈 updated import

dotenv.config();

describe('TMDb Public Routes', () => {
  it('should fetch popular movies', async () => {
    const res = await request(app).get('/api/movies/popular');
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBeDefined();
  });

  it('should return 400 for empty search', async () => {
    const res = await request(app).get('/api/search');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing search query/);
  });
});

afterAll(async () => {
  // Close MongoDB connection
  await mongoose.connection.close();

  // Stop in-memory MongoDB if running
  if (mongoServer) {
    await mongoServer.stop();
  }
});
