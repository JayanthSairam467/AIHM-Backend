import _IORedis from 'ioredis';
const IORedis = _IORedis as unknown as typeof _IORedis.default;

let connection: InstanceType<typeof IORedis> | null = null;

export function getRedisConnection(url: string): InstanceType<typeof IORedis> {
  if (!connection) {
    connection = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
}

export function createRedisConnection(url: string): InstanceType<typeof IORedis> {
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
