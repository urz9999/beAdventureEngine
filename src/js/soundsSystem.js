AudioContext = window.AudioContext || window.webkitAudioContext;

class SoundSystem {

    audioCtx;
    soundCtx;

    constructor() {
        this.audioCtx = new AudioContext();
        this.soundCtx = new AudioContext();
        this.music = null;
    }

    playSound(name) {
        this.getFile('assets/sounds/' + name).then(snd => {
            // check if context is in suspended state (autoplay policy)
            if (this.soundCtx.state === 'suspended') {
                this.soundCtx.resume();
            }
            this.playTrack(snd);
        });
    }

    playBackgroundMusic(name) {
        this.stopBackgroundMusic();
        this.loadFile('assets/musics/' + name).then(track => {
            // check if context is in suspended state (autoplay policy)
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            this.music = this.playTrack(track);
            this.music.loop = true;
        });
    }

    stopBackgroundMusic() {
        if (this.music !== null && this.music !== undefined) {
            this.music.stop();
            this.music = null;
        }
    }

    async loadFile(filePath) {
        this.audioCtx = null;
        this.audioCtx = new AudioContext();
        return await this.getFile(filePath);
    }

    async getFile(filepath) {
        const response = await fetch(filepath);
        const arrayBuffer = await response.arrayBuffer();
        return await this.audioCtx.decodeAudioData(arrayBuffer);
    }

    playTrack(audioBuffer) {
        const trackSource = this.audioCtx.createBufferSource();
        trackSource.buffer = audioBuffer;
        trackSource.connect(this.audioCtx.destination)
        trackSource.start();

        return trackSource;
    }
}
