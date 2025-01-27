import Redis from "ioredis";
const connection = new Redis(process.env.NEXT_PUBLIC_REDIS_URL!);
