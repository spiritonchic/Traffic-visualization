from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from collections import deque

app = Flask(__name__)
CORS(app)

buffer = deque(maxlen=1000)


@app.route('/receive', methods=['POST'])
def receive():
    data = request.get_json()
    buffer.append(data)
    return jsonify({"status": "received"})


@app.route('/data', methods=['GET'])
def get_data():
    global buffer
    res = jsonify(list(buffer))
    buffer = deque(maxlen=1000)
    return res


@app.route('/')
def serve_index():
    return send_from_directory('/frontend', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('/frontend', path)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
