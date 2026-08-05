import time
import socketio
import os

SOCKETIO_SERVER_URL = os.getenv('SOCKETIO_SERVER_URL', 'http://localhost:8003')

sio = socketio.Client()

results = []

@sio.event
def on_connect():
    print('[ping_pong_test] Connected to', SOCKETIO_SERVER_URL)


# Use explicit handler registration
@sio.on('pong_test')
def on_pong(data):
    seq = data.get('seq')
    ts = data.get('ts')
    now = time.time()
    rtt = (now - ts) * 1000.0
    print(f'[pong] seq={seq} rtt={rtt:.2f}ms')
    results.append(rtt)


def run_test(count=10, delay=0.1, timeout=5.0):
    # Connect using websocket-only transport to match server config
    # Include an Origin header the server accepts (matches frontend dev URL)
    sio.connect(SOCKETIO_SERVER_URL, transports=['websocket'], headers={'Origin': 'http://localhost:5173'})

    for i in range(count):
        payload = {'seq': i, 'ts': time.time()}
        sio.emit('ping_test', payload)
        # Wait up to timeout for reply
        start = time.time()
        while len(results) <= i and (time.time() - start) < timeout:
            time.sleep(0.01)
        if len(results) <= i:
            print(f'[timeout] seq={i} no reply within {timeout}s')
        time.sleep(delay)

    sio.disconnect()

    if results:
        import statistics
        print('\n--- ping-pong summary ---')
        print(f'count: {len(results)}')
        print(f'mean: {statistics.mean(results):.2f} ms')
        print(f'median: {statistics.median(results):.2f} ms')
        print(f'min: {min(results):.2f} ms')
        print(f'max: {max(results):.2f} ms')
    else:
        print('No responses received')


if __name__ == '__main__':
    run_test(count=10, delay=0.05)
