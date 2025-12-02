const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;

export class SoundSystem {
  private audioCtx: AudioContext;
  private soundCtx: AudioContext;
  private music: AudioBufferSourceNode | null = null;

  constructor() {
    this.audioCtx = new AudioContextConstructor();
    this.soundCtx = new AudioContextConstructor();
  }

  playSound(name: string): void {
    this.getFile('assets/sounds/' + name).then(snd => {
      // check if context is in suspended state (autoplay policy)
      if (this.soundCtx.state === 'suspended') {
        this.soundCtx.resume();
      }
      this.playTrack(snd, this.soundCtx);
    });
  }

  playSoundByPath(path: string): void {
    this.getFile(path).then(snd => {
      // check if context is in suspended state (autoplay policy)
      if (this.soundCtx.state === 'suspended') {
        this.soundCtx.resume();
      }
      this.playTrack(snd, this.soundCtx);
    });
  }

  playBackgroundMusic(name: string): void {
    this.stopBackgroundMusic();
    this.loadFile('assets/musics/' + name).then(track => {
      // check if context is in suspended state (autoplay policy)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.music = this.playTrack(track, this.audioCtx);
      this.music.loop = true;
    });
  }

  playBackgroundMusicByPath(path: string): void {
    this.stopBackgroundMusic();
    this.loadFile(path).then(track => {
      // check if context is in suspended state (autoplay policy)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.music = this.playTrack(track, this.audioCtx);
      this.music.loop = true;
    });
  }

  stopBackgroundMusic(): void {
    if (this.music !== null && this.music !== undefined) {
      this.music.stop();
      this.music = null;
    }
  }

  private async loadFile(filePath: string): Promise<AudioBuffer> {
    this.audioCtx = new AudioContextConstructor();
    return await this.getFile(filePath);
  }

  private async getFile(filepath: string): Promise<AudioBuffer> {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioCtx.decodeAudioData(arrayBuffer);
  }

  private playTrack(audioBuffer: AudioBuffer, context: AudioContext): AudioBufferSourceNode {
    const trackSource = context.createBufferSource();
    trackSource.buffer = audioBuffer;
    trackSource.connect(context.destination);
    trackSource.start();

    return trackSource;
  }
}
