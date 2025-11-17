import * as MP4Box from "mp4box";
/**
 * 从视频文件中提取指定数量的帧
 * @param videoFile 视频文件
 * @param frameCount 要提取的帧数量
 * @returns 返回提取的帧图片数据URL数组
 */
export async function extractFramesFromVideo(
  videoFile: File,
  frameCount: number,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const mp4box = MP4Box.createFile();
    mp4box.discardMdatData = false;
    let videoDecoder: VideoDecoder;
    let frameIndices: number[] = [];
    const frames: string[] = [];
    let samplesDecodedCount = 0;
    const handleVideoFrame = (videoFrame: VideoFrame) => {
      if (frameIndices.includes(samplesDecodedCount++)) {
        // 在 Web Worker 中，需要创建一个 OffscreenCanvas
        // 在主线程中，可以使用 Canvas
        const canvas = document.createElement("canvas");
        canvas.width = videoFrame.displayWidth;
        canvas.height = videoFrame.displayHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(videoFrame, 0, 0);
        frames.push(canvas.toDataURL("image/jpeg", 0.9));

        // 释放 VideoFrame 内存
        videoFrame.close();
        // 3. 检查是否达到目标帧数并完成 Promise
        if (frames.length >= frameIndices.length) {
          videoDecoder?.close();
          mp4box.stop();
          resolve(frames);
        }
      } else {
        videoFrame.close();
      }
    };

    const loadFile = async (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arraybuffer = reader.result as MP4Box.MP4BoxBuffer;
        arraybuffer.fileStart = 0;
        mp4box.appendBuffer(arraybuffer);
        mp4box.flush();
      };
      reader.readAsArrayBuffer(file);
    };

    mp4box.onReady = async (info: MP4Box.Movie) => {
      videoDecoder = new VideoDecoder({
        output: handleVideoFrame,
        error: (error) => {
          console.log(error);
        },
      });

      const videoTrack = info.videoTracks[0];
      console.log(info);
      const nbSampleTotal = videoTrack.nb_samples;
      frameIndices = calculateFrameIndices(
        nbSampleTotal,
        Math.min(frameCount, nbSampleTotal),
        true,
      ); // 计算帧索引
      console.log(frameIndices, nbSampleTotal);
      mp4box.setExtractionOptions(videoTrack.id, "video", {
        nbSamples: nbSampleTotal,
      });

      const videoWidth = videoTrack.track_width;
      const videoHeight = videoTrack.track_height;

      const config: VideoDecoderConfig = {
        codec: videoTrack.codec,
        codedWidth: videoWidth,
        codedHeight: videoHeight,
        description: getExtraData(mp4box, videoTrack),
      };

      const { supported } = await VideoDecoder.isConfigSupported(config);
      console.log(supported);

      if (!supported) {
        console.error("不支持的编码格式");
        reject("不支持的编码格式");
      }

      videoDecoder.configure(config);
      mp4box.start();
    };

    mp4box.onSamples = function (id, ref, samples) {
      console.log(samples);
      for (const sample of samples) {
        // 转换 MP4Box 样本为 EncodedVideoChunk
        const chunk = new EncodedVideoChunk({
          type: sample.is_sync ? "key" : "delta", // 关键帧 vs 增量帧
          timestamp: sample.cts, // 组合时间戳
          duration: sample.duration,
          data: sample.data as Uint8Array<ArrayBuffer>, // 样本数据 (ArrayBuffer)
        });

        // 喂给 VideoDecoder 进行解码
        videoDecoder.decode(chunk);
      }
      videoDecoder.flush();
    };

    loadFile(videoFile);
  });
}

function getExtraData(file: any, track: any) {
  const trak = file.getTrackById(track.id);
  for (const entry of trak.mdia.minf.stbl.stsd.entries) {
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (box) {
      const stream = new MP4Box.DataStream(
        undefined,
        0,
        (MP4Box.DataStream as any).BIG_ENDIAN,
      );
      box.write(stream);
      return new Uint8Array(stream.buffer, 8); // Remove the box header.
    }
  }
}

/*
 * 该算法旨在在视频的总帧数中均匀地选取指定数量的帧，并确保包括第一帧和最后一帧（如果抽取数量足够）。
 * @param totalFrames 视频的总帧数（总样本数）。必须大于 0。
 * @param extractionCount 希望抽取的帧数。必须大于 0。
 * @param isZeroBased 样本序号是否从 0 开始 (true: 0, 1, 2... | false: 1, 2, 3...)。默认为 false (1-based)。
 * @returns 包含所有目标样本序号的数组。
 */
function calculateFrameIndices(
  totalFrames: number,
  extractionCount: number,
  isZeroBased: boolean = false,
): number[] {
  // 1. 输入校验
  if (totalFrames <= 0 || extractionCount <= 0) {
    return [];
  }

  const indices: number[] = [];
  const startOffset: number = isZeroBased ? 0 : 1; // 0-based 或 1-based 起始偏移

  // 2. 如果需要的抽取数大于等于总帧数，则抽取所有帧
  if (extractionCount >= totalFrames) {
    return Array.from({ length: totalFrames }, (_, i) => startOffset + i);
  }

  // 3. 计算间隔长度 (Step)
  // 使用 Math.floor 确保间隔是整数
  // 采用 (totalFrames - 1) / (extractionCount - 1) 计算方法，
  // 可以更好地均匀分配首尾帧之间的间隔，适用于大多数均匀采样场景。
  const step: number = (totalFrames - 1) / (extractionCount - 1);

  // 4. 循环生成样本序号
  for (let i = 0; i < extractionCount; i++) {
    let frameIndex: number;

    if (i === 0) {
      // 第一帧：总是起始帧
      frameIndex = startOffset;
    } else if (i === extractionCount - 1) {
      // 最后一帧：总是文件的最后一帧
      frameIndex = isZeroBased ? totalFrames - 1 : totalFrames;
    } else {
      // 中间帧：根据计算的浮点步长四舍五入到最近的整数帧
      // 采用 Math.round(i * step) 来获取更精确的中心点，然后加上起始偏移
      const zeroBasedIndex = Math.round(i * step);
      frameIndex = zeroBasedIndex + startOffset;

      // 确保不会因为四舍五入而出界或提前计算到最后一帧
      const lastIndex = isZeroBased ? totalFrames - 1 : totalFrames;
      frameIndex = Math.min(frameIndex, lastIndex);
    }

    // 确保不添加重复的序号（防止 step 较小导致中间帧和首/尾帧重复）
    if (indices.length > 0 && frameIndex === indices[indices.length - 1]) {
      continue;
    }

    indices.push(frameIndex);
  }

  return indices;
}
