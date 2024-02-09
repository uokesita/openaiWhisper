import { useState, useRef } from "react";

const mimeType = "audio/webm";

const AudioRecorder = () => {
	const mediaRecorder = useRef(null);
	const [permission, setPermission] = useState(false);
	const [recordingStatus, setRecordingStatus] = useState("inactive");
	const [stream, setStream] = useState(null);
	const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
	const [audioChunks, setAudioChunks] = useState([]);
  const [transcription, setTranscription] = useState(null);;

	const getMicrophonePermission = async () => {
		if ("MediaRecorder" in window) {
			try {
				const mediaStream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: false,
				});
				setPermission(true);
				setStream(mediaStream);
			} catch (err) {
				alert(err.message);
			}
		} else {
			alert("The MediaRecorder API is not supported in your browser.");
		}
	};

	const startRecording = async () => {
		setRecordingStatus("recording");
    setAudioBlob(null);
    setAudioURL(null);
    setTranscription(null);

		const media = new MediaRecorder(stream, { type: mimeType });
		mediaRecorder.current = media;
		mediaRecorder.current.start();
		let localAudioChunks = [];

		mediaRecorder.current.ondataavailable = (event) => {
			if (typeof event.data === "undefined") return;
			if (event.data.size === 0) return;
			localAudioChunks.push(event.data);
		};

		setAudioChunks(localAudioChunks);
	};

	const stopRecording = () => {
    setTranscription(null);
		setRecordingStatus("inactive");
		mediaRecorder.current.stop();

		mediaRecorder.current.onstop = () => {
			const audioBlob = new Blob(audioChunks, { type: mimeType });
			const audioUrl = URL.createObjectURL(audioBlob);

      setAudioBlob(audioBlob);
			setAudioURL(audioUrl);

			setAudioChunks([]);
		};
	};

  const sendAudioToBackend = async () => {
    setTranscription(null);
    const formData = new FormData();
    formData.append('audio_data', audioBlob);

    try {
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Network response was not ok.');
      const data = await response.text();
      return setTranscription(data);
    } catch (error) {
      console.error('Error sending audio to backend:', error);
    }
  };

	return (
		<div>
			<h2>Audio Recorder + Whisper Transcription</h2>
			<main>
				<div className="audio-controls">
					{!permission && (
						<button onClick={getMicrophonePermission} type="button">
							Get Microphone
						</button>
					)}
					{permission && recordingStatus === "inactive" && (
						<button onClick={startRecording} type="button">
							Start Recording
						</button>
					)}
					{recordingStatus === "recording" && (
						<button onClick={stopRecording} type="button">
							Stop Recording
						</button>
					)}
				</div>
				{audioBlob && (
					<div className="audio-player">
						<audio src={audioURL} controls></audio>
						<a download className="download-link" href={audioURL}>
							Download Recording
						</a>
            <button onClick={sendAudioToBackend} type="button">
              Send Audio To Whisper
						</button>
					</div>
				)}
        {audioBlob && transcription && (
          <div className="transcription">
            {transcription}
          </div>
        )}
			</main>
		</div>
	);
};

export default AudioRecorder;