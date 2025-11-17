import { ExtractionMethod } from "./extraction_method";

export class FrameExtractorService {
  static async extractFrames(
    method: ExtractionMethod,
    videoFile: File,
    frameCount: number,
  ): Promise<string[]> {
    switch (method) {
      case ExtractionMethod.VIDEO_ELEMENT:
        const { extractFramesFromVideo: extractWithVideo } = await import(
          "./extract_frame_with_video"
        );
        return extractWithVideo(videoFile, frameCount);

      case ExtractionMethod.MP4BOX:
        const { extractFramesFromVideo: extractWithMp4Box } = await import(
          "./extract_frame_with_mp4box"
        );
        return extractWithMp4Box(videoFile, frameCount);

      default:
        throw new Error(`Unsupported extraction method: ${method}`);
    }
  }
}
