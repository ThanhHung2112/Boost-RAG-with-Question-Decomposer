import os
from redis import Redis
from rq import Worker, Queue
# Create Redis connection with proper timeout
redis_conn = Redis(
    socket_timeout=500  # Higher than default dequeue_timeout (405)
)

# Define queue names to listen to
queues = ['default']

if __name__ == '__main__':
    # Create worker with explicit connection
    worker = Worker(
        queues=[Queue(name, connection=redis_conn) for name in queues],
        connection=redis_conn,
    )
    worker.work()