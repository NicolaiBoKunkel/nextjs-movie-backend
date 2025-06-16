const request = require('supertest');
const dotenv = require('dotenv');
const server = require('../server.js');
const mongoose = require('mongoose'); // Add at top with other requires

dotenv.config();

describe('TMDb Public Routes', () => {
  it('should fetch popular movies', async () => {
    const res = await request(server).get('/api/movies/popular');
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBeDefined();
  });

  it('should return 400 for empty search', async () => {
    const res = await request(server).get('/api/search');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing search query/);
  });
});


afterAll(async () => {
  await mongoose.connection.close();
});
