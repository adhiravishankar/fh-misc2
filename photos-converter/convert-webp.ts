// convertToWebP.ts

import sharp from 'sharp';
import * as fse from 'fs-extra';
import * as path from 'path';
import { v4 } from 'uuid';
import * as os from 'os';

// Configuration
const INPUT_DIR = './input_images';
const OUTPUT_DIR = './output_images';
const WEBP_QUALITY = 90; // Adjust quality (0-100)
const MAX_CONCURRENT_JOBS = Math.min(os.cpus().length, 4); // Limit concurrent jobs

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp', '.avif'];

interface ConversionResult {
  fileName: string;
  success: boolean;
  error?: string;
  inputSize?: number;
  outputSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  processingTime?: number;
}

/**
 * Converts all images in the input directory to WebP format using parallel processing
 */
async function convertImagesToWebP(): Promise<void> {
  console.log('🚀 Starting parallel image conversion to WebP...\n');
  const startTime = Date.now();

  try {
    // Ensure input directory exists
    const inputExists = await fse.pathExists(INPUT_DIR);
    if (!inputExists) {
      console.error(`❌ Input directory '${INPUT_DIR}' does not exist!`);
      return;
    }

    // Ensure output directory exists (create if it doesn't)
    await fse.ensureDir(OUTPUT_DIR);
    console.log(`✅ Output directory '${OUTPUT_DIR}' is ready.\n`);

    // Read all files from input directory
    const files = await fse.readdir(INPUT_DIR);

    // Filter for supported image files
    const imageFiles = files.filter((file: string): boolean => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('⚠️  No supported image files found in the input directory.');
      return;
    }

    console.log(`📁 Found ${imageFiles.length} image(s) to convert using ${MAX_CONCURRENT_JOBS} parallel workers:\n`);

    // Process images in parallel batches
    const results: ConversionResult[] = [];
    const batches = createBatches(imageFiles, MAX_CONCURRENT_JOBS);

    for (const batch of batches) {
      const batchPromises = batch.map((file, index) => 
        processImage(file, results.length + index + 1, imageFiles.length)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            fileName: batch[index],
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }

    const totalTime = Date.now() - startTime;
    
    // Display summary
    displaySummary(results, totalTime);

  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Create batches for parallel processing
 */
function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Process a single image file with memory optimization
 */
async function processImage(
  file: string,
  current: number,
  total: number
): Promise<ConversionResult> {
  const inputPath = path.join(INPUT_DIR, file);
  const outputFileName = `${v4()}.webp`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);
  const startTime = Date.now();

  console.log(`[${current}/${total}] Converting: ${file}`);

  try {
    // Get input file stats
    const inputStats = await fse.stat(inputPath);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);

    // Convert to WebP using sharp with memory optimization
    const pipeline = sharp(inputPath, {
      // Limit memory usage
      limitInputPixels: 268402689, // 16384 x 16384
      sequentialRead: true
    });

    const info = await pipeline
      .webp({ 
        effort: 6,
        quality: WEBP_QUALITY,
        alphaQuality: 100
      })
      .toFile(outputPath);

    // Get output file size
    const outputStats = await fse.stat(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    const processingTime = Date.now() - startTime;

    console.log(`   ✅ Success: ${outputFileName} (${processingTime}ms)`);
    console.log(`   📊 Size: ${inputSizeMB}MB → ${outputSizeMB}MB (${reduction}% reduction)`);
    console.log(`   📐 Dimensions: ${info.width}x${info.height}\n`);

    return {
      fileName: file,
      success: true,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      dimensions: {
        width: info.width,
        height: info.height
      },
      processingTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error converting ${file}: ${errorMessage}\n`);

    return {
      fileName: file,
      success: false,
      error: errorMessage,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Display conversion summary with performance metrics
 */
function displaySummary(results: ConversionResult[], totalTime: number): void {
  console.log('━'.repeat(60));
  console.log('\n📊 Conversion Summary:');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`   ✅ Successfully converted: ${successful.length} image(s)`);
  console.log(`   ⏱️  Total processing time: ${(totalTime / 1000).toFixed(2)}s`);
  
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + (r.processingTime || 0), 0) / successful.length;
    console.log(`   📈 Average time per image: ${avgTime.toFixed(0)}ms`);
  }

  if (failed.length > 0) {
    console.log(`   ❌ Failed conversions: ${failed.length} image(s)`);
    failed.forEach(f => {
      console.log(`      - ${f.fileName}: ${f.error}`);
    });
  }

  // Calculate total size reduction
  if (successful.length > 0) {
    const totalInputSize = successful.reduce((sum, r) => sum + (r.inputSize || 0), 0);
    const totalOutputSize = successful.reduce((sum, r) => sum + (r.outputSize || 0), 0);
    const totalReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);

    console.log(`   💾 Total size reduction: ${totalReduction}%`);
    console.log(`   📦 Total space saved: ${((totalInputSize - totalOutputSize) / 1024 / 1024).toFixed(2)}MB`);
  }

  console.log(`   📁 Output directory: ${OUTPUT_DIR}\n`);
}

// Run the conversion
convertImagesToWebP();
