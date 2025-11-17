/**
 * 从视频文件中提取指定数量的帧
 * @param videoFile 视频文件
 * @param frameCount 要提取的帧数量
 * @returns 返回提取的帧图片数据URL数组
 */
export async function extractFramesFromVideo(
  videoFile: File,
  frameCount: number
): Promise<string[]> {
  // 创建一个隐藏的video元素用于处理视频
  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = false;
  video.playsInline = true;

  return new Promise((resolve, reject) => {
    // 当视频元数据加载完成时执行
    video.addEventListener('loadedmetadata', async () => {
      try {
        const frames: string[] = [];
        const duration = video.duration;
        
        // 计算每帧之间的时间间隔
        const interval = duration / (frameCount + 1);
        
        // 创建canvas用于绘制视频帧
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('无法创建Canvas上下文');
        }
        
        // 设置canvas尺寸与视频一致
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // 提取每一帧
        for (let i = 0; i < frameCount; i++) {
          // 计算当前帧的时间点
          const time = (i + 1) * interval;
          
          // 设置视频播放位置
          video.currentTime = time;
          
          // 等待视频在新时间点准备好
          await new Promise<void>((resolveWait) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolveWait();
            };
            video.addEventListener('seeked', onSeeked);
          });
          
          // 绘制当前帧到canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 将图像转换为数据URL并添加到结果数组
          frames.push(canvas.toDataURL('image/jpeg', 0.9));
          
          // 清除canvas准备下一帧
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        resolve(frames);
      } catch (err) {
        reject(err);
      } finally {
        // 清理video元素
        video.remove();
      }
    });

    // 错误处理
    video.addEventListener('error', (err) => {
      video.remove();
      reject(err);
    });

    // 开始加载视频
    video.src = URL.createObjectURL(videoFile);
  });
}