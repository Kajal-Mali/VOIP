const localVideo = document.getElementById('localVideo');
    const timerElement = document.getElementById('timer');
    let localStream, peerConnection, screenStream, mediaRecorder, recordingInterval;
    const recordedChunks = [];
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    async function startCall() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        peerConnection = new RTCPeerConnection(config);

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        alert('Call started! You can now invite your friends.');
      } catch (error) {
        alert('Error accessing camera or microphone: ' + error.message);
      }
    }

    async function inviteFriend() {
      const roomId = generateRoomId();
      const inviteLink = `${window.location.origin}?room=${roomId}`;
      alert(`Share this link with your friend to join the call: ${inviteLink}`);
      console.log(`Invite Link: ${inviteLink}`);
    }

    function generateRoomId() {
      return Math.random().toString(36).substring(2, 10);
    }

    async function shareScreen() {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: true
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(screenTrack);

        screenTrack.onended = () => stopSharing();
        alert('You are now sharing your screen.');
      } catch (error) {
        alert('Error sharing screen: ' + error.message);
      }
    }

    function stopSharing() {
      if (screenStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(videoTrack);
        screenStream.getTracks().forEach(track => track.stop());
        alert('Screen sharing stopped.');
      }
    }

    function startRecording() {
      try {
        mediaRecorder = new MediaRecorder(localStream);
        mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
        mediaRecorder.start();

        let seconds = 0;
        recordingInterval = setInterval(() => {
          seconds++;
          const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
          const secs = String(seconds % 60).padStart(2, '0');
          timerElement.textContent = `${mins}:${secs}`;
        }, 1000);

        alert('Recording started');
      } catch (error) {
        alert('Error starting recording: ' + error.message);
      }
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'recording.webm';
          a.click();
          alert('Recording saved');
        };
        clearInterval(recordingInterval);
        timerElement.textContent = "00:00";
      }
    }

    function endCall() {
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        localVideo.srcObject = null;
        alert('Call ended');
      }
    }