import { useRef } from "react";
import "./App.css";

function App() {
  const downloadLinkRef = useRef(null);
  const countDownRef = useRef(null);
  const videoRef = useRef(null);

  let blob = null;
  let videoStream = null;

  const startScreenCapturing = async (e) => {
    e.preventDefault();

    if (!navigator.mediaDevices.getDisplayMedia) {
      return alert("Screen capturing is not supported in your browser!");
    }

    try {
      if (!videoStream?.active) {
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          surfaceSwitching: "include",
        });

        const audioStream = await navigator.mediaDevices.getDisplayMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });

        const audioTrack = audioStream.getTracks()[0];

        videoStream.addTrack(audioTrack);
        recordStream(videoStream);
      } else {
        throw new Error(
          "There is an ongoing recording. Please stop it before recording a new one"
        );
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const recordStream = (stream) => {
    countDown();
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp8,opus",
    });
    const recordedChunks = [];
    mediaRecorder.addEventListener("dataavailable", (e) => {
      recordedChunks.push(e.data);
    });

    // stop recording and audio streaming when video streaming stops
    stream.getVideoTracks()[0]?.addEventListener("ended", () => {
      mediaRecorder.stop();
      stream.getAudioTracks()[0]?.stop();
    });

    mediaRecorder.addEventListener("stop", () => {
      createVideoBlob(recordedChunks);
      showRecordedVideo(blob);
    });

    setTimeout(() => mediaRecorder.start(), 4000);
  };

  const createVideoBlob = (recordedChunks) => {
    blob = new Blob(recordedChunks, {
      type: recordedChunks[0].type,
    });
  };

  const showRecordedVideo = () => {
    videoRef.current.src = URL.createObjectURL(blob);
    calculateVideoDuration();
  };

  const calculateVideoDuration = () => {
    videoRef.current.addEventListener("loadedmetadata", () => {
      if (videoRef.current.duration === Infinity) {
        videoRef.current.currentTime = 1e101;
        videoRef.current.addEventListener(
          "timeupdate",
          () => {
            videoRef.current.currentTime = 0;
          },
          {
            once: true,
          }
        );
      }
    });
  };

  const countDown = () => {
    countDownRef.current.style.display = "grid";
    let count = 3;

    const reduceCount = () => {
      countDownRef.current.textContent = count;
      count--;

      if (count >= 0) {
        setTimeout(() => reduceCount(), 1000);
      } else {
        countDownRef.current.style.display = "none";
      }
    };

    reduceCount();
  };

  const downloadHandler = () => {
    downloadLinkRef.current.href = URL.createObjectURL(blob);
    const fileName = prompt("What is the name of this recording?");
    downloadLinkRef.current.download = `${fileName}.webm`;
    downloadLinkRef.current.type = "video/webm";
  };

  return (
    <div className="App">
      <p className="countdown" ref={countDownRef}></p>
      <div className="screen-recorder">
        <h1>Capture your screen</h1>
        <video controls preload="metadata" ref={videoRef} />

        <div>
          <button className="btn" onClick={startScreenCapturing}>
            Start Recording
          </button>
          <a
            href=""
            className="btn"
            ref={downloadLinkRef}
            onClick={downloadHandler}
          >
            Download Video
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
