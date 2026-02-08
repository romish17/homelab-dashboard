export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://homelab:changeme@localhost:5432/homelab',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
};
