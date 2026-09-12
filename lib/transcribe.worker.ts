import { pipeline, type AutomaticSpeechRecognitionPipeline, type ProgressInfo } from '@huggingface/transformers';

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

async function prepareTranscriber() {
  if (transcriber) return transcriber;
  if (!transcriberPromise) {
    self.postMessage({ type: 'status', message: '首次使用：正在下载英语识别模型…' });
    const device = 'gpu' in navigator ? 'webgpu' : 'wasm';
    transcriberPromise = pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', {
      device,
      dtype: device === 'webgpu' ? 'fp32' : 'q8',
      progress_callback: (progress: ProgressInfo) => {
        if ('progress' in progress && typeof progress.progress === 'number') self.postMessage({ type: 'progress', value: Math.round(progress.progress) });
      },
    }).then(model => {
      transcriber = model;
      return model;
    }).catch(error => {
      transcriberPromise = null;
      throw error;
    });
  }
  return transcriberPromise;
}

self.onmessage = async (event: MessageEvent<{ type?: 'init' | 'transcribe'; audio?: Float32Array }>) => {
  try {
    const model = await prepareTranscriber();
    if (event.data.type === 'init') {
      self.postMessage({ type: 'ready' });
      return;
    }
    if (!event.data.audio) throw new Error('没有收到可识别的音轨数据');
    self.postMessage({ type: 'status', message: '正在识别并生成时间轴…' });
    const result = await model(event.data.audio, { return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 });
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : '本地字幕识别失败' });
  }
};
