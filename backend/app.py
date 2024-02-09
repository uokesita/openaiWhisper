import os
import flask
from flask import request
from flask_cors import CORS
import whisper

app = flask.Flask(__name__)
CORS(app)


@app.route('/transcribe', methods=['POST'])
def transcribe():
    if request.method == 'POST':
        audio_model = whisper.load_model("small")
        audio_file = request.files['audio_data']
        print(audio_file)

        save_path = os.path.join('./', 'test.wav')
        wav_file = request.files['audio_data']
        wav_file.save(save_path)

        result = audio_model.transcribe(save_path)
        print(result)

        return result['text']
    else:
        return "This endpoint only processes POST wav blob"